# Master thesis server
>Server for the chatbot made with Watson

## Instalation 
It is first necessary to install Node.js and npm, so in function of your distribution it could be:
```
sudo apt-get install nodejs npm
```

In the root directory, run this commande to install the dependencies:
```bash
npm install
```

To run the test for the api call:
```bash
npm run test_api
```

or 

```bash
node test_api.js
```

To run the server:
```bash
npm run server
```

or 

```bash
node server.js
```

## Credentials
All information related to the Watson account need to be set in the ```credential.js``` file. They can be found as described [here](https://www.ibm.com/watson/developercloud/assistant/api/v1/node.html?node#authentication).
