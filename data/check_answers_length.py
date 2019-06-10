#!/usr/bin/env python3
# coding: utf-8

"""
This program checks that the answers provided for questions
are not longer than the maximum acceptable length of a message
and issues a warning if it is, so that we know which answers
should be worked on, or broken apart.
The maximum acceptable length should be about 377 characters.
"""

MAX_LENGTH = 377

import os

questions_dir = "intent-answers"
questions_files = os.listdir(questions_dir)
questions_files.remove("_Legend.md")

def check_answers(f):
    too_long_intents = []
    current_intent = None
    current_length = 0
    for l in f:
        if l.isspace():
            continue
        if l.startswith('#') or l.startswith('-'):
            if current_length > MAX_LENGTH:
                too_long_intents.append((current_length, current_intent))
            current_length = 0
        if l.startswith("####"):
            current_intent = l[4:].strip()
        else:
            if l.lstrip().startswith("**"):  # Question example
                pass
            if l.lstrip().startswith("*Note"):  # Note
                pass
            else:
                current_length += len(l.lstrip())
    return too_long_intents

if __name__ == "__main__":
    bad_intents = []
    for filename in questions_files:
        with open(os.path.join(questions_dir, filename), 'r') as f:
            bad_intents.extend(check_answers(f))
    
    bad_intents.sort(reverse=True, key=lambda x: x[0])
    for (length, intent) in bad_intents:
        print("Too long answer ("+str(length)+") for intent:", intent)

