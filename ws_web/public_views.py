from itertools import zip_longest

from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Q

from ws_web.models import DerivedTokens, Tags, WordNet30, Participant, WorkUnit, WorkUnitContent
from ws_web.serializers import DerivedTokensSerializer, TagsSerializer, \
    ParticipantSerializer, SenseModelSerializer

from nltk.stem import WordNetLemmatizer

from ws_web.utils import *
import random

from sentry_sdk import capture_message

lemmatizer = WordNetLemmatizer()
pos_map = {
    'v': wn.VERB,
    'n': wn.NOUN,
    'adj': wn.ADJ,
    'adv': wn.ADV
}

@api_view(['GET'])
@permission_classes([AllowAny])
def is_finished(request):
    worker_id = request.query_params['workerId']
    work_unit_id = request.query_params['workUnitId']
    if work_unit_id == "-1":
        current_active = WorkUnit.objects.select_related('participant').filter(
            participant__worker_id=worker_id,
            status="active"
        )
        if current_active:
            work_unit_id = current_active.first().id

    user_type = USER_TYPES.get(request.query_params['userType'], None)
    if user_type is None:
        return Response(data={"error": "Invalid User Type"}, status=status.HTTP_412_PRECONDITION_FAILED)

    # In case the user forgot the token
    previously_tagged_token_set = Tags.objects.select_related('participant').filter(
        participant__worker_id=worker_id,
    )
    if len(previously_tagged_token_set) >= USER_TYPE_TAGGING_THRESHOLD[user_type]:
        if work_unit_id != "-1":
            finished_workunit = WorkUnit.objects.get(
                id=work_unit_id
            )
            finished_workunit.status = "idle"
            finished_workunit.times_worked = finished_workunit.times_worked + 1
            finished_workunit.participant_id = None
            finished_workunit.save()
        return Response(data={
            "finishToken": id_generator(worker_id),
            "numTagsProvided": len(previously_tagged_token_set),
            "totalTagsNeeded": USER_TYPE_TAGGING_THRESHOLD[user_type]
        }, status=status.HTTP_200_OK)

    validation_queryset = WorkUnit.objects.select_related('participant').filter(
        participant__worker_id=worker_id,
        id=work_unit_id
    )
    if not validation_queryset:
        return Response(status=status.HTTP_400_BAD_REQUEST)

    utterance_set = WorkUnitContent.objects.filter(
        work_unit_id=work_unit_id
    ).values_list('utterance_id', flat=True)

    all_token_set = set(DerivedTokens.objects.filter(
        utterance_id__in=utterance_set,
        requires_tags=True
    ).values_list('id', flat=True))
    tagged_token_set = set(Tags.objects.select_related('participant').filter(
        participant__worker_id=worker_id,
        token_id__in=all_token_set
    ).values_list('token_id', flat=True))

    if len(tagged_token_set) / len(all_token_set) >= 0.9:
        total_tagged_token_set = set(Tags.objects.select_related('participant').filter(
            participant__worker_id=worker_id
        ).values_list('token_id', flat=True))

        finished_workunit = WorkUnit.objects.get(
            id=work_unit_id
        )
        finished_workunit.status="idle"
        finished_workunit.times_worked = finished_workunit.times_worked + 1
        finished_workunit.participant_id = None
        finished_workunit.save()

        if len(total_tagged_token_set) >= USER_TYPE_TAGGING_THRESHOLD[user_type]:
            return Response(data={
                "finishToken": id_generator(worker_id),
                "numTagsProvided": len(total_tagged_token_set),
                "totalTagsNeeded": USER_TYPE_TAGGING_THRESHOLD[user_type]
            }, status=status.HTTP_200_OK)
        else:
            return Response(data={
                "finishToken": "continue",
                "numTagsProvided": len(total_tagged_token_set),
                "totalTagsNeeded": USER_TYPE_TAGGING_THRESHOLD[user_type]
            }, status=status.HTTP_200_OK)

    return Response(status=status.HTTP_428_PRECONDITION_REQUIRED)


def is_valid_worker_id(worker_id):
    return True


def is_expired(last_active_time):
    return False


def get_work_unit(user_type, participant_id=None):
    # workunit_qryset = WorkUnit.objects.all()
    # for wku in workunit_qryset:
    #     wku.status="idle"
    #     wku.save()

    finished_units = set()
    if participant_id is not None:
        finished_utterances = set(Tags.objects.select_related('token').filter(
            participant=participant_id
        ).values_list("token__utterance_id", flat=True))

        finished_units = set(WorkUnitContent.objects.filter(
            utterance_id__in=finished_utterances
        ).values_list("work_unit_id", flat=True))

        if len(finished_units) == 0:
            # don't return anything, make them do one of the shared work units
            pass

        else:
            # if a worker has finished quota
            previously_tagged_token_set = Tags.objects.select_related('participant').filter(
                participant_id=participant_id,
            )
            if len(previously_tagged_token_set) >= USER_TYPE_TAGGING_THRESHOLD[user_type]:
                return -1, []

            workunit_qryset = WorkUnit.objects.filter(
                status='idle',
                participant=None
            ).order_by('times_worked').exclude(
                id__in=finished_units
            )
            if len(workunit_qryset) > 0:
                chosen_workunit = workunit_qryset.first()

                utterance_ids = WorkUnitContent.objects.filter(work_unit=chosen_workunit).values_list('utterance_id', flat=True)
                return chosen_workunit.id, DerivedTokens.objects.filter(
                    utterance_id__in=utterance_ids
                ).order_by('id')
            else:
                return -1, []

    # participant_id is none until some tokens have been submitted; we use this to identify a first-time annotator,
    # and give them one of the practive work units
    shared_units = [4752, 4755, 4753, 4760, 4769] #, 4763, 4764, 4770, 4761, 4765,
    random_training_id = random.choice(shared_units)
    print('Random training unit: '+str(random_training_id))
    chosen_workunit =  WorkUnit.objects.filter(
                id = random_training_id).first()

    utterance_ids = WorkUnitContent.objects.filter(work_unit=chosen_workunit).values_list('utterance_id', flat=True)

    return_tokens = DerivedTokens.objects.filter(
            utterance_id__in=utterance_ids
        ).order_by('id')

    return chosen_workunit.id, return_tokens


