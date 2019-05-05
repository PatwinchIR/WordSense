import django
django.setup()

# WordNet30 Populating
from ws_web.models import WordNet30

from nltk.corpus import wordnet as wn


def populate(x):
    # data is a list of lists
    d, created = WordNet30.objects.get_or_create(word=x.name().split('.')[0],
                                                 pos=x.pos(),
                                                 offset=x.offset(),
                                                 definition=x.definition(),
                                                 examples=x.examples(),
                                                 lemma_names=x.lemma_names(),
                                                 name=x.name()
    )
    print(d, created)


if __name__ == "__main__":
    y = wn.all_synsets()
    i = 0
    for synset in iter(y):
        i += 1
        populate(synset)
        print(i)
