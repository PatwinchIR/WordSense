import sys
import time
import pandas as pd
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wordsense.settings')
import django
django.setup()

from ws_web.preprocessing_scripts.utils.queryset_foreach import queryset_foreach

django.setup()

# DerivedTokens Populating
from ws_web.models import DerivedTokens, Token


requires_tags = {}
man_ids = pd.read_csv('ws_web/analysis/man_ids.csv')
pvd_ids = pd.read_csv('ws_web/analysis/pvd_ids.csv')
requires_tags[49] = set(pvd_ids['id'])
requires_tags[204] = set(man_ids['id'])


def populate(objs):
    DerivedTokens.objects.bulk_create(
        map(
            lambda obj: DerivedTokens(
                token_id=obj.id,
                gloss_with_replacement="_" if obj.gloss in {'xxxxx', 'xxxx', 'xxx', 'yyy', 'zzz'}
                else (obj.gloss if not obj.replacement
                      else obj.replacement),
                part_of_speech=obj.part_of_speech if obj.part_of_speech else "_",
                utterance_id=obj.utterance_id,
                transcript_id=obj.transcript_id,
                corpus_id=obj.corpus_id,
                collection_id=obj.collection_id,
                requires_tags=True if obj.id in requires_tags[obj.corpus_id] else False,
                speaker_name=obj.speaker_name,
                speaker_role=obj.speaker_role
            ), objs
        )
    )


if __name__ == "__main__":
    
    print('Populating Providence...')
    queryset = Token.objects.filter(corpus_id=49).order_by('id')
    status = queryset_foreach(
        queryset,
        populate,
        batch_size=20000
    )

    print('Populating Manchester...')
    queryset = Token.objects.filter(corpus_id=204).order_by('id')
    status = queryset_foreach(
        queryset,
        populate,
        batch_size=20000
    )
