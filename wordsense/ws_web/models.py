from django.db import models

# Create your models here.


class WordNet30(models.Model):
    word = models.CharField(max_length=100, default='')
    definition = models.TextField()
    examples = models.TextField()
    lemma_names = models.TextField()
    name = models.CharField(max_length=255)
    offset = models.BigIntegerField()
    pos = models.CharField(max_length=5, default='')

    class Meta:
        db_table = 'wordnet30'
        app_label = 'ws_web'


class Participant(models.Model):
    USER_TYPE = (
        ("mechenical_turk", "Mechanical Turk Workers"),
        ("in_lab_staff", "In-lab Trained Staff")
    )

    username = models.CharField(max_length=40, unique=True)
    user_type = models.CharField(max_length=20, choices=USER_TYPE, default="in_lab_staff")
    browser_display_lang = models.CharField(max_length=20, blank=True, null=True)
    browser_user_agent = models.TextField()
    browser_platform = models.TextField()
    ip = models.GenericIPAddressField()

    class Meta:
        db_table = 'participant'
        app_label = 'ws_web'


class DerivedTokens(models.Model):
    token_id = models.PositiveIntegerField()
    gloss_with_replacement = models.CharField(max_length=255, blank=True, null=True)
    part_of_speech = models.CharField(max_length=255, blank=True, null=True)
    utterance_id = models.PositiveIntegerField()
    transcript_id = models.PositiveIntegerField()
    corpus_id = models.PositiveIntegerField()
    collection_id = models.CharField(max_length=255, blank=True, null=True)
    requires_tags = models.BooleanField()

    class Meta:
        db_table = 'derived_tokens'
        app_label = 'ws_web'


class Tags(models.Model):
    gloss_with_replacement = models.CharField(max_length=255, blank=True, null=True)
    token_id = models.ForeignKey('DerivedTokens', on_delete=models.CASCADE)
    sense_offset = models.PositiveIntegerField()
    participant_id = models.ForeignKey('Participant', on_delete=models.PROTECT)

    class Meta:
        db_table = 'tags'
        app_label = 'ws_web'
        unique_together = ('token_id', 'participant_id', 'sense_offset')


# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey has `on_delete` set to the desired behavior.
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.


