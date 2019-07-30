from conf import visualization_path, PYTHON # local configuration for the project 
from subprocess import call
import os
DEBUG = False


class Gen:
    out_file = "out.zip"

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

    def __init__(self):
        self.backup_old_workspace()
        self.pre_cleaning()
        self.generate_template()
        self.generate_workspace()
        self.cleaning()


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
        """Clean the old version of entities_filling_answers"""
        efa_path = "FAQ/entities_filling_answers.json"
        if os.path.isfile(efa_path):
            os.remove(efa_path)

    def generate_template(self):
        # generate FAQ from template
        for i in self.input_file:
            call([PYTHON, "FAQ_maker.py", "-i", visualization_path + "intent-answers/" +i, "-o", "FAQ/gen_"+ i])

    def generate_workspace(self):
        # check if the output option is valide
        call([PYTHON, "workspace_maker.py", "-i", *["./FAQ/gen_"+i for i in self.input_file], "-o", self.out_file])

    def cleaning(self):
        global DEBUG

        if not DEBUG:
            # cleaning tempory file
            for i in self.input_file:
                if os.path.isfile("./FAQ/gen_"+i):
                    os.remove("./FAQ/gen_"+i)

            self.remove_old_backup()    



def main():
    Gen()


if __name__ == "__main__":
    main()
