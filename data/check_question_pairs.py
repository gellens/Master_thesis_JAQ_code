#!/usr/bin/env python3
# coding: utf-8

"""
This program checks that intents declared in `intent-answers`
have a corresponding template in `questions`.
It ignores "complex" questions that need more interactions.
"""

import os

questions_dir = "intent-answers"
templates_dir = "questions"

questions_files = os.listdir(questions_dir)
questions_files.remove("_Legend.md")
templates_files = os.listdir(templates_dir)
templates_files.remove("output")


def parse_question_file(f, intents):
    last = None
    for l in f:
        if l.startswith("####"):
            if last is not None:
                intents.add(last)
            last = l[4:].strip()
        if l.startswith('-'):
            last = None
    if last is not None:
        intents.add(last)


def parse_template_file(f, intents):
    for l in f:
        if l.startswith('%'):
            intent = l[2:l.index(']')]
            if intent.startswith('&'):
                intent = intent[1:]
            intents.add(intent)


if __name__ == "__main__":
    intents = set()
    intents_with_templates = set()
    
    for filename in questions_files:
        with open(os.path.join(questions_dir, filename), 'r') as f:
            parse_question_file(f, intents)
    
    for filename in templates_files:
        with open(os.path.join(templates_dir, filename), 'r') as f:
            parse_template_file(f, intents_with_templates)
    
    for intent in intents:
        if intent not in intents_with_templates:
            print("No templates for declared intent:", intent)
    print("\n"+15*'='+"\n")
    for intent in intents_with_templates:
        if intent not in intents:
            print("No declaration for intent:", intent)

