# ws_web/urls.py

from django.urls import re_path, path, include

from . import views

urlpatterns = [
    re_path(r'^get_collection/$', views.ListCollection.as_view(), name='list-collection'),
    re_path(r'^get_corpora/$', views.ListCorpus.as_view(), name='list-corpus'),
    re_path(r'^get_transcripts/$', views.ListTranscript.as_view(), name='list-transcript'),
    re_path(r'^get_utterances/$', views.ListUtterance.as_view(), name='list-utterance'),
    re_path(r'^get_senses/$', views.ListSenses.as_view(), name='sense-example'),
    path('', views.ListCollection.as_view()),
]