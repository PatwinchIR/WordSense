import sys
import time

import django

from ws_web.preprocessing_scripts.utils.queryset_foreach import queryset_foreach

django.setup()

# DerivedTokens Populating
from ws_web.models import DerivedTokens, Token


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
                requires_tags=True if obj.part_of_speech in {'n', 'v', 'adv', 'adj'} else False,
                speaker_name=obj.speaker_name,
                speaker_role=obj.speaker_role
            ), objs
        )
    )


if __name__ == "__main__":
    # Eng-UK
    queryset = Token.objects.filter(collection_id=13).order_by('id')
    status = queryset_foreach(
        queryset,
        populate,
        batch_size=20000
    )
