# the goal of this script is to read the FAQ generated to merge all the question and there related intent into one file used for the visualisation
import os
import json

out_dct = {}

def add_question(title, questions):
    questions[:-1] # the last one is the answers

    for q in questions:
        out_dct[q] = title

def list_files():
    base_path = "./data_small"
    data_files_path = [os.path.join(base_path, f) for f in os.listdir(base_path) if os.path.isfile(os.path.join(base_path, f))]
    return data_files_path

def parse_simple_FAQ_files():
    """Parse the FAQ files and merge them"""
    title = None
    questions = []
    for FAQ_file in list_files():
        with open(FAQ_file) as f:
            for line in f:
                line_clean = line.rstrip()
                if (line_clean == ""):  # it is an empty line -> we create the intents and the node
                    add_question(title, questions)
                    questions = []
                    title = None
                elif (line_clean[0] == '#'):  # there is a title
                    title = line_clean[1:]
                else:
                    questions.append(line_clean)

            if (len(questions) != 0):  # create of the last the node + intent if not yet done
                add_question(title, questions)
                questions = []
                title = None


def write_result():
    with open("data_intents.json", 'w') as f:
        json.dump(out_dct, f, indent=4)


parse_simple_FAQ_files()

# print(out_dct)

write_result()