class ListDerivedTokens(generics.ListAPIView):
    permission_classes = (permissions.AllowAny,)
    tags_set = set()
    work_unit_id = None
    participant_id = None
    user_type = None

    def get_existing_progress(self, participant_id):
        work_unit = WorkUnit.objects.filter(
            participant=participant_id,
            status="active"
        ).first()
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
            self.work_unit_id, self.queryset = get_work_unit(self.user_type, participant_id)

    def list(self, request, *args, **kwargs):
        worker_id = request.query_params['workerId']
        self.user_type = USER_TYPES.get(request.query_params['userType'], None)
        if self.user_type is None:
            return Response(data={"error": "Invalid User Type"}, status=status.HTTP_412_PRECONDITION_FAILED)

        self.participant_id = request.query_params['participant_id']
        if not is_valid_worker_id(worker_id):
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        if self.participant_id == "undefined":
            participant_qryset = Participant.objects.filter(worker_id=worker_id)
            if len(participant_qryset) > 0:
                self.participant_id = participant_qryset.first().id
                self.get_existing_progress(self.participant_id)
            else:
                self.work_unit_id, self.queryset = get_work_unit(self.user_type)

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
        elif self.work_unit_id == -1:
            return Response(status=status.HTTP_204_NO_CONTENT)
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
        gloss = request.query_params['gloss']
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
    permission_classes = (permissions.AllowAny,)

    queryset = ''

    def list(self, request, *args, **kwargs):
        worker_id = request.query_params['workerId']
        if not is_valid_worker_id(worker_id):
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        gloss_with_replacement = request.query_params['gloss_with_replacement']
        token_id = request.query_params['token_id']
        if request.query_params['participant_id'] == "undefined":
            participant_obj = Participant.objects.filter(worker_id=worker_id).first()
            participant_id = participant_obj.id if participant_obj is not None else -1
        else:
            participant_id = request.query_params['participant_id']

        self.queryset = Tags.objects.filter(
            gloss_with_replacement=gloss_with_replacement,
            token_id=token_id,
            participant=participant_id
        ).values_list('sense_id', flat=True)

        data = list(self.queryset)

        try:
            prev_selection_highlight_id = Tags.objects.select_related('token').filter(
                token__part_of_speech=DerivedTokens.objects.get(id=token_id).part_of_speech,
                gloss_with_replacement=gloss_with_replacement,
                participant=participant_id
            ).latest('id')
            prev_selection_highlight = Tags.objects.filter(
                token_id=prev_selection_highlight_id.token_id,
                participant_id=participant_id
            ).values_list('sense_id', flat=True)
        except:
            prev_selection_highlight = []

        return Response(data={"data": data, "highlight": prev_selection_highlight}, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        data = request.data
        print(data)
        fingerprint = data.pop("fingerprint")
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

        worker_id = data.pop('workerId')
        if not is_valid_worker_id(worker_id):
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        work_unit = WorkUnit.objects.get(id=data.pop('workUnitId'))
        participant_from_worker = Participant.objects.filter(worker_id=worker_id).first()

        user_type = USER_TYPES.get(data.pop("userType"), None)
        if user_type is None:
            return Response(data={"error": "Invalid User Type"}, status=status.HTTP_412_PRECONDITION_FAILED)

        if "participant" not in data:
            if participant_from_worker is None:
                print('participant_from_worker is None')
                participant_data={
                    'user': None,
                    'user_type': user_type,
                    'browser_display_lang': fingerprint['language'],
                    'browser_user_agent': fingerprint['userAgent'],
                    'browser_platform': fingerprint['platform'],
                    'ip': x_forwarded_for if x_forwarded_for else request.META.get('REMOTE_ADDR'),
                    'worker_id': worker_id
                }
                print(data)
                participant_serializer = ParticipantSerializer(data=participant_data)
                if participant_serializer.is_valid():
                    print('Serializer is valid')
                    new_participant = participant_serializer.save()
                    data['participant'] = new_participant.id
                    work_unit.participant = new_participant
                else:
                    print('Error with the serializer')
                    print(participant_serializer.errors)
            else:
                print('participant_from_worker is not None')
                data['participant'] = participant_from_worker.id
                work_unit.participant = participant_from_worker

        elif work_unit.participant is None:
            print('work_unit.participant is None')
            participant_obj = Participant.objects.get(id=data['participant'])
            work_unit.participant = participant_obj

        data['transcript_id'] = work_unit.transcript_id
        shared_units = [4752, 4755, 4753, 4760, 4769]
        if work_unit.id not in shared_units: # shared units should not be locked -- can always accept new people
            work_unit.status = "active"
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
            print("help")
            if serializer.is_valid():

                # Test to make sure that the sense IDs are reasonable
                # Especially that they are related to the gloss_with_replacement word
                # get the pos so we can lemmatize

                queryset = DerivedTokens.objects.filter(
                        id=data['token']).values('part_of_speech')
                pos = [x['part_of_speech'].split(':')[0] for x in queryset][0]
                gloss = data['gloss_with_replacement']
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
