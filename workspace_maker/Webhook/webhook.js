// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');

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
    "intents_complex": {
        "how-register-commune": {
            "options": {
                "student origin: EU": [
                    "AT",
                    "BE",
                    "BG",
                    "CZ",
                    "HR",
                    "CY",
                    "DK",
                    "EE",
                    "FI",
                    "FR",
                    "DE",
                    "GB",
                    "GR",
                    "HU",
                    "IE",
                    "IT",
                    "LV",
                    "LT",
                    "LU",
                    "MT",
                    "NL",
                    "PL",
                    "PT",
                    "RO",
                    "SI",
                    "SK",
                    "ES",
                    "SE"
                ],
                "student origin: non-EU": []
            },
            "entity": "nationality",
            "options_answers": {
                "student origin: EU": {
                    "WEB_SERVER": "Within 8 days after your arrival in Belgium, you must register with the local government of the town you reside in, by reporting to its Foreigners Department (\"Service des Étrangers\" in French) with documents specified by the town, which will charge a fee. It is advised to go there with a signed housing contract, your \"notice of registration and invoice\" and proof of registration from UCLouvain, your ID or passport In the following days, a police officer will come to your housing to verify your address. When your registration is complete, you will be sent a Registered Foreign Certificate (\"Certificat d'Inscription au Registre des Étrangers\" in French).<br><br>This validation is valid for 5 years.",
                    "FACEBOOK": "Within 8 days after your arrival in Belgium, you must register with the local government of the town you reside in, by reporting to its Foreigners Department (\"Service des Étrangers\" in French) with documents specified by the town, which will charge a fee. It is advised to go there with a signed housing contract, your \"notice of registration and invoice\" and proof of registration from UCLouvain, your ID or passport In the following days, a police officer will come to your housing to verify your address. When your registration is complete, you will be sent a Registered Foreign Certificate (\"Certificat d'Inscription au Registre des Étrangers\" in French).\n\nThis validation is valid for 5 years."
                },
                "student origin: non-EU": {
                    "WEB_SERVER": "Within 8 days after your arrival in Belgium, you must register with the municipality which you reside in, by reporting to its Foreigners Department (\"Service des Étrangers\" in French) with your ID or passport and visa, your accommodation lease and a passport-type photo of yourself. In the following days, a police officer will come to your housing to verify your address. You will then need to go back to the Foreigners Department to complete the process, and pay an €18 fee. When the registration process is completed, you will be sent a Registered Foreign Cerrtificate (\"Certificat d'Inscription au Registre des Étrangers\").<br><br>This registration is valid for one year.",
                    "FACEBOOK": "Within 8 days after your arrival in Belgium, you must register with the municipality which you reside in, by reporting to its Foreigners Department (\"Service des Étrangers\" in French) with your ID or passport and visa, your accommodation lease and a passport-type photo of yourself. In the following days, a police officer will come to your housing to verify your address. You will then need to go back to the Foreigners Department to complete the process, and pay an €18 fee. When the registration process is completed, you will be sent a Registered Foreign Cerrtificate (\"Certificat d'Inscription au Registre des Étrangers\").\n\nThis registration is valid for one year."
                }
            }
        },
        "do-i-need-visa": {
            "options": {
                "student origin: no_need_visa": [
                    "AT",
                    "BE",
                    "BG",
                    "CZ",
                    "HR",
                    "CY",
                    "DK",
                    "EE",
                    "FI",
                    "FR",
                    "DE",
                    "GB",
                    "GR",
                    "HU",
                    "IE",
                    "IT",
                    "LV",
                    "LT",
                    "LU",
                    "MT",
                    "NL",
                    "PL",
                    "PT",
                    "RO",
                    "SI",
                    "SK",
                    "ES",
                    "SE",
                    "IS",
                    "LI",
                    "MC",
                    "NO",
                    "CH"
                ],
                "student origin: need_visa": []
            },
            "entity": "nationality",
            "options_answers": {
                "student origin: need_visa": {
                    "WEB_SERVER": "If you are staying for more than 3 months, you have to ask for a visa.<br><br>To get it, you need to apply for a visa at the Belgian embassy or consulate in your home country.<br><br>The university can provide you with a registration authorisation letter to give the embassy. Some faculties can also provide you with a letter proving your intentions of enrolment.<br>Do this as soon as possible as it can take up to 60 days to get a visa.",
                    "FACEBOOK": "If you are staying for more than 3 months, you have to ask for a visa.\n\nTo get it, you need to apply for a visa at the Belgian embassy or consulate in your home country.\n\nThe university can provide you with a registration authorisation letter to give the embassy. Some faculties can also provide you with a letter proving your intentions of enrolment.\nDo this as soon as possible as it can take up to 60 days to get a visa."
                },
                "student origin: no_need_visa": {
                    "WEB_SERVER": "You do not need to have a visa.",
                    "FACEBOOK": "You do not need to have a visa."
                }
            }
        },
        "do-i-need-mutuelle": {
            "options": {
                "student origin: EU": [
                    "AT",
                    "BE",
                    "BG",
                    "CZ",
                    "HR",
                    "CY",
                    "DK",
                    "EE",
                    "FI",
                    "FR",
                    "DE",
                    "GB",
                    "GR",
                    "HU",
                    "IE",
                    "IT",
                    "LV",
                    "LT",
                    "LU",
                    "MT",
                    "NL",
                    "PL",
                    "PT",
                    "RO",
                    "SI",
                    "SK",
                    "ES",
                    "SE"
                ],
                "student origin: non-EU": []
            },
            "entity": "nationality",
            "options_answers": {
                "student origin: EU": {
                    "WEB_SERVER": "You don't need to subscribe to a health insurance if you have the European Health Insurance Card. If you don't have it, you should apply for it.<br>If you want to be reimbursed of a part of your health fees, you can subscribe to a health insurance.",
                    "FACEBOOK": "You don't need to subscribe to a health insurance if you have the European Health Insurance Card. If you don't have it, you should apply for it.\nIf you want to be reimbursed of a part of your health fees, you can subscribe to a health insurance."
                },
                "student origin: non-EU": {
                    "WEB_SERVER": "It is mandatory for you to subscribe to a health insurance. You are free to choose the one you think suits you best.",
                    "FACEBOOK": "It is mandatory for you to subscribe to a health insurance. You are free to choose the one you think suits you best."
                }
            }
        },
        "can-i-work": {
            "options": {
                "student origin: EU": [
                    "AT",
                    "BE",
                    "BG",
                    "CZ",
                    "HR",
                    "CY",
                    "DK",
                    "EE",
                    "FI",
                    "FR",
                    "DE",
                    "GB",
                    "GR",
                    "HU",
                    "IE",
                    "IT",
                    "LV",
                    "LT",
                    "LU",
                    "MT",
                    "NL",
                    "PL",
                    "PT",
                    "RO",
                    "SI",
                    "SK",
                    "ES",
                    "SE"
                ],
                "student origin: non-EU": []
            },
            "entity": "nationality",
            "options_answers": {
                "student origin: EU": {
                    "WEB_SERVER": "You are allowed to work, without needing a work permit.",
                    "FACEBOOK": "You are allowed to work, without needing a work permit."
                },
                "student origin: non-EU": {
                    "WEB_SERVER": "If you plan on working or on pursuing a paid internship, you need to get a Type C work permit.",
                    "FACEBOOK": "If you plan on working or on pursuing a paid internship, you need to get a Type C work permit."
                }
            }
        },
        "registration-cost": {
            "options": {
                "student origin: EU": [
                    "AT",
                    "BE",
                    "BG",
                    "CZ",
                    "HR",
                    "CY",
                    "DK",
                    "EE",
                    "FI",
                    "FR",
                    "DE",
                    "GB",
                    "GR",
                    "HU",
                    "IE",
                    "IT",
                    "LV",
                    "LT",
                    "LU",
                    "MT",
                    "NL",
                    "PL",
                    "PT",
                    "RO",
                    "SI",
                    "SK",
                    "ES",
                    "SE"
                ],
                "student origin: non-EU": []
            },
            "entity": "nationality",
            "options_answers": {
                "student origin: EU": {
                    "WEB_SERVER": "The tuition fees are identical across all Belgian French-speaking universities: usually €835/year even though it can vary a little depending on your economic status and other factors.<br>You can calculate your own tuition fees on <a href=\"https://uclouvain.be/en/study/inscriptions/tuition-fees.html\">this webpage</a>.",
                    "FACEBOOK": "The tuition fees are identical across all Belgian French-speaking universities: usually €835/year even though it can vary a little depending on your economic status and other factors.\nYou can calculate your own tuition fees on this webpage (https://uclouvain.be/en/study/inscriptions/tuition-fees.html)."
                },
                "student origin: non-EU": {
                    "WEB_SERVER": "For students from outside EU, the tuition fees can vary between €0 and €4000, depending on your economic situation and other factors.<br>You can calculate your own tuition fees on <a href=\"https://uclouvain.be/en/study/inscriptions/tuition-fees.html\">this webpage</a>.",
                    "FACEBOOK": "For students from outside EU, the tuition fees can vary between €0 and €4000, depending on your economic situation and other factors.\nYou can calculate your own tuition fees on this webpage (https://uclouvain.be/en/study/inscriptions/tuition-fees.html)."
                }
            }
        },
        "where-faculty-offices": {
            "options": {
                "fac: LSM": [
                    "LSM"
                ],
                "fac: other": []
            },
            "entity": "faculty",
            "options_answers": {
                "fac: LSM": {
                    "WEB_SERVER": "The offices of the LSM faculty are located near the centre of Louvain-la-Neuve, in the building \"Collège des Doyens\", Place des Doyens, 1 1348 Louvain-la-Neuve.",
                    "FACEBOOK": "The offices of the LSM faculty are located near the centre of Louvain-la-Neuve, in the building \"Collège des Doyens\", Place des Doyens, 1 1348 Louvain-la-Neuve."
                },
                "fac: other": {
                    "WEB_SERVER": "I'm afraid I don't have this information. You should easily find it on the <a href=\"https://uclouvain.be\">website of the university</a>.",
                    "FACEBOOK": "I'm afraid I don't have this information. You should easily find it on the website of the university (https://uclouvain.be)."
                }
            }
        },
        "how-to-enrol-ucl": {
            "options": {
                "student origin: EU": [
                    "AT",
                    "BE",
                    "BG",
                    "CZ",
                    "HR",
                    "CY",
                    "DK",
                    "EE",
                    "FI",
                    "FR",
                    "DE",
                    "GB",
                    "GR",
                    "HU",
                    "IE",
                    "IT",
                    "LV",
                    "LT",
                    "LU",
                    "MT",
                    "NL",
                    "PL",
                    "PT",
                    "RO",
                    "SI",
                    "SK",
                    "ES",
                    "SE"
                ],
                "student origin: non-EU": []
            },
            "entity": "nationality",
            "options_answers": {
                "student origin: EU": {
                    "WEB_SERVER": "To register, you must first complete an online application form. This form is available starting on the 1st of December and the deadline to fill it in is August 31.<br>When your online application is complete and your accompanying documents are received by the university, your file will be assessed and, if approved, the Enrolment Office will send you a registration authorisation.<br><br>You can bypass the application procedure if you have a Belgian degree and directly start registering online.<br><br>Once you registered into the university, you will need to register into your faculty and into the municipality you'll live in (thus certainly the City Hall of Louvain-la-Neuve).<br><br>You can get more information in <a href=\"https://uclouvain.be/en/study/inscriptions\">this section</a>.",
                    "FACEBOOK": "To register, you must first complete an online application form. This form is available starting on the 1st of December and the deadline to fill it in is August 31.\nWhen your online application is complete and your accompanying documents are received by the university, your file will be assessed and, if approved, the Enrolment Office will send you a registration authorisation.\n\nYou can bypass the application procedure if you have a Belgian degree and directly start registering online.\n\nOnce you registered into the university, you will need to register into your faculty and into the municipality you'll live in (thus certainly the City Hall of Louvain-la-Neuve).\n\nYou can get more information in this section (https://uclouvain.be/en/study/inscriptions)."
                },
                "student origin: non-EU": {
                    "WEB_SERVER": "To register, you must first complete an online application form. This form is available starting on the 1st of December and the deadline to fill it in is April 30.<br>When your online application is complete and your accompanying documents are received by the university, your file will be assessed and, if approved, the Enrolment Office will send you a registration authorisation.<br><br>Once you registered into the university, you will need to register into your faculty and into the municipality you'll live in (thus certainly the City Hall of Louvain-la-Neuve).<br><br>You can get more information in <a href=\"https://uclouvain.be/en/study/inscriptions\">this section</a>.",
                    "FACEBOOK": "To register, you must first complete an online application form. This form is available starting on the 1st of December and the deadline to fill it in is April 30.\nWhen your online application is complete and your accompanying documents are received by the university, your file will be assessed and, if approved, the Enrolment Office will send you a registration authorisation.\n\nOnce you registered into the university, you will need to register into your faculty and into the municipality you'll live in (thus certainly the City Hall of Louvain-la-Neuve).\n\nYou can get more information in this section (https://uclouvain.be/en/study/inscriptions)."
                }
            }
        },
        "LSM-welcome-event": {
            "options": {
                "student origin: EU": [
                    "AT",
                    "BE",
                    "BG",
                    "CZ",
                    "HR",
                    "CY",
                    "DK",
                    "EE",
                    "FI",
                    "FR",
                    "DE",
                    "GB",
                    "GR",
                    "HU",
                    "IE",
                    "IT",
                    "LV",
                    "LT",
                    "LU",
                    "MT",
                    "NL",
                    "PL",
                    "PT",
                    "RO",
                    "SI",
                    "SK",
                    "ES",
                    "SE"
                ],
                "student origin: non-EU": []
            },
            "entity": "nationality",
            "options_answers": {
                "student origin: EU": {
                    "WEB_SERVER": "The LSM organizes a mandatory information session at the beginning of each term, where you can learn how to finalize your course registration and get other useful information.<br><br>You will need to bring the proof your health insurance covering, and will receive your student card and your access card.",
                    "FACEBOOK": "The LSM organizes a mandatory information session at the beginning of each term, where you can learn how to finalize your course registration and get other useful information.\n\nYou will need to bring the proof your health insurance covering, and will receive your student card and your access card."
                },
                "student origin: non-EU": {
                    "WEB_SERVER": "The LSM organizes a mandatory information session at the beginning of each term, where you can learn how to finalize your course registration and get other useful information.<br><br>You will need to bring the proof your health insurance covering, your visa and passport, and will receive your student card and your access card.",
                    "FACEBOOK": "The LSM organizes a mandatory information session at the beginning of each term, where you can learn how to finalize your course registration and get other useful information.\n\nYou will need to bring the proof your health insurance covering, your visa and passport, and will receive your student card and your access card."
                }
            }
        }
    },
    "entities_filling": {
        "nationality": {
            "question": "First, could you tell me your nationality?",
            "fallback": "I am afraid I was actually expecting you to say where you are coming from.",
            "ack": "Got it. What do you want to know?"
        },
        "faculty": {
            "question": "Okay, could you tell me which faculty you are interested in?",
            "fallback": "I'm sorry I was expecting a faculty name there.",
            "ack": "Okay, I got it. What do you want to know?"
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

            if ((cond_activated === undefined && cond_array.length === 0) || cond_array.includes(ctx_val)) {
                cond_activated = cond;
            }
        }
        console.log('cond activated: '+cond_activated);
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

    let how_register_commune = (agent) => { return complex_handler(agent, "how-register-commune"); };
    let do_i_need_visa = (agent) => { return complex_handler(agent, "do-i-need-visa"); };
    let do_i_need_mutuelle = (agent) => { return complex_handler(agent, "do-i-need-mutuelle"); };
    let can_i_work = (agent) => { return complex_handler(agent, "can-i-work"); };
    let registration_cost = (agent) => { return complex_handler(agent, "registration-cost"); };
    let where_faculty_offices = (agent) => { return complex_handler(agent, "where-faculty-offices"); };
    let how_to_enrol_ucl = (agent) => { return complex_handler(agent, "how-to-enrol-ucl"); };
    let LSM_welcome_event = (agent) => { return complex_handler(agent, "LSM-welcome-event"); };


    // Run the proper function handler based on the matched Dialogflow intent name
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);

    
    // how-register-commune handleling
    intentMap.set("how-register-commune + nationality", how_register_commune);
    intentMap.set("how-register-commune - nationality", how_register_commune);
    intentMap.set("ans:give-nationality + pend_how-register-commune", pending_question);
    
    
    // do-i-need-visa handleling
    intentMap.set("do-i-need-visa + nationality", do_i_need_visa);
    intentMap.set("do-i-need-visa - nationality", do_i_need_visa);
    intentMap.set("ans:give-nationality + pend_do-i-need-visa", pending_question);
    
    
    // do-i-need-mutuelle handleling
    intentMap.set("do-i-need-mutuelle + nationality", do_i_need_mutuelle);
    intentMap.set("do-i-need-mutuelle - nationality", do_i_need_mutuelle);
    intentMap.set("ans:give-nationality + pend_do-i-need-mutuelle", pending_question);
    
    
    // can-i-work handleling
    intentMap.set("can-i-work + nationality", can_i_work);
    intentMap.set("can-i-work - nationality", can_i_work);
    intentMap.set("ans:give-nationality + pend_can-i-work", pending_question);
    
    
    // registration-cost handleling
    intentMap.set("registration-cost + nationality", registration_cost);
    intentMap.set("registration-cost - nationality", registration_cost);
    intentMap.set("ans:give-nationality + pend_registration-cost", pending_question);
    
    
    // where-faculty-offices handleling
    intentMap.set("where-faculty-offices + faculty", where_faculty_offices);
    intentMap.set("where-faculty-offices - faculty", where_faculty_offices);
    intentMap.set("ans:give-faculty + pend_where-faculty-offices", pending_question);
    
    
    // how-to-enrol-ucl handleling
    intentMap.set("how-to-enrol-ucl + nationality", how_to_enrol_ucl);
    intentMap.set("how-to-enrol-ucl - nationality", how_to_enrol_ucl);
    intentMap.set("ans:give-nationality + pend_how-to-enrol-ucl", pending_question);
    
    
    // LSM-welcome-event handleling
    intentMap.set("LSM-welcome-event + nationality", LSM_welcome_event);
    intentMap.set("LSM-welcome-event - nationality", LSM_welcome_event);
    intentMap.set("ans:give-nationality + pend_LSM-welcome-event", pending_question);
    

    agent.handleRequest(intentMap);
});
