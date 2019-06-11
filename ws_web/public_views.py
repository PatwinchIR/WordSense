from itertools import zip_longest

from rest_framework import generics, status, permissions
from rest_framework.response import Response

from ws_web.models import DerivedTokens, Tags, WordNet30
from ws_web.serializers import DerivedTokensSerializer, SenseSerializer, TagsSerializer, \
    ParticipantSerializer, SenseModelSerializer

from nltk.corpus import wordnet as wn
from nltk.stem import WordNetLemmatizer

lemmatizer = WordNetLemmatizer()

TOTAL_UTTERANCES = 10
pos_map = {
    'v': wn.VERB,
    'n': wn.NOUN,
    'adj': wn.ADJ,
    'adv': wn.ADV
}


class ListDerivedTokens(generics.ListAPIView):
    permission_classes = (permissions.AllowAny,)

    def list(self, request, *args, **kwargs):
        # TODO: find a way to select utterances for public user
        self.queryset = DerivedTokens.objects.filter(
            utterance_id__gt=776196).order_by('id')[:TOTAL_UTTERANCES]
        if len(self.queryset) > 0:
            serializer = DerivedTokensSerializer(
                self.queryset, many=True, context={'participant_id': None})
            return Response(data={'data': serializer.data, 'tags_set': set()}, status=status.HTTP_200_OK)
        else:
            return Response(status=status.HTTP_404_NOT_FOUND)


class ListSenses(generics.ListAPIView):
    permission_classes = (permissions.AllowAny,)

    serializer_class = SenseModelSerializer
    queryset = ''

    def list(self, request, *args, **kwargs):
        pos = request.query_params['pos']
        token_id = request.query_params['token_id']
        word = lemmatizer.lemmatize(request.query_params['gloss'], pos_map[pos])

        queryset = WordNet30.objects.filter(
            word=word,
            pos=pos_map[pos]
        )
        if len(queryset) > 0:
            serializer = SenseModelSerializer(
                queryset, many=True, context={'token_id': token_id})
            return Response(serializer.data)
        else:
            return Response(data=[{'id': -1, 'definition': '', 'examples': [], 'number_of_tags': -1}])


class ListCreateAnnotation(generics.ListCreateAPIView):
    permission_classes = (permissions.AllowAny,)

    queryset = ''

    def list(self, request, *args, **kwargs):
        gloss_with_replacement = request.query_params['gloss_with_replacement']
        token_id = request.query_params['token_id']
        participant_id = None if request.query_params[
                                     'participant_id'] == "undefined" else request.query_params['participant_id']
        self.queryset = Tags.objects.filter(
            gloss_with_replacement=gloss_with_replacement,
            token_id=token_id,
            participant=participant_id
        ).values_list('sense_id', flat=True)
        data = list(self.queryset)
        return Response(data=data, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        data = request.data

        fingerprint = data.pop("fingerprint")
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

        if "participant" not in data:
            participant_serializer = ParticipantSerializer(data={
                'user': None,
                'user_type': 'mechenical_turk',
                'browser_display_lang': fingerprint['language'],
                'browser_user_agent': fingerprint['userAgent'],
                'browser_platform': fingerprint['platform'],
                'ip': x_forwarded_for if x_forwarded_for else request.META.get('REMOTE_ADDR')
            })
            if participant_serializer.is_valid():
                new_participant = participant_serializer.save()
                data['participant'] = new_participant.id

        if data.get('fixed_pos', '') in ('n', 'v', 'adj', 'adv', 'other'):
            serializer = TagsSerializer(data={
                'gloss_with_replacement': data['gloss_with_replacement'],
                'token': data['token'],
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
            participant=data["participant"]
        ).values_list('sense_id', flat=True))
        if set(data['sense_ids']) == existing_sense_ids:
            return Response(status=status.HTTP_302_FOUND)
        else:
            data_to_save = None
            if 0 in data['sense_ids']:
                data_to_save = [{
                    'gloss_with_replacement': data['gloss_with_replacement'],
                    'token': data['token'],
                    'sense': None,
                    'fixed_pos': None,
                    'participant': data['participant']
                }]
            else:
                sense_ids_to_be_deleted = existing_sense_ids - \
                                          set(data['sense_ids'])
                for sid in sense_ids_to_be_deleted:
                    qryset = Tags.objects.filter(
                        gloss_with_replacement=data['gloss_with_replacement'],
                        token_id=data['token'],
                        participant=data["participant"],
                        sense_offset=sid
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
                serializer.save()
                return Response(data={"participant_id": data["participant"]}, status=status.HTTP_202_ACCEPTED)
            else:
                return Response(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)
