var AssistantV1 = require('watson-developer-cloud/assistant/v1');

var cred = require('./credentials_watson.js')

var assistant = new AssistantV1({
	version: '2018-09-20',
	iam_apikey: cred.api_key,
	url: cred.url
});

assistant.message({
		workspace_id: cred.workspace_id,
		input: {'text': 'Hello'}
	},  function(err, response) {
	if (err)
			console.log('error:', err);
	else {
		console.log(JSON.stringify(response, null, 2));
		console.log(response["output"]);
		console.log(response.output.text);
		console.log(response["output"]["text"][0]);
	}
});
