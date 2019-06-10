from subprocess import call
import os
DEBUG = False

environment = "Arnaud"
#environment = "Simon"

if environment == "Arnaud":
    visualization_path = "../data/"
    PYTHON = "python"
elif environment == "Simon":
    visualization_path = "../../data/viz/"
    PYTHON = "python3.6"
    

class Gen_1:
    out_file_base = "out"
    suffix = {
        "d": ".zip",
        "w": ".json",
        "v": ".html",
    }

    input_file = [
        "UCLouvain_loge_Template.txt",
        "UCLouvain_general_Template.txt",
        "UCLouvain_additional_Template.txt",
    ]

    def __init__(self, out_type):
        self.out_type = out_type
        self.out_file = self.define_out_file()

        self.backup_old_workspace()
        self.pre_cleaning()
        self.generate_template()
        self.generate_workspace()
        self.cleaning()

    def define_out_file(self):
        if self.out_type in self.suffix:
            self.out_file_value = self.out_file_base + self.suffix[self.out_type]
        else:
            self.out_file_value = self.out_file_base
        return  self.out_file_value

    def copy_old_workspace(self):
        """if there is a previous file, it is renamed to have a backup"""
        if os.path.isfile(self.out_file):
            os.rename(self.out_file, "old_"+self.out_file)

    def remove_old_backup(self):
        """if there is an old backup, it is removed"""
        if os.path.isfile("old_"+self.out_file):
            os.remove("old_"+self.out_file)

    def backup_old_workspace(self):
        self.remove_old_backup()
        self.copy_old_workspace()

    def pre_cleaning(self):
        """Clean the old versin of entities_filling_answers"""
        efa_path = "FAQ/entities_filling_answers.json"
        if os.path.isfile(efa_path):
            #call(["rm", efa_path])
            os.remove(efa_path)

    def generate_template(self):
        # generate FAQ from template
        for i in self.input_file:
            call([PYTHON, "FAQ_maker.py", "-v1", "-i", "Template/"+i, "-o","FAQ/gen_"+i])

    def generate_workspace(self):
        # check if the output option is valide
        if self.out_type == "w" or self.out_type == "d" or self.out_type == "v":
            call([PYTHON, "workspace_maker.py", "-"+self.out_type, "-i", *["./FAQ/gen_"+i for i in self.input_file], "-o", self.out_file])


    def cleaning(self):
        global DEBUG

        if not DEBUG:
            for i in self.input_file:
                if os.path.isfile("./FAQ/gen_"+i):
                    os.remove("./FAQ/gen_"+i)

            self.remove_old_backup()


class Gen_2(Gen_1):
    input_file = [
        "Accommodation.md",
        "Belgium.md",
        "Contact.md",
        "ECTS.md",
        "Exams.md",
        "Language.md",
        "Registration.md",
        "Schedule.md",
        "SmallTalk.md",
        "StudyOrganization.md",
        "UCLouvainPresentation.md",
        "UCLouvainWebsite.md",
        "Welcome.md",
        "WelcomeEvents.md",
    ]


    def generate_template(self):
        # generate FAQ from template
        for i in self.input_file:
            call([PYTHON, "FAQ_maker.py", "-i", visualization_path + "intent-answers/" +i, "-o", "FAQ/gen_"+ i])



def main():
    Gen_2("d")


if __name__ == "__main__":
    main()
