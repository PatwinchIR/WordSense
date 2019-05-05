from itertools import zip_longest

from rest_framework import generics, status, permissions
from rest_framework.response import Response

from wordsense.ws_web.models import DerivedTokens, Tags
from wordsense.ws_web.serializers import DerivedTokensSerializer, SenseSerializer, TagsSerializer, \
    ParticipantSerializer

from nltk.corpus import wordnet as wn
from nltk.stem import WordNetLemmatizer

lemmatizer = WordNetLemmatizer()

TOTAL_UTTERANCES = 100


class ListDerivedTokens(generics.ListAPIView):
    permission_classes = (permissions.AllowAny,)

    def list(self, request, *args, **kwargs):
        # TODO: find a way to select utterances for public user
        self.queryset = DerivedTokens.objects.filter(
            utterance_id__gt=776196).order_by('id')[:TOTAL_UTTERANCES]
        if len(self.queryset) > 0:
            serializer = DerivedTokensSerializer(
                self.queryset, many=True, context={'participant_id': None})
            return Response(data=serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(status=status.HTTP_404_NOT_FOUND)


class ListSenses(generics.ListAPIView):
    permission_classes = (permissions.AllowAny,)

    serializer_class = SenseSerializer
    queryset = ''

    def list(self, request, *args, **kwargs):
        pos = request.query_params['pos']
        word = lemmatizer.lemmatize(request.query_params['gloss'], pos)

        synsets = wn.synsets(word, pos)
        serializer = SenseSerializer(
            synsets, many=True, context={'token_id': None})
        return Response(serializer.data)


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
        ).values_list('sense_offset', flat=True)
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

        existing_sense_offsets = set(Tags.objects.filter(
            gloss_with_replacement=data['gloss_with_replacement'],
            token_id=data['token'],
            participant=data["participant"]
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
                    participant=data["participant"],
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
                return Response(data={"participant_id": data["participant"]}, status=status.HTTP_202_ACCEPTED)
            else:
                return Response(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)
