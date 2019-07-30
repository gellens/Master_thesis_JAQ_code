import json
# from pprint import pprint  # usage: pprint(json)
from datetime import datetime
import hashlib as h
from copy import deepcopy
import os
import zipfile as zf
import shutil
import argparse # used to parse the argument of this program
from html_to_text import HTML_to_text
from random import randrange
from re import split, sub
from mako.template import Template


# Utilities fonction
def open_load_json(f_path):
    with open(f_path) as f:
        return json.load(f)

def open_string(path):
    return "".join(open(path).readlines())

def parent_folder(path):
    return os.path.abspath(os.path.join(path, ".."))

def fn_conv(txt):
    return sub(r" |\-|\+|\*|\.", "_", txt)



class WorkspaceMaker:
    DEBUG = False

    def __init__(self, FAQ_files):
        self.FAQ_files = FAQ_files
        self.workspace = {}
        self.node_counter = 1  # used for the id of nodes   
        self.id = self.unix_time_micro_now()

    def unix_time_micro_now(self):
        """Retruns the unix time of now in micro-second"""
        return int(datetime.now().timestamp()*1000_000)

    def unix_time_millis_now(self):
        """Retruns the unix time of now in millis-second"""
        return int(self.unix_time_micro_now()/1000)

    def unix_time_now(self):
        """Retruns the unix time of now in second"""
        return int(self.unix_time_millis_now()/1000)


    def title_to_intent(self, title):
        """Transfom the title to a valide intent identifier"""
        return title.replace(" ", "_")


    def id_plus_plus(self):
        val = self.id
        self.id +=1
        return val
    
    
    def hash_id(self):
        length_id = 36
        place_under_score = [8, 13, 18, 23]
        b = str(self.id_plus_plus()).encode()
        hash = h.sha1(b).hexdigest()[:length_id]

        for p in place_under_score:
            hash = hash[:p]+"-"+hash[p+1:]

        return hash
 

    def add_intent(self, title, questions):
        raise NotImplementedError("Please Implement this method")


    def add_standard_node(self, title, questions):
        raise NotImplementedError("Please Implement this method")


    def add_anythingElse_node(self):
        raise NotImplementedError("Please Implement this method")


    def create_title_split_questions_response(self, title, questions):
        """Create the title if not defined, and take the last question as the response"""
        response = questions[-1]
        questions = questions[:-1]
        if (title is None):
            title = str(self.node_counter)
            self.node_counter += 1
        return (title, questions, response)


    def create_intent_and_node(self, title, questions):
        """create the intent and the node for a question and its possible synonym; the response is the last element of the array questions"""
        (title, questions, response) = self.create_title_split_questions_response(title, questions)
        self.add_intent(title, questions)
        self.add_standard_node(title, response)


    def parse_simple_FAQ_files(self):
        """Parse the FAQ files and construct the workspace with sandard node"""
        title = None
        questions = []
        for FAQ_file in self.FAQ_files:
            with open(FAQ_file) as f:
                for line in f:
                    line_clean = line.rstrip()
                    if (line_clean == ""): # it is an empty line -> we create the intents and the node
                        self.create_intent_and_node(title, questions)
                        questions = []
                        title = None
                    elif (line_clean[0] == '#'): # there is a title
                        title = line_clean[1:]                
                    else:
                        questions.append(line_clean)

                if (len(questions) != 0): # create of the last the node + intent if not yet done
                    self.create_intent_and_node(title, questions)
                    questions = []
                    title = None

        self.add_anythingElse_node()


    def get_workspace(self):
        """Returns the final workspace into a json like object"""
        return self.workspace



