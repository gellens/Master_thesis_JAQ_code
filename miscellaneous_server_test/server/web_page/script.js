const WATSON = 0;
const DIALOGFLOW = 1;

var socket = io();

function loading(load) {
	const img = document.getElementById("loading");
	if (load) {
		img.className = "display";
	} else {
		img.className = "hidden";
	}
}

function newMsg(msg, bot) {
	let newM = 	document.createElement("li");
	newM.innerHTML = msg
	if (bot) {
		newM.className = "bot";
		loading(false);
	} else {
		newM.className = "human";
		loading(true)
	}
	let ms = document.getElementById('messages')
	ms.appendChild(newM);

	// scroll down
	let body = document.getElementById('b');
	body.scrollTop = body.scrollHeight;
}

function send_watson() { return sendGenerator(false, WATSON) }
function send_dialogflow() { return sendGenerator(false, DIALOGFLOW) }
function sendFake() { return sendGenerator(true, null) }

function sendGenerator(fake, engine) {
	let m = document.getElementById('m');
	let mVal = m.value
	if (mVal != "") {
		newMsg(mVal, false)
		if (fake) {
			socket.emit('test', mVal)
		} else if(engine == WATSON) {
			socket.emit('message_to_watson', mVal)
		} else if (engine == DIALOGFLOW) {
			socket.emit('message_to_dialogflow', mVal)
		}
		m.value = ""; // need m here because it is the node that is changed
	}
	return false;
}
socket.on('message_response', function(msg){
	newMsg(msg, true)
});
