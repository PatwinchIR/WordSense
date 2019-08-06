from datetime import datetime
from itertools import zip_longest

from rest_framework import generics, status, permissions
from rest_framework.response import Response

from ws_web.models import DerivedTokens, Tags, WordNet30, Participant, WorkUnit, WorkUnitContent
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


# TODO: 1. add a button on frontend, so when a worker finishes, (s)he needs to click on the finish button to retrieve
# TODO:     redeem code, so he can use this code to MT site to get paid.
# TODO: 2. check finish logic. update WorkUnit (set as idle, increment times_worked)


def is_valid_worker_id(worker_id):
    return True


def is_expired(last_active_time):
    return False


def get_work_unit():
    workunit_qryset = WorkUnit.objects.filter(
        status='idle'
    ).order_by('times_worked')
    chosen_workunit = workunit_qryset.first()
    chosen_workunit.status = "active"
    chosen_workunit.save()

    utterance_ids = WorkUnitContent.objects.filter(work_unit=chosen_workunit).values_list('utterance_id', flat=True)
    return chosen_workunit.id, DerivedTokens.objects.filter(
        utterance_id__in=utterance_ids
    ).order_by('id')


class ListDerivedTokens(generics.ListAPIView):
    permission_classes = (permissions.AllowAny,)
    tags_set = set()
    work_unit_id = None
    participant_id = None

    def get_existing_progress(self, participant_id):
        work_unit = WorkUnit.objects.filter(participant=participant_id).first()
        if work_unit is not None:
            self.work_unit_id = work_unit.id
            utterance_ids = WorkUnitContent.objects.filter(work_unit=work_unit).values_list('utterance_id',
                                                                                                  flat=True)

            self.queryset = DerivedTokens.objects.get_queryset().filter(
                utterance_id__in=utterance_ids
            ).order_by('utterance_id', 'token_id')
            token_ids = self.queryset.values_list('id', flat=True)
            self.tags_set = set(Tags.objects.filter(
                participant=participant_id,
                token_id__in=token_ids
            ).values_list('token_id', flat=True))
        else:
            self.work_unit_id, self.queryset = get_work_unit()

    def list(self, request, *args, **kwargs):
        worker_id = request.query_params['workerId']
        self.participant_id = request.query_params['participant_id']
        if not is_valid_worker_id(worker_id):
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        if self.participant_id == "undefined":
            participant_qryset = Participant.objects.filter(worker_id=worker_id)
            if len(participant_qryset) > 0:
                self.participant_id = participant_qryset.first().id
                self.get_existing_progress(self.participant_id)
            else:
                self.work_unit_id, self.queryset = get_work_unit()
        else:
            self.get_existing_progress(self.participant_id)

        if len(self.queryset) > 0:
            serializer = DerivedTokensSerializer(
                self.queryset, many=True, context={'participant_id': None})
            return Response(data={'data': serializer.data,
                                  'tags_set': self.tags_set,
                                  'work_unit_id': self.work_unit_id,
                                  'participant_id': self.participant_id},
                            status=status.HTTP_200_OK)
        else:
            return Response(status=status.HTTP_404_NOT_FOUND)


class ListSenses(generics.ListAPIView):
    permission_classes = (permissions.AllowAny,)

    serializer_class = SenseModelSerializer
    queryset = ''

    def list(self, request, *args, **kwargs):
        worker_id = request.query_params['workerId']
        if not is_valid_worker_id(worker_id):
            return Response(status=status.HTTP_401_UNAUTHORIZED)

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
        worker_id = request.query_params['workerId']
        if not is_valid_worker_id(worker_id):
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        gloss_with_replacement = request.query_params['gloss_with_replacement']
        token_id = request.query_params['token_id']
        participant_id = Participant.objects.filter(worker_id=worker_id).first().id if request.query_params[
                                     'participant_id'] == "undefined" else request.query_params['participant_id']
        print("list_tags: ", participant_id)
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

        worker_id = data.pop('workerId')
        if not is_valid_worker_id(worker_id):
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        work_unit = WorkUnit.objects.get(id=data.pop('workUnitId'))
        participant_from_worker = Participant.objects.filter(worker_id=worker_id).first()

        if "participant" not in data:
            if participant_from_worker is None:
                participant_serializer = ParticipantSerializer(data={
                    'user': None,
                    'user_type': 'mechenical_turk',
                    'browser_display_lang': fingerprint['language'],
                    'browser_user_agent': fingerprint['userAgent'],
                    'browser_platform': fingerprint['platform'],
                    'ip': x_forwarded_for if x_forwarded_for else request.META.get('REMOTE_ADDR'),
                    'worker_id': worker_id
                })
                if participant_serializer.is_valid():
                    new_participant = participant_serializer.save()
                    data['participant'] = new_participant.id

                    work_unit.participant = new_participant
            else:
                data['participant'] = participant_from_worker.id
                work_unit.participant = participant_from_worker

        elif work_unit.participant is None:
            participant_obj = Participant.objects.get(id=data['participant'])
            work_unit.participant = participant_obj

        data['transcript_id'] = work_unit.transcript_id
        work_unit.last_active_time = datetime.now()
        work_unit.save()

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
            participant=data["participant"]
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
                    participant=data["participant"],
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
                serializer.save()
                return Response(data={"participant_id": data["participant"]}, status=status.HTTP_202_ACCEPTED)
            else:
                return Response(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)
