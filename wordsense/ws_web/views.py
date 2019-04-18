from itertools import zip_longest

# Create your views here.


# todos/views.py
from rest_framework import generics, status
from rest_framework.response import Response

from ws_web.models import Collection, Corpus, Transcript, Utterance, DerivedTokens, Tags
from ws_web.serializers import CollectionSerializer, CorpusSerializer, TranscriptSerializer, UtteranceSerializer, \
    SenseSerializer, DerivedTokensSerializer, TagsSerializer
from nltk.corpus import wordnet as wn
from nltk.stem import WordNetLemmatizer

lemmatizer = WordNetLemmatizer()


class ListCollection(generics.ListAPIView):
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializer


class ListCorpus(generics.ListAPIView):
    serializer_class = CorpusSerializer

    def list(self, request, *args, **kwargs):
        collection_id = request.query_params['collection_id']
        queryset = Corpus.objects.get_queryset().filter(collection_id=collection_id)
        serializer = CorpusSerializer(queryset, many=True)
        return Response(serializer.data)


class ListTranscript(generics.ListAPIView):
    serializer_class = TranscriptSerializer

    def list(self, request, *args, **kwargs):
        corpus_id = request.query_params['corpus_id']
        queryset = Transcript.objects.get_queryset().filter(corpus_id=corpus_id)
        serializer = TranscriptSerializer(queryset, many=True)
        return Response(serializer.data)


class ListUtterance(generics.ListAPIView):
    serializer_class = UtteranceSerializer

    def list(self, request, *args, **kwargs):
        transcript_id = request.query_params['transcript_id']
        self.queryset = Utterance.objects.get_queryset().filter(transcript_id=transcript_id)
        serializer = UtteranceSerializer(self.queryset, many=True)
        return Response(serializer.data)


class ListDerivedTokens(generics.ListAPIView):
    serializer_class = DerivedTokensSerializer

    def list(self, request, *args, **kwargs):
        transcript_id = request.query_params['transcript_id']
        self.queryset = DerivedTokens.objects.get_queryset().filter(
            transcript_id=transcript_id).order_by('utterance_id', 'token_id')
        serializer = DerivedTokensSerializer(self.queryset, many=True)
        return Response(serializer.data)


class ListSenses(generics.ListAPIView):
    serializer_class = SenseSerializer
    queryset = ''

    def list(self, request, *args, **kwargs):
        pos = request.query_params['pos']
        word = lemmatizer.lemmatize(request.query_params['gloss'], pos)

        synsets = wn.synsets(word, pos)
        serializer = SenseSerializer(synsets, many=True)
        return Response(serializer.data)


class ListCreateAnnotation(generics.ListCreateAPIView):
    queryset = ''

    def list(self, request, *args, **kwargs):
        gloss_with_replacement = request.query_params['gloss_with_replacement']
        token_id = request.query_params['token_id']
        self.queryset = Tags.objects.filter(
            gloss_with_replacement=gloss_with_replacement,
            token_id=token_id).values_list('sense_offset', flat=True)
        data = list(self.queryset)
        return Response(data=data, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        data = request.data
        existing_sense_offsets = set(Tags.objects.filter(
            gloss_with_replacement=data['gloss_with_replacement'],
            token_id=data['token']).values_list('sense_offset', flat=True))
        if set(data['sense_offsets']) == existing_sense_offsets:
            return Response(status=status.HTTP_302_FOUND)
        else:
            sense_offsets_to_be_deleted = existing_sense_offsets - \
                set(data['sense_offsets'])
            for offset in sense_offsets_to_be_deleted:
                qryset = Tags.objects.filter(
                    gloss_with_replacement=data['gloss_with_replacement'],
                    token_id=data['token'],
                    sense_offset=offset
                )
                for obj in qryset:
                    obj.delete()

            sense_offsets_to_be_saved = set(
                data['sense_offsets']) - existing_sense_offsets
            data.pop('sense_offsets')
            data_to_save = list(
                map(lambda item: dict(item[1] + [item[0]]),
                    zip_longest(
                        map(lambda offset: ('sense_offset', offset),
                            sense_offsets_to_be_saved),
                        '',
                        fillvalue=list(data.items())
                )
                )
            )
            serializer = TagsSerializer(data=data_to_save, many=True)
            if serializer.is_valid():
                serializer.save()
                return Response(status=status.HTTP_202_ACCEPTED)
            else:
                return Response(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DetailCollection(generics.RetrieveUpdateDestroyAPIView):
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializer
