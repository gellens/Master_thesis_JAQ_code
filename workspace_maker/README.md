# Workspace maker
This folder contains utilities to create a chatbot intended to be imported into *Dialogflow*, from several input files.
The creation of a complete *Dialogflow* agent can be executed by running the script `main.py` (after the dependencies have been properly installed).

Everything is described hereafter, and more detail can be found in the dissertation.

*Note: there are a certain number of improvements that could be made to this system (notably not calling *Chatette* several times in a row). That being said, it is sufficient for our needs.*

**The files `out.zip` and `Webhook/webhook.js` are files that have been generated using this system and make up the final version of *JAQ***.

## Description of the scripts
The scripts are layed out as shown on the following image.

[Architecture of the script system](https://github.com/gellens/Master_thesis_JAQ_code/blob/master/public/workspace_creation_process_V2.svg)

The input files are at the top of the image, while the output ones (importable in *Dialogflow*) are shown at the bottom. Files in orange are related to the complex interactions system.
The scripts are represented by ellipses and the double-lined ellipsis represent the external dependency [*Chatette*](https://github.com/SimGus/Chatette).
A short description of each file is provided below.

### `FAQ_maker`
This script allows to associate questions, answers and examples of user messages. It is the one that calls the external script *Chatette*.
It also aggregates the contents of `entities_filling` that represent more complex interactions, and the associated examples of user utterances.

### *Chatette*
It is an external script (see [here](https://github.com/SimGus/Chatette)) that allows to create a lot of user messages from a series of templates.

### `workspace_maker`
This script is intended to create the workspace (i.e. the file that contains every information useful to create a chatbot).
This workspace can then be imported into *Dialogflow*.
It is also the one that calls the script `html_to_text` which will transform answers into text displayable on *Facebook Messenger*.

### `html_to_text`
This script is intended to transform the answers formatted in HTML into text that can be displayed on platforms such as *Facebook Messenger*, and this without losing information.

### `main`
This script is intended to run each and every script described above in the correct order so that the workspace is finally created.
It takes as an input the path to the different input files.

## Input files
*Note: if you make your own input files and you want to avoid issues, please keep the hierarchy of files as they are in `../data/`. Corresponding files in different folders should have similar names.*
*The names of most of the files are hardcoded in script `main.py` and need to be added/removed when adding/removing a file.*

### `answers`
They are files that contain a list of pair of questions and their associated answer. More complex interactions are also contained, with conditions on certain pieces of information readably written.
Those files are formatted in *Markdown*.

### `template questions`
Those files contain the templates to generate examples of user messages, and that will be used as input for *Chatette*.

### `entities_filling`
This file contains the intermediate questions the chatbot should ask the user in order to get correct information.

### `entities_synonyms`
This file contains the definition of entities, each with a label, a list of values and a subsequent list of synonyms.

### `webhook_template`
This file contains the skeleton of the webhook code (each complex interaction needing to have a "hook" inside this code).
The code generation engine [mako](https://www.makotemplates.org/) is used to generate the relevant code.

## Output files
### `workspace`
This file is a `zip` file which contains all the information required to make a chatbot in *Dialogflow*.
It can be imported into *Dialogflow* using the importation feature (accessible in the settings panel of the developer interface of *Dialogflow*).

### `webhook.js`
This file contains the *JavaScript* code for the webhook.

## Installation
To run those scripts, you will need Python 3.6 or above.

To install the dependencies for all the scripts described above, execute the following command:
```sh
pip install -r requirements.txt
```
where `requirements.txt` is the file contained in the present directory.


## Creation of a chatbot
Once the dependencies of the scripts described above have been installed, the creation of a chatbot with this system is a 3 phase process.

1. Create all the input files of the different scripts (see [here](https://github.com/gellens/Master_thesis_JAQ_code/tree/master/data) for an example that allows to generate the final version of *JAQ*).
2. Execute the following command to create the workspace (as a `zip` file):
  ```sh
  python main.py
  ```
3. Import the workspace in *Dialogflow* using the importation feature that can be found in the settings panel of the developer interface of *Dialogflow*.
  Then, enable the webhook in the "fulfillment" tab and copy the code contained in `Webhook/webhook.js` in the edit text.
