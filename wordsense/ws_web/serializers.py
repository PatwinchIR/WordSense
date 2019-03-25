# ws_web/serializers.py

from rest_framework import serializers

from ws_web.models import Collection, Corpus, Transcript, Utterance


class CollectionSerializer(serializers.ModelSerializer):
    class Meta:
        fields = (
            'id',
            'name',
        )
        model = Collection


class CorpusSerializer(serializers.ModelSerializer):
    class Meta:
        fields = (
            'id',
            'name',
            'collection_id'
        )
        model = Corpus


class TranscriptSerializer(serializers.ModelSerializer):
    class Meta:
        fields = (
            'id',
            'languages',
            'date',
            'filename',
            'corpus_id',
            'target_child_id',
            'target_child_age',
            'target_child_name'
        )
        model = Transcript


class UtteranceSerializer(serializers.ModelSerializer):
    class Meta:
        fields = (
            'id',
            'order',
            'gloss',
            'stem',
            'part_of_speech',
        )
        model = Utterance