class WorkspaceMakerDialogFlow(WorkspaceMaker):
    # set true if build the workspace with the complex flow of conversation
    # require the file 'entities_filling_answers.json' at the same location that the FAQ
    # (this is done automaticaly by FAQ_maker)
    COMPLEX = True 

    bases_root_f = [
        "./DialogFlow_agent/Base/agent.json",
        "./DialogFlow_agent/Base/package.json",
        "./DialogFlow_agent/Base/customSmalltalkResponses_en.json"
    ]
    base_intent_usersays_f = "./DialogFlow_agent/Base/base_intent_usersays_en.json"
    base_intent_response_f = "./DialogFlow_agent/Base/base_intent_response.json"


    base_default_intents_f = ["./DialogFlow_agent/Base/Default Fallback Intent_usersays_en.json",
                              "./DialogFlow_agent/Base/Default Fallback Intent.json",
                              "./DialogFlow_agent/Base/Default Welcome Intent_usersays_en.json",
                              "./DialogFlow_agent/Base/Default Welcome Intent.json"]

    def __init__(self, FAQ_files):
        WorkspaceMaker.__init__(self, FAQ_files)

        self.workspace["bases_root"] = {}
        for base_root_f in self.bases_root_f:
            self.workspace["bases_root"][os.path.basename(base_root_f)] = open_load_json(base_root_f)

        self.base_intent_usersays = open_load_json(self.base_intent_usersays_f)
        self.base_intent_response = open_load_json(self.base_intent_response_f)
        
        self.workspace["intents"] = {}
        for base_default_intent_f in self.base_default_intents_f:
            self.workspace["intents"][os.path.basename(base_default_intent_f)] = open_load_json(base_default_intent_f)

        if self.COMPLEX:
            FAQ_parent_folder = parent_folder(FAQ_files[0])
            # efa stand for entities_filling_answers
            # this file/object contains information related to the complex flow
            efa_path = os.path.join(FAQ_parent_folder, "entities_filling_answers.json")
            self.efa = open_load_json(efa_path) 
            self.complex_title = self.make_complex_title_set()
            self.complex_IQR = {}

            # es stand for entities_synonyms
            # this file/object contains synonyms for the entities
            es_path = os.path.join(FAQ_parent_folder, "entities_synonyms.json")
            self.es = open_load_json(es_path)
            self.workspace["entities"] = {}

        # used to check if there is two time the same question two different intents
        self.dup_question_dct = {}
        self.dup_question_lst = []
        self.dup_title_dct = {}
        self.dup_title_lst = []

        self.fb_translator = HTML_to_text()
        self.parse_simple_FAQ_files()


    def dup_question_scan(self, title, question):
        """Read the list of questions and keep track of duplicate"""
        if not (self.COMPLEX and self.is_ans_give_intent(title)):
            # do not check for complex intent filling entity
            if title in self.dup_title_dct:
                self.dup_title_lst.append(title)
            else:
                self.dup_title_dct[title] = True
            
            for q in question:
                if q in self.dup_question_dct:
                    self.dup_question_lst.append({"question": q, "t1": title, "t2":self.dup_question_dct[q]})
                else:
                    self.dup_question_dct[q] = title
    
    def dup_question_result(self):
        """Print the recording of the duplicate seen in the dup_question_scan"""
        for q in self.dup_question_lst:
            print("[WARN] dup question: "+q["question"]+" ("+q["t1"]+"><"+q["t2"]+")")
        for t in self.dup_title_lst:
            print("[WARN] dup title: "+t)
        print("[INFO] #training question:", len(self.dup_question_dct),"in #title:", len(self.dup_title_dct))

    def make_complex_title_set(self):
        """Create a set containing all the intent title complex based on the efa file"""
        intent_question = self.efa["intents_complex"].keys()
        intent_give = [self.entity_to_intent_name(e) for e in self.efa["entities_filling"].keys()]
        return set(list(intent_question) + intent_give)


    def title_to_usersays_file(self, title):
        """Return the name of the file usersays for this title"""
        return title + "_usersays_en.json"


    def title_to_node_file(self, title):
        """Return the name of the node file for this title"""
        return title + ".json"


    def format_IQR(self, title, questions, response):
        return {
            "intent": title,
            "questions": questions,
            "response": response
        }
    

    def entity_to_intent_name(self, entity):
        """return the name of the intent that give the entity"""
        return "ans:give-" + entity

    
    def is_ans_give_intent(self, title):
        """Return if the intent begins with 'ans:give-' """
        return len(title) >= 9 and title[:9] == "ans:give-"


    def mix_questions(self, q1, q2):
        """merge randomly the two set of questons (do the permutation)"""
        # numbre question generated = 2 * min(#q1, #q2) * factor

        factor = 1 # factor of question generated by combinaison of the two lists
        m = min(len(q1), len(q2))
        q_merged = []
        separator = [" ", ".", ". "]

        def pick_one(e):
            return e[randrange(len(e))]

        for i in range(int(factor*m)):
            q_merged.append(pick_one(q1) + pick_one(separator) + pick_one(q2))
            q_merged.append(pick_one(q2) + pick_one(separator) + pick_one(q1))
        return q_merged


    def format_txt_data(self, t, entity, is_entity):
        """return the appropriate structure for dialogflow for the data in usersays"""
        entity_field = {} if not is_entity else {
                "alias": entity,
                "meta": "@"+ entity
            }
        
        return {
            **entity_field, # unpack this dictionary
            "text": t,
            "userDefined": is_entity
        }



    def format_question_data(self, q, entity):
        """"format the question for dialogflow, by first spliting the question around the entity, 
        then formation correctly the pieces"""
        [before, entity_val, after] = split('{|}', q)
        data = []

        if before != '':
            data.append(self.format_txt_data(before, entity, False))

        data.append(self.format_txt_data(entity_val, entity, True))

        if after != '':
            data.append(self.format_txt_data(after, entity, False))
        
        return data


    def create_intent_and_node(self, title, questions):
        (title, questions, response) = self.create_title_split_questions_response(title, questions)
        self.dup_question_scan(title, questions)

        if self.COMPLEX and title in self.complex_title:
            self.complex_IQR[title] = self.format_IQR(title, questions, response)
        else:
            self.add_intent(title, questions)
            self.add_standard_node(title, response)


    def create_complex_intent_and_node(self):
        """Create all the intent and node of complex flow"""
        # NOTE: will probably do the webhook code here too

        for q in self.efa["intents_complex"]:
            # case Qi + Ei => set(ctx_Ei) + rm(wait_Ei) + webhook
            entity = self.efa["intents_complex"][q]["entity"] # entity related to the current question
            entity_intent = self.entity_to_intent_name(entity)
            title = q + " + " + entity
            questions = self.mix_questions(self.complex_IQR[q]["questions"], self.complex_IQR[entity_intent]["questions"])
            self.add_complex_intent(title, entity, questions)
            self.add_complex_Qi_w_Ei_standard_node(title, entity)

            # case Qi + ctx_Ei => webhook
            title = q + " - " + entity
            questions = self.complex_IQR[q]["questions"]
            self.add_intent(title, questions)
            self.add_complex_Qi_w_ctxEi_standard_node(title, entity)

            # case Qi => set(wait_Ei, pend_Qi)
            title = q # questions is the same
            response = self.complex_IQR[q]["response"]
            self.add_intent(title, questions)
            self.add_complex_Qi_standard_node(title, response, entity)

            # case Ei + pend_Qi => set(ctx_Ei) + rm(wait_Ei) + webhook
            # (NOTE does not remove pend_Qi because could be more than 
            # just Qi that is unlocked so this is done in the webhook)
            title = entity_intent + " + pend_" + q
            questions = self.complex_IQR[entity_intent]["questions"]
            self.add_complex_intent(title, entity, questions)
            self.add_complex_Ei_w_pendEi_standard_node(title, entity, q)
        
        for entity in self.efa["entities_filling"]:
            # case Ei => set(ctx_Ei)
            entity_intent = self.entity_to_intent_name(entity)
            title = entity_intent
            questions = self.complex_IQR[entity_intent]["questions"]
            response = self.complex_IQR[entity_intent]["response"]
            self.add_complex_intent(title, entity, questions)
            self.add_complex_Ei_standard_node(title, response, entity)


    def parameterize_add_standard_node(self, title, response, entity, set_webhook=False, cond_ctx=None, set_ctx=None, rm_ctx=None, contains_entity=False, hight_priority=False):
        """parameterize version for add_standard_node, add_complex_webhook_standard_node
        set_ctx contains an array of context that must be set"""
        new_node = deepcopy(self.base_intent_response)
        new_node["id"] = self.hash_id()
        new_node["name"] = title
        new_node["lastUpdate"] = self.unix_time_now()
        new_node["responses"][0]["messages"][0]["speech"] = response

        # add condition on the context
        if cond_ctx is not None:
            new_node["contexts"] = cond_ctx

        # add set context
        if set_ctx is not None:
            new_node["responses"][0]["affectedContexts"] = [{
                "name": ctx,
                "parameters": {},
                "lifespan": 10
            } for ctx in set_ctx]
        
        if rm_ctx is not None:
            new_node["responses"][0]["affectedContexts"].extend([{
                "name": ctx,
                "parameters": {},
                "lifespan": -1
            } for ctx in rm_ctx])
        
        if contains_entity:
            new_node["responses"][0]["parameters"] = [{
                "id": self.hash_id(),
                "required": False,
                "dataType": "@"+entity,
                "name": entity,
                "value": "$"+entity,
                "isList": False
            }]

        # add the translation for facebook
        facebook_message = new_node["responses"][0]["messages"][0].copy()
        facebook_message["platform"] = "facebook"
        facebook_message["speech"] = self.fb_translator.translate(response)
        new_node["responses"][0]["messages"].append(facebook_message)

        if set_webhook:
            new_node["webhookUsed"] = True

        if hight_priority:
            new_node["priority"] = 750000

        self.workspace["intents"][self.title_to_node_file(title)] = new_node


    def add_standard_node(self, title, response):
        """Add to the dialog structure a standard node"""
        self.parameterize_add_standard_node(title, response, None)


    def add_complex_Qi_w_Ei_standard_node(self, title, entity):
        ctx = "ctx_" + entity
        rm_ctx = ["wait_" + entity]
        r = "Sorry there has been an error, please contact the CGEI team or the university Support Service."
        self.parameterize_add_standard_node(title, r, entity, set_webhook=True, set_ctx=[ctx], rm_ctx=rm_ctx, contains_entity=True)


    def add_complex_Qi_w_ctxEi_standard_node(self, title, entity):
        """The context is reset (with its initial lifespan) because it has been used."""
        ctx = "ctx_" + entity
        r = "Sorry there has been an error, please contact the CGEI team or the university Support Service."
        self.parameterize_add_standard_node(title, r, entity, set_webhook=True, cond_ctx=[ctx], set_ctx=[ctx], hight_priority=True)


    def add_complex_Qi_standard_node(self, title, response, entity):
        ctx = ["wait_" + entity, "pend_"+title]
        self.parameterize_add_standard_node(title, response, entity, set_ctx=ctx)


    def add_complex_Ei_w_pendEi_standard_node(self, title, entity, base_intent):
        cond_ctx = "pend_"+base_intent
        ctx = "ctx_" + entity
        rm_ctx = ["wait_" + entity]
        r = "Sorry there has been an error, please contact the CGEI team or the university Support Service."
        self.parameterize_add_standard_node(title, r, entity, set_webhook=True, cond_ctx=[cond_ctx], set_ctx=[ctx], rm_ctx=rm_ctx, contains_entity=True, hight_priority=True)


    def add_complex_Ei_standard_node(self, title, response, entity):
        ctx = "ctx_" + entity
        self.parameterize_add_standard_node(title, response, entity, set_ctx=[ctx], contains_entity=True)


    def entity_to_entries_file(self, title):
        """Return the name of the file entries for this entity"""
        return title + "_entries_en.json"


    def entity_to_base_file(self, title):
        """Return the name of the base file for this entity"""
        return title + ".json"


    def create_entity_node_base(self, entity):
        """Create for an entity the base file structure"""
        node = {
            "id": self.hash_id(),
            "name": entity,
            "isOverridable": True,
            "isEnum": False,
            "automatedExpansion": False,
            "allowFuzzyExtraction": False
        }
        self.workspace["entities"][self.entity_to_base_file(entity)] = node


    def create_entity_node_synonyms(self, entity):
        """"Create for an entity the structure containing all the synonyms"""
        d = self.es[entity]
        s = [{"value": k, "synonyms": d[k]} for k in d]
        self.workspace["entities"][self.entity_to_entries_file(entity)] = s


    def create_entities_node(self):
        """Create all the file of the folder entities. This function can only be called during the complex flow generation (self.es must be defined)"""
        
        for entity in self.efa["entities_filling"]:
            if entity not in self.es:
                print("[ERR] !! missing entity:", entity)
            else:
                self.create_entity_node_base(entity)
                self.create_entity_node_synonyms(entity)

    def efa_with_translation(self):
        """"Add to efa the traduction of the response in the format compatible for Facebook"""
        efat = deepcopy(self.efa)

        for intent in efat["intents_complex"]:
            intent_data = efat["intents_complex"][intent]
            
            for option in intent_data["options_answers"]:
                response = intent_data["options_answers"][option]
                trad = self.fb_translator.translate(response)
                intent_data["options_answers"][option] = {
                    "WEB_SERVER": response,
                    "FACEBOOK": trad
                }
        return efat


    def create_webhook_code(self):
        """Create the code called by the webhook"""
        self.efat = self.efa_with_translation()
        efat_txt = json.dumps(self.efat, indent=4, ensure_ascii=False)
        with open("Webhook/webhook.js", 'w') as f:
            template = Template(open_string("Webhook/webhook.js_template"))
            content = template.render(efat_txt=efat_txt, efa=self.efa, fn_conv=fn_conv)
            f.write(content)


    def add_anythingElse_node(self):
        """There is nothing to be done here unless we are in the COMPLEX mode, 
        in that case there are all the complex intent that must be generated"""
        if self.COMPLEX:
            self.create_complex_intent_and_node()
            self.create_entities_node()
            self.create_webhook_code()
        self.dup_question_result() # print the analysis of the duplicate questions


    def parameterize_add_intent(self, title, entity, questions, is_complex):
        """This function has more parameter, but do what the function initialy called wanted to"""
        new_intents =  []
        for q in questions:
            new_intent = deepcopy(self.base_intent_usersays)
            new_intent["id"] = self.hash_id()
            new_intent["updated"] = self.unix_time_now()
            if is_complex:
                new_intent["data"] = self.format_question_data(q, entity)
            else:
                new_intent["data"][0]["text"] = q
            new_intents.append(new_intent)
        
        self.workspace["intents"][self.title_to_usersays_file(title)] = new_intents


    def add_intent(self, title, questions):
        """Create and add to the workspace, currently build, a new intent with possibly multiple variation"""
        self.parameterize_add_intent(title, None, questions, False)

    
    def add_complex_intent(self, title, entity, questions):
        """same as add_intent but for the complex flow"""
        self.parameterize_add_intent(title, entity, questions, True)


    def write_workspace(self, output):
        """Write the workspace in a file"""

        tmp_dir = "./tmp"
        elems_dir = {
            "bases_root":  "",
            "intents":  "intents/",
            "entities":  "entities/"
        }

        if os.path.exists(tmp_dir): # clear the directory
            shutil.rmtree(tmp_dir)
        os.mkdir(tmp_dir)

        for d in elems_dir:
            if elems_dir[d] != "":  # necessary because the root path already exist
                os.mkdir(os.path.join(tmp_dir, elems_dir[d]))

        with zf.ZipFile(output, 'w', zf.ZIP_DEFLATED) as zip:
            for cat in elems_dir:
                for elem in self.workspace[cat]:
                    elem_dir = os.path.join(tmp_dir, elems_dir[cat] + elem)
                    with open(elem_dir, 'w') as f:
                        f.write(json.dumps(self.workspace[cat][elem],
                                        ensure_ascii=False,  # output in utf-8
                                        indent=4
                                        ))
                    zip.write(elem_dir, elems_dir[cat] + elem)
            

        if not self.DEBUG:
            shutil.rmtree(tmp_dir)



def check_output_file(args):
    """Enforce the right extension for the output file"""
    extension = "zip"

    if args.output[0].split(".")[-1] != extension:
        args.output[0] += "."+extension


def parse_args():
    """Parse the input argument of the program"""

    parser = argparse.ArgumentParser(description='Process FAQ files to create workspace for DialogFlow.')
    parser.add_argument('-i', '--input', required=True, metavar='I', nargs='+',
                        help='FAQ files parsed')
    parser.add_argument('-o', '--output', metavar='O', nargs=1,
                        help='output file')
    args = parser.parse_args()
    check_output_file(args)
    return args

def main():
    args = parse_args()
    wm = WorkspaceMakerDialogFlow(args.input)

    wm.write_workspace('out.zip' if args.output is None else args.output[0])


if __name__ == '__main__':
    main()
