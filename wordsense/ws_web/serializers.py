# ws_web/serializers.py

from rest_framework import serializers

from ws_web.models import Collection, Corpus, Transcript, Utterance, Token, DerivedTokens, Tags


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
            'filename',
            'corpus_id',
        )
        model = Transcript


class SenseSerializer(serializers.Serializer):
    offset = serializers.SerializerMethodField()
    sense = serializers.SerializerMethodField()
    examples = serializers.SerializerMethodField()

    class Meta:
        fields = ('offset', 'sense', 'examples')

    def get_offset(self, obj):
        return obj.offset()

    def get_sense(self, obj):
        return obj.definition()

    def get_examples(self, obj):
        return obj.examples()


class TokenSerializer(serializers.Serializer):
    word = serializers.CharField(max_length=255)
    pos = serializers.CharField(max_length=255)
    lemma = serializers.CharField(max_length=255)


class DerivedTokensSerializer(serializers.ModelSerializer):
    tag_status = serializers.SerializerMethodField()

    class Meta:
        model = DerivedTokens
        fields = (
            'id',
            'gloss_with_replacement',
            'part_of_speech',
            'utterance_id',
            'speaker_role',
            'tag_status'
        )

    def get_tag_status(self, obj):
        if obj.part_of_speech not in ("n", "v", "adv", "adj"):
            return "UNTAGGABLE"
        qryset = Tags.objects.filter(
            gloss_with_replacement=obj.gloss_with_replacement,
            token_id=obj.id
        )
        return "TAGGED" if len(qryset) >= 1 else "TAGGABLE"


class TagsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tags
        fields = '__all__'


class UtteranceSerializer(serializers.ModelSerializer):
    gloss_pos = serializers.SerializerMethodField()

    class Meta:
        fields = (
            'id',
            'order',
            'id_gloss_pos',
            'part_of_speech',
            'speaker_role',
        )
        model = Utterance

    def get_gloss_pos(self, obj):
        gloss_pos = TokenSerializer(data=[{'word': word, 'pos': pos, 'lemma': lemma} for word, pos, lemma in zip(
            obj.gloss.split(' '), obj.part_of_speech.split(' '), obj.stem.split(' '))], many=True)
        if gloss_pos.is_valid():
            return gloss_pos.validated_data
        return gloss_pos.initial_data
