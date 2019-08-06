import sys
import time

import django

import pandas as pd
import datetime

from django.db.models import F

django.setup()

from ws_web.models import Tags

tags_df = pd.DataFrame(list(Tags.objects.select_related("token").select_related("sense").values("participant_id",
                                                                                                "gloss_with_replacement",
                                                                                                "sense__offset",
                                                                                                "token_id",
                                                                                                "token__part_of_speech"
                                                                                                )
                            )
                       )

print(tags_df)

tags_df.to_csv("tags.csv", index=False, header=0)

# tags_df = pd.read_csv("tags.csv")

