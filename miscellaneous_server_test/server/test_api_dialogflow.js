// source: https://www.npmjs.com/package/dialogflow
const path = require("path")
const cred_d = require('./credentials_dialogflow.js')


const projectId = cred_d.projectId;
const sessionId = 'quickstart-session-id';
const query = 'I wanna have a visa for Belgium, how can I do ?';
const languageCode = 'en-US';

process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(__dirname, cred_d.credentialFile)


// Instantiate a DialogFlow client.
const dialogflow = require('dialogflow');
const sessionClient = new dialogflow.SessionsClient();

// Define session path
const sessionPath = sessionClient.sessionPath(projectId, sessionId);

// The text query request.
const request = {
    session: sessionPath,
    queryInput: {
        text: {
            text: query,
            languageCode: languageCode,
        },
    },
};

// Send request and log result
sessionClient
    .detectIntent(request)
    .then(responses => {
        console.log('Detected intent');
        const result = responses[0].queryResult;
        console.log(`  Query: ${result.queryText}`);
        console.log(`  Response: ${result.fulfillmentText}`);
        if (result.intent) {
            // console.log(result);
            console.log(`  Intent: ${result.intent.displayName}`);
        } else {
            console.log(`  No intent matched.`);
        }
    })
    .catch(err => {
        console.error('ERROR:', err);
    });