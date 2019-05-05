# ws_web/urls.py

from django.urls import re_path, path
from . import staff_views, public_views

urlpatterns = [
    re_path(r'^get_collection/$', staff_views.ListCollection.as_view(),
            name='list-collection'),
    re_path(r'^get_corpora/$', staff_views.ListCorpus.as_view(),
            name='list-corpus'),
    re_path(r'^get_transcripts/$', staff_views.ListTranscript.as_view(),
            name='list-transcript'),
    re_path(r'^get_utterances/$', staff_views.ListDerivedTokens.as_view(),
            name='list-utterance'),
    re_path(r'^get_senses/$', staff_views.ListSenses.as_view(),
            name='sense-example'),
    re_path(r'^get_tags/$', staff_views.ListCreateAnnotation.as_view(),
            name='list-tag'),
    re_path(r'^save/$', staff_views.ListCreateAnnotation.as_view(), name='save-tag'),
    re_path(r'^signup/$', staff_views.ListUser.as_view(), name='sign-up'),
    re_path(r'^current_user/$', staff_views.current_user),

    re_path(r'^public/get_utterances/$',
            public_views.ListDerivedTokens.as_view(), name='public-list-tag'),
    re_path(r'^public/get_senses/$', public_views.ListSenses.as_view(),
            name='public-sense-example'),
    re_path(r'^public/get_tags/$',
            public_views.ListCreateAnnotation.as_view(), name='public-list-tag'),
    re_path(r'^public/save/$', public_views.ListCreateAnnotation.as_view(),
            name='public-save-tag')
]
