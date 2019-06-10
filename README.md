# Source code for JAQ master thesis
This repository contains:
- the source code of the scripts made for the master thesis, in directory `workspace_maker`
- the data in an exploitable format, in directory `data`
- the source code for the performed experiments, in directory `miscellaneous_server_test`

All this code is associated with the master thesis *JAQ: A Chatbot for Foreign Students*, by Arnaud Gellens and Simon Gustin, 2019.

## Abstract of the thesis
The primary objective of this master thesis is to design a chatbot intended to assist international students at UCLouvain. The produced chatbot, named JAQ, is aimed to be a Proof of Concept of an additional way for those students to obtain general information about the university.
Furthermore, we characterize the modern approach to chatbot conception, identify key challenges to overcome and analyze popular chatbot frameworks employed in the industry.

To create an efficient chatbot, employing a framework was the best option, both in terms of conception speed and performances. We investigated both IBM Watson Assistant and Google Dialogflow and determined the latter one was more suited to the context.
The scope of topics relevant to this chatbot being very extensive, we implemented a complete system on top of this framework to aid with data management and maintenance.
The implementation of this system, along with the conception steps of the chatbot, are thoroughly described.

Several experiments were performed with the final version of JAQ in order to assess its quality. Namely, we measured its comprehension performance and quantified the perceived quality of the user experience.
From a performance viewpoint, the chatbot correctly understands the user message almost three times out of four. Regarding the perceived quality, experiments showed the user experience to be satisfying but definitely improvable.

We can thus conclude JAQ successfully fulfilled its goals, even though numerous aspects could be enhanced. Therefore, we propose several potential improvements to both the produced chatbot and the employed framework. We also discuss the limitations of the additional system we built on top of this framework.
