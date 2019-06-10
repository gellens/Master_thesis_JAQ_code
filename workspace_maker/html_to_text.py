""""
TODO

- special html caracter

"""

test_dct = {
# simple test
"<h1>Test</h1>": 
"*Test*",

# test with new line
"<h1>Test1</h1><br>Test2": 
"""*Test1*

Test2""",

# test with attribute for the html tag
'<h1 class="test">Test1</h1><br>Test3':
"""*Test1*

Test3""",

# test with new line in the html
'<p>Test\n1\n2</p>':
"Test 1 2",

# test with bulltet point
"<ul><li>1</li><li>2</li><li>3</li></ul>":
"""- 1
- 2
- 3""",

# test bold on new line
"hello</br><strong>you</strong>":
"""hello
*you*""",

# test more complex
"<p><strong>General postal address</strong></p><p>Université catholique de Louvain<br>1, Place de l'Université<br>B-1348 Louvain-la-Neuve (Belgium)</p>":
"""*General postal address*

Université catholique de Louvain
1, Place de l'Université
B-1348 Louvain-la-Neuve (Belgium)""",

# test bold followed
"<p><strong>H</strong></p>y":
"""*H*

y""",

# test link 1
'<a href="https://test.com/page">Text</a>':
"Text (https://test.com/page)",

# test link 2 (simple quote for the url)
"<a href='https://test.com/page'>Text</a>":
"Text (https://test.com/page)",

# test link 3 (some spaces)
"<a href = 'https://test.com/page'>Text</a>":
"Text (https://test.com/page)",

# test link 4 (one space and one param)
"<a href ='https://test.com/page?t=ref'>Text</a>":
"Text (https://test.com/page?t=ref)",

# test link 5 (+ class)
"<a class='link' href='https://test.com/page'>Text</a>":
"Text (https://test.com/page)",

# test link 2 (two links)
"<a href='url_1'>T</a> <a href='url_2'>B</a>":
"T (url_1) B (url_2)",
}

PARAGRAPH = 0
NEW_LINE = 1
BOLD = 2
BOLD_NEW_LINE_END = 3
LIST = 4
LINK = 5

class HTML_to_text():
    # def __init__(self):
    #     self.initilize()

    def initilize(self):
        self.output = ""
        self.tag_reading = False  # wether we are reading the tag just after <
        self.tag_in = False      # whether we are between < and >
        self.tag_current = ""

        # logique to extract the ref of link
        self.reading_attribute = False
        self.reading_attribute_value = False
        self.last_url = ""
        self.attribute_current = ""
        self.attribute_value_current = ""

    def is_quote(self, s):
        return s == "'" or s == '"'

    def last_char(self):
        if len(self.output) > 0:
            return self.output[-1]
        else:
            return "start"

    def remove_last_space(self):
        while len(self.output) > 0 and self.output[-1] == " ":
            self.output = self.output[:-1]
    
    def remove_last_space_or_new_line(self):
        while len(self.output) > 0 and (self.output[-1] == " " or self.output[-1] == "\n"):
            self.output = self.output[:-1]
        
    def ensure_2_new_line(self):
        len_out = len(self.output)
        if len_out >= 2: # otherwise there is no need for a new space
            last = self.output[-1]
            bef_last = self.output[-2]
            if last == "\n":
                if bef_last != "\n":
                    return "\n"
            else:
                return "\n\n"
        return ""

    def trad_tag(self):
        tag_dct = {
            "p": PARAGRAPH,
            "br": NEW_LINE,
            "strong": BOLD,
            "h1": BOLD_NEW_LINE_END,
            "li": LIST,
            "a": LINK
        }


        tag_in_dct = None
        tag_ending = False
        if self.tag_current in tag_dct:
            tag_in_dct = self.tag_current
        elif self.tag_current[0] == '/' and self.tag_current[1:] in tag_dct:
            tag_in_dct = self.tag_current[1:]
            tag_ending = True
        
        # print(tag, tag_in_dct)

        if tag_in_dct is None:
            return ""
        else:
            if tag_dct[tag_in_dct] == PARAGRAPH:
                self.remove_last_space()
                return self.ensure_2_new_line()
            elif tag_dct[tag_in_dct] == NEW_LINE:
                return "\n"
            elif tag_dct[tag_in_dct] == BOLD:
                if tag_ending:
                    return "* "
                else:
                    if no_need_space(self.last_char()):
                        return "*"
                    else:
                        return " *"
            elif tag_dct[tag_in_dct] == BOLD_NEW_LINE_END:
                if tag_ending:
                    return "*\n"
                else:
                    if no_need_space(self.last_char()):
                        return "*"
                    else:
                        return " *"
            elif tag_dct[tag_in_dct] == LIST:
                if tag_ending:
                    return "\n"
                else:
                    if no_need_new_line(self.last_char()):
                        return "- "
                    else:
                        return "\n- "
            elif tag_dct[tag_in_dct] == LINK:
                if tag_ending:
                    return " (" + self.last_url + ")"
                else:
                    return ""
            else:
                return ""

    def translate(self, html_str):
        self.initilize()

        for s in html_str:
            # print(s)
            if s == '<':
                self.tag_reading = True
                self.tag_in = True
                self.tag_current = ""
            elif self.tag_reading and s == ' ':
                self.tag_reading = False
                trad = self.trad_tag() # need to do it on 2 line to update output in trad
                self.output += trad
                
                if self.tag_current == "a":
                    self.reading_attribute = True
            elif s == '>':
                if self.tag_reading: # if we where still reading the tag
                    trad = self.trad_tag() # need to do it on 2 line to update output in trad
                    self.output += trad
                self.tag_reading = False
                self.tag_in = False
                self.reading_attribute = False
                self.reading_attribute_value = False
                self.attribute_current = ""
                self.attribute_value_current = ""
            else:
                if self.tag_reading:
                    self.tag_current += s
                elif self.reading_attribute_value:
                    if self.is_quote(s):
                        if len(self.attribute_value_current) > 0:
                            self.reading_attribute_value = False
                            if self.tag_current == "a":
                                self.last_url = self.attribute_value_current
                    elif s != " " and (len(self.attribute_value_current) != 0 or s != "="):
                        self.attribute_value_current += s

                elif self.reading_attribute:
                    if s == " " or s == "=":
                        if self.attribute_current == "href":
                            self.reading_attribute_value = True
                        else:
                            self.attribute_current = ""
                    else:
                        self.attribute_current += s
                elif not self.tag_in:

                    # new line in html are interpreted as space 
                    if s == "\n":
                        s = " "

                    if not (self.last_char() == " " and s == " "): # avoid to have multiple spaces
                        self.output += s
            
            # print("\noutput:")
            # for l in self.output:
            #     print("["+l+"]")

            
        # do not return a empty last line
        self.remove_last_space_or_new_line()

        return self.output

def no_need_space(prev_char):
    return prev_char == " " or prev_char == "start" or prev_char == "\n"

def no_need_new_line(prev_char):
    return prev_char == "\n" or prev_char == "start"



def detailed_diff (a, b):
    l = min(len(a), len(b))
    for i in range(l):
        print(a[i], "><", b[i])
    

def test():
    first_error = True
    tr = HTML_to_text()
    for t in test_dct:
        r = tr.translate(t)
        if r != test_dct[t]:
            if first_error:
                print("\nERROR")
                print("------")
            else:
                print()
            print("##1\n"+r) 
            print("##2\n"+test_dct[t]) 
            # detailed_diff(r, test_dct[t])

if __name__ == "__main__":
    test()
