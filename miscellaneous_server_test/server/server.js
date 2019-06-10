var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path')
var fs = require('fs');

const port = 80;
const VERBOSE = false;
const minConfidenceLevel = 0.5;

// the logger
var pino = require('pino');
const dst = pino.destination('out.log');
const logger = pino(dst)

app.set('views', './views') // specify the views directory
app.set('view engine', 'jade') // register the template engine


var credW = require('./credentials_watson.js')
var credD_old = require('./credentials_dialogflow.js')
var credD = require('./credentials_dialogflow_JAQ.js')

var str = ["hello"
, "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras a eleifend diam. Proin et ullamcorper velit. Fusce posuere eu ante eget mattis. Vivamus gravida, purus eu tempor aliquam, massa enim lacinia orci, ac tempor arcu velit eget dolor. Sed tortor ante, tempor at est non, accumsan consectetur nulla. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Phasellus libero tellus, placerat et accumsan ac, auctor non enim. Cras a dolor vehicula, mattis enim vel, consectetur lacus. Quisque et diam iaculis, aliquet elit sed, ornare libero. Suspendisse eget odio pretium, ornare quam eget, hendrerit lacus. Ut congue ex ac risus auctor tincidunt."
, "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras a eleifend diam. Proin et ullamcorper velit. Fusce posuere eu ante eget mattis."]


/////////////////////////////////////////
// initialisation of Watson

var assistantWV1 = require('watson-developer-cloud/assistant/v1');
var assistantW = new assistantWV1({
	version: '2018-09-20',
	iam_apikey: credW.api_key,
	url: credW.url
});

// the watson through the api is stateless so we have to memorise the context of the users
// source: https://developer.ibm.com/answers/questions/286739/how-to-pass-in-conversation-id-into-conversation/
var userContextW = {}


/////////////////////////////////////////
// initialisation of DialogFlow

const dialogflow = require('dialogflow');
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(__dirname, credD.credentialFile)
const sessionClientD = new dialogflow.SessionsClient();

// source for second credential: https://medium.com/@tzahi/how-to-setup-dialogflow-v2-authentication-programmatically-with-node-js-b37fa4815d89
let config_old = { credentials: JSON.parse(fs.readFileSync(path.resolve(__dirname, credD_old.credentialFile), 'utf8'))}
const sessionClientD_old = new dialogflow.SessionsClient(config_old);
const languageCodeD = 'en-US';
var userContextD = {}
var userContextD_old = {}


/////////////////////////////////////////
// define routing for the pages

app.use('/s/', express.static(__dirname + '/web_page'));
app.get('/t', function (req, res) {
	res.render('chat', { fake: true, engine: "dialogflow" })
	// res.render('chat', { fake: true, engine: "watson" })
})
app.get('/|(/d)', function (req, res) {
	res.render('chat', { fake: false, engine: "dialogflow" })
});
/*app.get('/w', function(req, res){
	res.render('chat', { fake: false, engine: "watson" })
});*/


//
function dialogflow_call(socket, msg, userContextD, userContextD_old, first_try) {
	fall_back_mode = false // if the request fail try the other chatbot

	// The text query request.
	const request = {
		session: (first_try ? userContextD : userContextD_old)[socket.id],
		queryInput: {
			text: {
				text: msg,
				languageCode: languageCodeD,
			},
		},
		queryParams: {
			payload: {
				fields: {
					source: {
						stringValue: 'WEB_SERVER',
						kind: 'stringValue'
					}
				}
			}
		}
	};

	// Send request and log result
	(first_try ? sessionClientD : sessionClientD_old)
		.detectIntent(request)
		.then(responses => {
			if (VERBOSE) {console.log(JSON.stringify(responses, null, 2));}
			const result = responses[0].queryResult;
			if (result.intent) {
				if (fall_back_mode && first_try && result.intent.displayName == "Default Fallback Intent") {
					dialogflow_call(socket, msg, userContextD, userContextD_old, false)
				} else {
					const intent = result.intent.displayName;
					socket.emit('message_response', result.fulfillmentText)
					logger.info({ "user_id": socket.id, "user_says": msg, "intent": intent })
				}

			} else {
				console.log(`  Error: no intent matched for: ${msg}`);
			}
		})
		.catch(err => {
			console.error('ERROR:', err);
		});
}

function pick_one(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function send_welcome_msg(socket) {
	const hello = ["Hi, ", "Hello, ", "Welcome, "];
	const name = ["my name is JAQ. ", "I am JAQ. "];
	const pres = [
		"I am a chatbot intended to help foreign student willing to follows courses at UCLouvain with their questions. ",
		"I am here to help foreign student that want to go at UCLouvain. ",
		"If you are a foreign student with questions about the UCLouvain, you are at the right place. "
	];
	const q = ["What can I do for you ?", "How can I help you ?", "Have you a question ?"];
	const welcome_msg = pick_one(hello) + pick_one(name) + pick_one(pres) + pick_one(q)
	socket.emit('message_response', welcome_msg);
}


/////////////////////////////////////////
// logic for the socket.io messages

io.on('connection', function(socket){
	// console.log('a user connected');
	userContextW[socket.id] = null;
	userContextD[socket.id] = sessionClientD.sessionPath(credD.projectId, socket.id);
	userContextD_old[socket.id] = sessionClientD_old.sessionPath(credD_old.projectId, socket.id);

	send_welcome_msg(socket)

	socket.on('message_to_watson', function(msg){
		console.log('W message: ' + msg);
		let param = {
				workspace_id: credW.workspace_id,
				input: {'text': msg}
			}
		if (userContextW[socket.id] != null) {
			param['context'] = userContextW[socket.id]
		}

		assistantW.message(param,  function(err, response) {
				if (err){
					console.log('error:', err);
				} else {
					console.log(JSON.stringify(response, null, 2));

					userContextW[socket.id] = response.context

					// send the response
					socket.emit('message_response', response.output.text[0]);
					// HACK: Do not handle the case Watson return multiple phrases
					// I do not know when it is possible
				}
		});

	});

	socket.on('message_to_dialogflow', function (msg) {
		// console.log('D message: ' + msg);
		dialogflow_call(socket, msg, userContextD, userContextD_old, true);
		
	});	

	// used to test the web interface, it respond with a random response
	socket.on('test', function(msg){
		//console.log('test: ' + msg);
		setTimeout(() => socket.emit('message_response', pick_one(str)), 2000);
	});

	socket.on('disconnect', function() {
        delete userContextW[socket.id];
        delete userContextD[socket.id];
    });
});

http.listen(port, function(){
	console.log('listening on *:'+port);
});

// source: https://socket.io/get-started/chat/
