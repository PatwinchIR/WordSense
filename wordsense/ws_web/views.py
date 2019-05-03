from itertools import zip_longest

# Create your views here.


# todos/views.py
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ws_web.models import Collection, Corpus, Transcript, Utterance, DerivedTokens, Tags
from ws_web.serializers import CollectionSerializer, CorpusSerializer, TranscriptSerializer, UtteranceSerializer, \
    SenseSerializer, DerivedTokensSerializer, TagsSerializer, UserSerializerWithToken, UserSerializer, \
    ParticipantSerializer
from nltk.corpus import wordnet as wn
from nltk.stem import WordNetLemmatizer

lemmatizer = WordNetLemmatizer()


@api_view(['GET'])
def current_user(request):
    """
    Determine the current user by their token, and return their data
    """

    serializer = UserSerializer(request.user)
    return Response(serializer.data)


class ListUser(generics.ListAPIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        data = request.data

        userdata = data['userdata']
        fingerprint = data['fingerprint']
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

        serializer = UserSerializerWithToken(data=userdata)
        if serializer.is_valid():
            new_user = serializer.save()
            participant_serializer = ParticipantSerializer(data={
                'user': new_user.id,
                'user_type': 'in_lab_staff',
                'browser_display_lang': fingerprint['language'],
                'browser_user_agent': fingerprint['userAgent'],
                'browser_platform': fingerprint['platform'],
                'ip': x_forwarded_for if x_forwarded_for else request.META.get('REMOTE_ADDR')
            })
            response_data = serializer.data
            if participant_serializer.is_valid():
                new_participant = participant_serializer.save()
                response_data['participantId'] = new_participant.id
            return Response(data=response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
        participant_id = request.query_params['participant_id']
        self.queryset = DerivedTokens.objects.get_queryset().filter(
            transcript_id=transcript_id).order_by('utterance_id', 'token_id')
        if len(self.queryset) > 0:
            serializer = DerivedTokensSerializer(self.queryset, many=True, context={'participant_id': participant_id})
            return Response(data=serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(status=status.HTTP_404_NOT_FOUND)


class ListSenses(generics.ListAPIView):
    serializer_class = SenseSerializer
    queryset = ''

    def list(self, request, *args, **kwargs):
        pos = request.query_params['pos']
        token_id = request.query_params['token_id']
        word = lemmatizer.lemmatize(request.query_params['gloss'], pos)

        synsets = wn.synsets(word, pos)
        serializer = SenseSerializer(synsets, many=True, context={'token_id': token_id})
        return Response(serializer.data)


class ListCreateAnnotation(generics.ListCreateAPIView):
    queryset = ''

    def list(self, request, *args, **kwargs):
        gloss_with_replacement = request.query_params['gloss_with_replacement']
        token_id = request.query_params['token_id']
        participant_id = request.query_params['participant_id']
        self.queryset = Tags.objects.filter(
            gloss_with_replacement=gloss_with_replacement,
            token_id=token_id,
            participant=participant_id
        ).values_list('sense_offset', flat=True)
        data = list(self.queryset)
        return Response(data=data, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        data = request.data
        existing_sense_offsets = set(Tags.objects.filter(
            gloss_with_replacement=data['gloss_with_replacement'],
            token_id=data['token'],
            participant=data['participant']
        ).values_list('sense_offset', flat=True))
        if set(data['sense_offsets']) == existing_sense_offsets:
            return Response(status=status.HTTP_302_FOUND)
        else:
            sense_offsets_to_be_deleted = existing_sense_offsets - \
                set(data['sense_offsets'])
            for offset in sense_offsets_to_be_deleted:
                qryset = Tags.objects.filter(
                    gloss_with_replacement=data['gloss_with_replacement'],
                    token_id=data['token'],
                    participant=data['participant'],
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
