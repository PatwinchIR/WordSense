from itertools import zip_longest

# Create your views here.


# todos/staff_views.py
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q

from ws_web.models import Collection, Corpus, Transcript, DerivedTokens, Tags, WordNet30
from ws_web.serializers import CollectionSerializer, CorpusSerializer, TranscriptSerializer, \
    SenseSerializer, DerivedTokensSerializer, TagsSerializer, UserSerializerWithToken, UserSerializer, \
    ParticipantSerializer, SenseModelSerializer
from nltk.corpus import wordnet as wn
from nltk.stem import WordNetLemmatizer

import json

from sentry_sdk import capture_message

lemmatizer = WordNetLemmatizer()
pos_map = {
    'v': wn.VERB,
    'n': wn.NOUN,
    'adj': wn.ADJ,
    'adv': wn.ADV
}


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
                response_data['participant_id'] = new_participant.id
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


class ListDerivedTokens(generics.ListAPIView):
    serializer_class = DerivedTokensSerializer

    def list(self, request, *args, **kwargs):
        transcript_id = request.query_params['transcript_id']
        participant_id = request.query_params['participant_id']
        self.queryset = DerivedTokens.objects.get_queryset().filter(
            transcript_id=transcript_id).order_by('utterance_id', 'token_id')
        tags_set = set(Tags.objects.filter(
            participant=participant_id,
            transcript_id=transcript_id
        ).values_list('token_id', flat=True))
        if len(self.queryset) > 0:
            serializer = DerivedTokensSerializer(self.queryset, many=True)
            return Response(data={'data': serializer.data, 'tags_set': tags_set}, status=status.HTTP_200_OK)
        else:
            return Response(status=status.HTTP_404_NOT_FOUND)


class ListSenses(generics.ListAPIView):
    serializer_class = SenseModelSerializer
    queryset = ''

    def list(self, request, *args, **kwargs):
        pos = request.query_params['pos']
        token_id = request.query_params['token_id']
        gloss= request.query_params['gloss']
        word = lemmatizer.lemmatize(gloss, pos_map[pos])

        queryset = WordNet30.objects.filter(
            Q(lemma_names__icontains="'"+word+"'") | Q(lemma_names__icontains="'"+gloss+"'"),
            pos=pos_map[pos],
        )

        if len(queryset) > 0:
            serializer = SenseModelSerializer(
                queryset, many=True, context={'token_id': token_id})
            return Response(serializer.data)
        else:
            return Response(data=[{'id': -1, 'definition': '', 'examples': [], 'number_of_tags': -1}])


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
        ).values_list('sense_id', flat=True)
        data = list(self.queryset)

        try:
            prev_selection_highlight_entry = Tags.objects.select_related('token').filter(
                token__part_of_speech=DerivedTokens.objects.get(id=token_id).part_of_speech,
                gloss_with_replacement=gloss_with_replacement,
                participant=participant_id
            ).latest('id')
            prev_selection_highlight = Tags.objects.filter(
                token_id=prev_selection_highlight_entry.token_id,
                participant=participant_id
            ).values_list('sense_id', flat=True)
        except:
            prev_selection_highlight = []

        return Response(data={"data": data, "highlight": prev_selection_highlight}, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        data = request.data
        print(data)
        print("good job")
        if data.get('fixed_pos', '') in ('n', 'v', 'adj', 'adv', 'other'):
            qryset = Tags.objects.filter(
                gloss_with_replacement=data['gloss_with_replacement'],
                token_id=data['token'],
                participant=data['participant']
            )
            for obj in qryset:
                obj.delete()
            serializer = TagsSerializer(data={
                'gloss_with_replacement': data['gloss_with_replacement'],
                'token': data['token'],
                'transcript_id': data['transcript_id'],
                'sense': None,
                'fixed_pos': data['fixed_pos'],
                'participant': data['participant']
            })
            if serializer.is_valid():
                serializer.save()
                return Response(data={"participant_id": ""}, status=status.HTTP_202_ACCEPTED)
            else:
                return Response(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        existing_sense_ids = set(Tags.objects.filter(
            gloss_with_replacement=data['gloss_with_replacement'],
            token_id=data['token'],
            participant=data['participant']
        ).values_list('sense_id', flat=True))
        if set(data['sense_ids']) == existing_sense_ids:
            return Response(status=status.HTTP_302_FOUND)
        else:
            sense_ids_to_be_deleted = existing_sense_ids - \
                                      set(data['sense_ids'])
            for sid in sense_ids_to_be_deleted:
                qryset = Tags.objects.filter(
                    gloss_with_replacement=data['gloss_with_replacement'],
                    token_id=data['token'],
                    participant=data['participant'],
                    sense_id=sid
                )
                for obj in qryset:
                    obj.delete()

            sense_ids_to_be_saved = set(
                data['sense_ids']) - existing_sense_ids
            data.pop('sense_ids')
            data_to_save = list(
                map(lambda item: dict(item[1] + [item[0]]),
                    zip_longest(
                        map(lambda sid: ('sense', sid),
                            sense_ids_to_be_saved),
                        '',
                        fillvalue=list(data.items())
                    )
                    )
            )
            serializer = TagsSerializer(data=data_to_save, many=True)
            if serializer.is_valid():

                # Test to make sure that the sense IDs are reasonable
                # Especially that they are related to the gloss_with_replacement word
                # get the pos so we can lemmatize

                queryset = DerivedTokens.objects.filter(
                    id=data['token']).values('part_of_speech')

                pos = [x['part_of_speech'].split(':')[0] for x in queryset][0]

                gloss = data['gloss_with_replacement']

                # lemmatize
                lemmatized_gloss_with_replacement = lemmatizer.lemmatize(gloss,
                     pos_map[pos])


                queryset = WordNet30.objects.filter(
                    Q(lemma_names__icontains="'"+lemmatized_gloss_with_replacement+"'") | Q(lemma_names__icontains="'"+gloss+"'"),
                    pos=pos_map[pos],
                )

                ids_for_wn_senses = [sense.id for sense in queryset] + [117667, 117666]

                bad_sense_ids = []

                for sense_id_to_be_saved in sense_ids_to_be_saved:
                    if sense_id_to_be_saved not in ids_for_wn_senses:
                        print('Sense mismatch detected for '+str(data['participant'])+', token '+str(data['token']))
                        bad_sense_ids.append(sense_id_to_be_saved)

                        #raise ValueError('Sense mismatch detected')
                    else:
                        print('No sense mismatch detected for '+str(data['participant'])+', token '+str(data['token']))

                if len(bad_sense_ids)==0:
                    serializer.save()
                    return Response(data={"participant_id": data["participant"]}, status=status.HTTP_202_ACCEPTED)

                else:
                    capture_message('Sense mismatch detected for '+str(data['participant'])+', token '+str(data['token'])+', senses '+ str(bad_sense_ids))
                    return Response(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)
