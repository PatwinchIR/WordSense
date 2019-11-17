from datetime import datetime
import pandas as pd
import os
import numpy as np
import postgres_config
from sqlalchemy import create_engine

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wordsense.settings')
import django

django.setup()

from ws_web.models import DerivedTokens, WorkUnit, WorkUnitContent

corpus_id = 49
goal_tokens = 24 # ~10 minutes of tagging

#pull taggable tokens with sql
wordsense_auth = postgres_config.Authenticator('WordSense')
ws_engine = create_engine(wordsense_auth.connectionString)
token_df = pd.read_sql_query('SELECT * FROM derived_tokens WHERE requires_tags=True AND corpus_id='+str(corpus_id),
                             ws_engine)

taggable_utterances_df = token_df.sort_values(by=['utterance_id'], ascending=True)

def populate(work_unit_id, transcript_id):
    work_unit, created = WorkUnit.objects.get_or_create(
        id=work_unit_id,
        transcript_id=transcript_id,
        corpus_id=corpus_id,
        collection_id=3,
        status="idle",
        times_worked=0,
        last_active_time=None)

if __name__ == "__main__":
    work_unit_id = 0
    counter = 0
    tokens_count = 0
    #populate each transcript seperately
    for transcript_id in list(np.unique(token_df.transcript_id)):

        utterances = np.unique(list(token_df[token_df['transcript_id']==transcript_id].utterance_id))
        #make a work unit at the start of each transcript
        counter, tokens_count=0,0
        work_unit_id+=1
        populate(work_unit_id, transcript_id)

        for i in np.arange(0, len(utterances)):
            tokens_count += len(token_df[token_df['utterance_id'] == utterances[i]])
            WorkUnitContent.objects.get_or_create(
                utterance_id=utterances[i],
                work_unit_id=work_unit_id
                )
            if tokens_count >= goal_tokens:
                work_unit_id+=1
                populate(work_unit_id, transcript_id)
                counter, tokens_count=0,0

            if i >= len(utterances):
                counter, tokens_count=0,0
        counter, tokens_count=0,0