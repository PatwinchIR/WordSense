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


class TokenSerializer(serializers.Serializer):
    word = serializers.CharField(max_length=255)
    pos = serializers.CharField(max_length=255)


class UtteranceSerializer(serializers.ModelSerializer):
    gloss_pos = serializers.SerializerMethodField()

    class Meta:
        fields = (
            'id',
            'order',
            'gloss_pos',
            'part_of_speech',
            'speaker_role',
        )
        model = Utterance

    def get_gloss_pos(self, obj):
        gloss_pos = TokenSerializer(data=[{'word': word, 'pos': pos} for word, pos in zip(obj.gloss.split(' '), obj.part_of_speech.split(' '))], many=True)
        if gloss_pos.is_valid():
            return gloss_pos.validated_data
        return gloss_pos.initial_data
