// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
// const { Card, Suggestion } = require('dialogflow-fulfillment');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

const not_understood = [
    "I am afraid I didn't understand what you just said. ",
    "I'm afraid I didn't understand what you said. Could you rephrase that? ",
    "I couldn't understand that. Could you repeat? ",
    "Sorry, what did you say? ",
    "I'm afraid I don't understand that. "
];

const examples_question = "I'm afraid I didn't understand again. Here are some examples of questions you could ask me: \n Do I need a visa? \n How is the year organised? \n What are the specificities of UCLouvain kots? \n Where are located the Student Support Services?";

const efa = {
    intents_complex: {
        "can-i-work": {
            options: {
                "student origin: EU": ["BE", "FR", "IT"],
                "student origin: non-EU": []
            },
            entity: "nationality",
            options_answers: {
                "student origin: EU": {
                    WEB_SERVER: "You are allowed to work, without needing a worf permit.<br><br>Test 2",
                    FACEBOOK: "You are allowed to work, without needing a worf permit.\n\nTest fb"
                },
                "student origin: non-EU": {
                    WEB_SERVER: "If you plan on working or on pursuing a paid internship, you need to get a Type C work permit.<br><br>Test.",
                    FACEBOOK: "If you plan on working or on pursuing a paid internship, you need to get a Type C work permit.<br><br>Test fb."
                }
            }
        }
    },
    entities_filling: {
        "nationality": {
            "question": "First, could you tell me your nationality?",
            "fallback": "I was actually expecting you to say where you are coming from.",
            "ack": "Got it. What do you want to know?"
        }
    }
};


exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({ request, response });


    function welcome(agent) {
        agent.add(`Welcome to my special agent!`);
    }

    function pick_one(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function random_default() {
        return pick_one(not_understood);
    }


    function most_recent_wait_entity(agent) {
        // return the moste recent entity. If none is found return undefined 
        
        let best_entity;
        let best_entity_lifespan = 0;
        for (let ctx of agent.contexts) {
            console.log("ctx :" + JSON.stringify(ctx));

            if (ctx.name.slice(0, 5) == "wait_") {
                if (ctx.lifespan > best_entity_lifespan) {
                    best_entity = ctx.name.slice(5);
                }
            }
        }
        return best_entity;
    }


    function fallback(agent) {
        let entity = most_recent_wait_entity(agent);
        const fallback_ctx_name = "fallback_ctx";

        // mecanism to give example of questions if too much error
        let give_question_example = false;

        let fallback_ctx = agent.getContext(fallback_ctx_name);
        if (fallback_ctx) {
            const cnt = fallback_ctx.parameters.cnt;
            const lifespan = fallback_ctx.lifespan;
            console.log("Lifespan : " + lifespan + ", cnt : " + cnt);
            if (cnt >= 3) {
                fallback_ctx.lifespan = -1;
                agent.add(examples_question);
                give_question_example = true;
            } else if (lifespan >= 2) {
                fallback_ctx.parameters.cnt += 2;
            } else {
                fallback_ctx.parameters.cnt += 1;
            }

            agent.setContext(fallback_ctx);

        } else {
            agent.setContext({ 'name': fallback_ctx_name, 'lifespan': 4, "parameters": { cnt: 1 } });
        }

        // mecanism in the case the chatbot is waiting for an entity
        if (entity && !give_question_example) {
            let r = efa.entities_filling[entity].fallback;
            agent.add(random_default() + r);
        }
    }


    function complex_handler(agent, base_intent) {

        let intent_data = efa.intents_complex[base_intent];
        let entity = intent_data.entity;

        let ctx = agent.getContext("ctx_" + entity);
        let ctx_val = ctx.parameters[entity];
        if (ctx_val.lenght && ctx_val.lenght > 1) {
            console.error('multiple value as entity :' + JSON.stringify(ctx_val));
            ctx_val = ctx_val[0];
        }


        // the default platform is FACEBOOK for the format of its answers
        let platform = (agent.requestSource == "WEB_SERVER") ? "WEB_SERVER" : "FACEBOOK";

        let cond_activated;
        for (let cond in intent_data.options) {
            let cond_array = intent_data.options[cond];

            if ((cond_activated === undefined && cond_array.lenght === 0) || cond_array.includes(ctx_val)) {
                cond_activated = cond;
            }
        }
        console.log(`cond activated: ${cond_activated}`);
        let r = intent_data.options_answers[cond_activated][platform];
        agent.setContext({ 'name': "wait_"+entity, 'lifespan': -1 });
        agent.add(r);
    }

    function intent_to_entity(intent) {
        return efa.intents_complex[intent].entity;
    }

    function find_intent_pending_question(agent) {
        // return the intent of the pending question
        for (let ctx of agent.contexts) {
            console.log("ctx :" + JSON.stringify(ctx));
    
            if (ctx.name.slice(0, 5) == "pend_" && agent.getContext("ctx_" + intent_to_entity(ctx.name.slice(5)))) {
                return ctx.name.slice(5);
            }
        }
    }

    function pending_question(agent) {
        let intent_pending_question = find_intent_pending_question(agent);
        complex_handler(agent, intent_pending_question);
        agent.setContext({ 'name': "pend_" + intent_pending_question, 'lifespan': -1 });
    }

    function can_i_work(agent) {
        complex_handler(agent, "can-i-work");
    }

    // Run the proper function handler based on the matched Dialogflow intent name
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);

    // visa handleling
    intentMap.set("can-i-work + nationality", can_i_work);
    intentMap.set("can-i-work - nationality", can_i_work);
    intentMap.set("ans:give-nationality + pend_can-i-work", pending_question);
    // intentMap.set("Visa", visa);

    agent.handleRequest(intentMap);
});
