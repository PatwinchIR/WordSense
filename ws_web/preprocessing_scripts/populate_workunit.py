from datetime import datetime

import django

django.setup()

from ws_web.models import DerivedTokens, WorkUnit, WorkUnitContent

if __name__ == "__main__":
    work_unit, created = WorkUnit.objects.get_or_create(
        id=4,
        transcript_id=2765,
        corpus_id=29,
        collection_id=3,
        status="idle",
        times_worked=0,
        last_active_time=datetime.now()
    )
    for id in ('776355', '776364', '776370', '776378', '776396'):
        WorkUnitContent.objects.create(
            utterance_id=id,
            work_unit=work_unit
        )
    # for workunit in WorkUnit.objects.all():
    #     workunit.status='idle'
    #     workunit.participant_id=None
    #     workunit.save()