class Collection(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'collection'
        app_label = 'childesdb'


class Corpus(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    collection = models.ForeignKey(Collection, models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'corpus'
        app_label = 'childesdb'


class Participant(models.Model):
    code = models.CharField(max_length=255, blank=True, null=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=255, blank=True, null=True)
    language = models.CharField(max_length=255, blank=True, null=True)
    group = models.CharField(max_length=255, blank=True, null=True)
    sex = models.CharField(max_length=255, blank=True, null=True)
    ses = models.CharField(max_length=255, blank=True, null=True)
    education = models.CharField(max_length=255, blank=True, null=True)
    custom = models.CharField(max_length=255, blank=True, null=True)
    corpus = models.ForeignKey(Corpus, models.DO_NOTHING, blank=True, null=True)
    max_age = models.FloatField(blank=True, null=True)
    min_age = models.FloatField(blank=True, null=True)
    target_child = models.ForeignKey('self', models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'participant'
        app_label = 'childesdb'


class Token(models.Model):
    gloss = models.CharField(max_length=255, blank=True, null=True)
    replacement = models.CharField(max_length=255, blank=True, null=True)
    stem = models.CharField(max_length=255, blank=True, null=True)
    part_of_speech = models.CharField(max_length=255, blank=True, null=True)
    relation = models.CharField(max_length=255, blank=True, null=True)
    speaker = models.ForeignKey(Participant, models.DO_NOTHING, blank=True, null=True)
    utterance = models.ForeignKey('Utterance', models.DO_NOTHING, blank=True, null=True)
    token_order = models.IntegerField(blank=True, null=True)
    corpus = models.ForeignKey(Corpus, models.DO_NOTHING, blank=True, null=True)
    transcript = models.ForeignKey('Transcript', models.DO_NOTHING, blank=True, null=True)
    speaker_age = models.FloatField(blank=True, null=True)
    speaker_code = models.CharField(max_length=255, blank=True, null=True)
    speaker_name = models.CharField(max_length=255, blank=True, null=True)
    speaker_role = models.CharField(max_length=255, blank=True, null=True)
    speaker_sex = models.CharField(max_length=255, blank=True, null=True)
    target_child = models.ForeignKey(Participant, models.DO_NOTHING, blank=True, null=True)
    target_child_age = models.FloatField(blank=True, null=True)
    target_child_name = models.CharField(max_length=255, blank=True, null=True)
    target_child_sex = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'token'
        app_label = 'childesdb'


class TokenFrequency(models.Model):
    gloss = models.CharField(max_length=255, blank=True, null=True)
    count = models.IntegerField(blank=True, null=True)
    speaker_role = models.CharField(max_length=255, blank=True, null=True)
    target_child_name = models.CharField(max_length=255, blank=True, null=True)
    target_child_age = models.FloatField(blank=True, null=True)
    target_child_sex = models.CharField(max_length=255, blank=True, null=True)
    corpus = models.ForeignKey(Corpus, models.DO_NOTHING, blank=True, null=True)
    speaker = models.ForeignKey(Participant, models.DO_NOTHING, blank=True, null=True)
    target_child = models.ForeignKey(Participant, models.DO_NOTHING, blank=True, null=True)
    transcript = models.ForeignKey('Transcript', models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'token_frequency'
        app_label = 'childesdb'


class Transcript(models.Model):
    languages = models.CharField(max_length=255, blank=True, null=True)
    date = models.DateField(blank=True, null=True)
    filename = models.CharField(max_length=255, blank=True, null=True)
    corpus = models.ForeignKey(Corpus, models.DO_NOTHING, blank=True, null=True)
    target_child = models.ForeignKey(Participant, models.DO_NOTHING, blank=True, null=True)
    target_child_age = models.FloatField(blank=True, null=True)
    target_child_name = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'transcript'
        app_label = 'childesdb'


class TranscriptBySpeaker(models.Model):
    speaker_role = models.CharField(max_length=255, blank=True, null=True)
    target_child_name = models.CharField(max_length=255, blank=True, null=True)
    target_child_age = models.FloatField(blank=True, null=True)
    target_child_sex = models.CharField(max_length=255, blank=True, null=True)
    num_utterances = models.IntegerField(blank=True, null=True)
    mlu = models.FloatField(blank=True, null=True)
    num_types = models.IntegerField(blank=True, null=True)
    num_tokens = models.IntegerField(blank=True, null=True)
    speaker = models.ForeignKey(Participant, models.DO_NOTHING, blank=True, null=True)
    target_child = models.ForeignKey(Participant, models.DO_NOTHING, blank=True, null=True)
    transcript = models.ForeignKey(Transcript, models.DO_NOTHING, blank=True, null=True)
    corpus = models.ForeignKey(Corpus, models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'transcript_by_speaker'
        app_label = 'childesdb'


class Utterance(models.Model):
    speaker = models.ForeignKey(Participant, models.DO_NOTHING, blank=True, null=True)
    order = models.IntegerField(blank=True, null=True)
    transcript = models.ForeignKey(Transcript, models.DO_NOTHING, blank=True, null=True)
    corpus = models.ForeignKey(Corpus, models.DO_NOTHING, blank=True, null=True)
    gloss = models.TextField(blank=True, null=True)
    length = models.IntegerField(blank=True, null=True)
    relation = models.TextField(blank=True, null=True)
    stem = models.TextField(blank=True, null=True)
    part_of_speech = models.TextField(blank=True, null=True)
    speaker_age = models.FloatField(blank=True, null=True)
    speaker_code = models.CharField(max_length=255, blank=True, null=True)
    speaker_name = models.CharField(max_length=255, blank=True, null=True)
    speaker_role = models.CharField(max_length=255, blank=True, null=True)
    speaker_sex = models.CharField(max_length=255, blank=True, null=True)
    target_child = models.ForeignKey(Participant, models.DO_NOTHING, blank=True, null=True)
    target_child_age = models.FloatField(blank=True, null=True)
    target_child_name = models.CharField(max_length=255, blank=True, null=True)
    target_child_sex = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'utterance'
        app_label = 'childesdb'
