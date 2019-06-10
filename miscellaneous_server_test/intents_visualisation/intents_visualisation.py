from mpl_toolkits.mplot3d import Axes3D
from collections import defaultdict
import tensorflow as tf
import tensorflow_hub as hub
import json
import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt
import matplotlib.cm as cm
import math

# source: https://cloud.google.com/solutions/assessing-the-quality-of-training-phrases-in-dialogflow-intents

embed_module = hub.Module("https://tfhub.dev/google/universal-sentence-encoder/2")


def load_data():
    intent_training_phrases = defaultdict(list)
    with open('data_intents.json') as json_file:
        data = json.load(json_file)
        for intent_example in data:
            intent_training_phrases[data[intent_example]].append(intent_example)
    return intent_training_phrases


def make_embeddings_fn():
  placeholder = tf.placeholder(dtype=tf.string, shape=[None])
  embed = embed_module(placeholder)
  session = tf.Session()
  session.run([tf.global_variables_initializer(), tf.tables_initializer()])
  def _embeddings_fn(sentences):
      computed_embeddings = session.run(
        embed, feed_dict={placeholder: sentences})
      return computed_embeddings
  return _embeddings_fn


generate_embeddings = make_embeddings_fn()


def add_embeding_on_intent(intent_training_phrases):
    training_phrases_with_embeddings = defaultdict(list)
    for intent_name, training_phrases_list in intent_training_phrases.items():
        computed_embeddings = generate_embeddings(training_phrases_list)
        training_phrases_with_embeddings[intent_name] = dict(zip(training_phrases_list, computed_embeddings))
    return training_phrases_with_embeddings


def draw_visualisation(training_phrases_with_embeddings):
    embedding_vectors = []

    for intent, training_phrases_and_embeddings in training_phrases_with_embeddings.items():
        for training_phrase, embeddings in training_phrases_and_embeddings.items():
            embedding_vectors.append(embeddings)

    embedding_vectors = np.asarray(embedding_vectors)

    pca = PCA(n_components=2)
    pca.fit(embedding_vectors)


    fig = plt.figure(figsize=(15, 10))
    ax = fig.add_subplot(111)

    legend = []

    colors = cm.nipy_spectral(np.linspace(0, 1, len(training_phrases_with_embeddings.keys())))
    # colors = cm.rainbow(np.linspace(0, 1, len(training_phrases_with_embeddings.keys())))
    for color, intent in zip(colors, training_phrases_with_embeddings.keys()):
        phrases = list(training_phrases_with_embeddings[intent].keys())
        embeddings = list(training_phrases_with_embeddings[intent].values())
        points = pca.transform(embeddings)
        xs = points[:, 0]
        ys = points[:, 1]
        ax.scatter(xs, ys, marker='o', s=10, c=[color]) # all the training questions are represented with the same color if there are from the same intent
        # for i, phrase in enumerate(phrases):
        #     # ax.annotate(phrase[:15] + '...', (xs[i], ys[i]))
        #     ax.annotate(intent, (xs[i], ys[i]))
        legend.append(intent)

    plt.xlabel('First principal component')
    plt.ylabel('Second principal component')
    plt.title("Intent's space representation of the sub-topic Welcome")
    ax.legend(legend)
    plt.show()


intent_training_phrases = load_data()
# for intent in intent_training_phrases:
#     print("{}:{}".format(intent, intent_training_phrases[intent]))

training_phrases_with_embeddings = add_embeding_on_intent(intent_training_phrases)
draw_visualisation(training_phrases_with_embeddings)

