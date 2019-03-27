from django.shortcuts import render

# Create your views here.

# import django
# django.setup()
#
# from ws_web.models import WordNet30
#
# from nltk.corpus import wordnet as wn
#
#
# def populate(x):
#     # data is a list of lists
#     d, created = WordNet30.objects.get_or_create(word=x.name().split('.')[0],
#                                                  pos=x.pos(),
#                                                  offset=x.offset(),
#                                                  definition=x.definition(),
#                                                  examples=x.examples(),
#                                                  lemma_names=x.lemma_names(),
#                                                  name=x.name()
#     )
#     print(d, created)
#
#
# if __name__ == "__main__":
#     y = wn.all_synsets()
#     i = 0
#     for synset in iter(y):
#         i += 1
#         populate(synset)
#         print(i)

# todos/views.py
from rest_framework import generics
from rest_framework.response import Response

from ws_web.models import Collection, Corpus, Transcript, Utterance
from ws_web.serializers import CollectionSerializer, CorpusSerializer, TranscriptSerializer, UtteranceSerializer, SenseSerializer
from nltk.corpus import wordnet as wn

class ListCollection(generics.ListAPIView):
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializer


class ListCorpus(generics.ListAPIView):
    serializer_class = CorpusSerializer

    def list(self, request, *args, **kwargs):
        collection_id = self.request.query_params['collection_id']
        queryset = Corpus.objects.get_queryset().filter(collection_id=collection_id)
        serializer = CorpusSerializer(queryset, many=True)
        return Response(serializer.data)


class ListTranscript(generics.ListAPIView):
    serializer_class = TranscriptSerializer

    def list(self, request, *args, **kwargs):
        corpus_id = self.request.query_params['corpus_id']
        queryset = Transcript.objects.get_queryset().filter(corpus_id=corpus_id)
        serializer = TranscriptSerializer(queryset, many=True)
        return Response(serializer.data)


class ListUtterance(generics.ListAPIView):
    serializer_class = UtteranceSerializer

    def list(self, request, *args, **kwargs):
        transcript_id = self.request.query_params['transcript_id']
        self.queryset = Utterance.objects.get_queryset().filter(transcript_id=transcript_id)
        serializer = UtteranceSerializer(self.queryset, many=True)
        return Response(serializer.data)


class ListSenses(generics.ListAPIView):
    serializer_class = SenseSerializer
    queryset = ''

    def list(self, request, *args, **kwargs):
        synsets = wn.synsets(self.request.query_params['lemma'], pos=self.request.query_params['pos'])
        serializer = SenseSerializer(synsets, many=True)
        print(serializer.data)
        return Response(serializer.data)


class DetailCollection(generics.RetrieveUpdateDestroyAPIView):
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializer


