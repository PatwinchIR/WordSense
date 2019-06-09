from django.contrib.auth.models import User
from django.db import models

# Create your models here.


class WorkUnit(models.Model):
    WORK_UNIT_STATUS = (
        ("idle", "IDLE"),
        ("active", "ACTIVE")
    )

    utterance_ids = models.TextField()
    transcript_id = models.PositiveIntegerField()
    corpus_id = models.PositiveIntegerField()
    collection_id = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(
        max_length=20, choices=WORK_UNIT_STATUS, default="idle")
    times_worked = models.PositiveIntegerField(default=0)
    last_active_time = models.DateTimeField()

    class Meta:
        db_table = 'work_unit'
        app_label = 'ws_web'


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

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    user_type = models.CharField(
        max_length=20, choices=USER_TYPE, default="in_lab_staff")
    browser_display_lang = models.CharField(
        max_length=20, blank=True, null=True)
    browser_user_agent = models.TextField()
    browser_platform = models.TextField()
    ip = models.GenericIPAddressField()

    class Meta:
        db_table = 'participant'
        app_label = 'ws_web'


class DerivedTokens(models.Model):
    token_id = models.PositiveIntegerField()
    gloss_with_replacement = models.CharField(
        max_length=255, blank=True, null=True)
    part_of_speech = models.CharField(max_length=255, blank=True, null=True)
    utterance_id = models.PositiveIntegerField()
    transcript_id = models.PositiveIntegerField()
    corpus_id = models.PositiveIntegerField()
    collection_id = models.CharField(max_length=255, blank=True, null=True)
    requires_tags = models.BooleanField()
    speaker_name = models.CharField(max_length=255, blank=True, null=True)
    speaker_role = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'derived_tokens'
        app_label = 'ws_web'


class Tags(models.Model):
    gloss_with_replacement = models.CharField(
        max_length=255, blank=True, null=True)
    token = models.ForeignKey('DerivedTokens', on_delete=models.CASCADE)
    transcript_id = models.PositiveIntegerField(null=True)
    sense = models.ForeignKey('WordNet30', on_delete=models.PROTECT, null=True)
    fixed_pos = models.CharField(
        max_length=255, blank=True, null=True)
    participant = models.ForeignKey('Participant', on_delete=models.PROTECT)

    class Meta:
        db_table = 'tags'
        app_label = 'ws_web'
        unique_together = ('token', 'participant', 'sense')


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
    collection = models.ForeignKey(
        Collection, models.DO_NOTHING, blank=True, null=True)
    collection_name = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'corpus'
        app_label = 'childesdb'


class Token(models.Model):
    gloss = models.CharField(max_length=255, blank=True, null=True)
    replacement = models.CharField(max_length=255, blank=True, null=True)
    stem = models.CharField(max_length=255, blank=True, null=True)
    part_of_speech = models.CharField(max_length=255, blank=True, null=True)
    speaker = models.ForeignKey(
        Participant, models.DO_NOTHING, blank=True, null=True)
    utterance = models.ForeignKey(
        'Utterance', models.DO_NOTHING, blank=True, null=True)
    token_order = models.IntegerField(blank=True, null=True)
    corpus = models.ForeignKey(
        Corpus, models.DO_NOTHING, blank=True, null=True)
    transcript = models.ForeignKey(
        'Transcript', models.DO_NOTHING, blank=True, null=True)
    speaker_code = models.CharField(max_length=255, blank=True, null=True)
    speaker_name = models.CharField(max_length=255, blank=True, null=True)
    speaker_role = models.CharField(max_length=255, blank=True, null=True)
    target_child = models.ForeignKey(
        Participant, models.DO_NOTHING, blank=True, null=True)
    target_child_age = models.FloatField(blank=True, null=True)
    target_child_name = models.CharField(max_length=255, blank=True, null=True)
    target_child_sex = models.CharField(max_length=255, blank=True, null=True)
    utterance_type = models.CharField(max_length=255, blank=True, null=True)
    collection = models.ForeignKey(
        Collection, models.DO_NOTHING, blank=True, null=True)
    collection_name = models.CharField(max_length=255, blank=True, null=True)
    english = models.CharField(max_length=255, blank=True, null=True)
    prefix = models.CharField(max_length=255, blank=True, null=True)
    suffix = models.CharField(max_length=255, blank=True, null=True)
    num_morphemes = models.IntegerField(blank=True, null=True)
    language = models.CharField(max_length=255, blank=True, null=True)
    corpus_name = models.CharField(max_length=255, blank=True, null=True)
    clitic = models.CharField(max_length=255, blank=True, null=True)

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
    corpus = models.ForeignKey(
        Corpus, models.DO_NOTHING, blank=True, null=True)
    speaker = models.ForeignKey(
        Participant, models.DO_NOTHING, blank=True, null=True)
    target_child = models.ForeignKey(
        Participant, models.DO_NOTHING, blank=True, null=True)
    transcript = models.ForeignKey(
        'Transcript', models.DO_NOTHING, blank=True, null=True)
    collection = models.ForeignKey(
        Collection, models.DO_NOTHING, blank=True, null=True)
    collection_name = models.CharField(max_length=255, blank=True, null=True)
    language = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'token_frequency'
        app_label = 'childesdb'


class Transcript(models.Model):
    language = models.CharField(max_length=255, blank=True, null=True)
    date = models.DateField(blank=True, null=True)
    filename = models.CharField(max_length=255, blank=True, null=True)
    corpus = models.ForeignKey(
        Corpus, models.DO_NOTHING, blank=True, null=True)
    target_child = models.ForeignKey(
        Participant, models.DO_NOTHING, blank=True, null=True)
    target_child_age = models.FloatField(blank=True, null=True)
    target_child_name = models.CharField(max_length=255, blank=True, null=True)
    target_child_sex = models.CharField(max_length=255, blank=True, null=True)
    collection = models.ForeignKey(
        Collection, models.DO_NOTHING, blank=True, null=True)
    collection_name = models.CharField(max_length=255, blank=True, null=True)
    pid = models.CharField(max_length=255, blank=True, null=True)
    corpus_name = models.CharField(max_length=255, blank=True, null=True)

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
    mlu_w = models.FloatField(blank=True, null=True)
    num_types = models.IntegerField(blank=True, null=True)
    num_tokens = models.IntegerField(blank=True, null=True)
    speaker = models.ForeignKey(
        Participant, models.DO_NOTHING, blank=True, null=True)
    target_child = models.ForeignKey(
        Participant, models.DO_NOTHING, blank=True, null=True)
    transcript = models.ForeignKey(
        Transcript, models.DO_NOTHING, blank=True, null=True)
    corpus = models.ForeignKey(
        Corpus, models.DO_NOTHING, blank=True, null=True)
    collection = models.ForeignKey(
        Collection, models.DO_NOTHING, blank=True, null=True)
    collection_name = models.CharField(max_length=255, blank=True, null=True)
    language = models.CharField(max_length=255, blank=True, null=True)
    hdd = models.FloatField(blank=True, null=True)
    mtld = models.FloatField(blank=True, null=True)
    mlu_m = models.FloatField(blank=True, null=True)
    num_morphemes = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'transcript_by_speaker'
        app_label = 'childesdb'


class Utterance(models.Model):
    speaker = models.ForeignKey(
        Participant, models.DO_NOTHING, blank=True, null=True)
    utterance_order = models.IntegerField(blank=True, null=True)
    transcript = models.ForeignKey(
        Transcript, models.DO_NOTHING, blank=True, null=True)
    corpus = models.ForeignKey(
        Corpus, models.DO_NOTHING, blank=True, null=True)
    gloss = models.TextField(blank=True, null=True)
    num_tokens = models.IntegerField(blank=True, null=True)
    stem = models.TextField(blank=True, null=True)
    part_of_speech = models.TextField(blank=True, null=True)
    speaker_code = models.CharField(max_length=255, blank=True, null=True)
    speaker_name = models.CharField(max_length=255, blank=True, null=True)
    speaker_role = models.CharField(max_length=255, blank=True, null=True)
    target_child = models.ForeignKey(
        Participant, models.DO_NOTHING, blank=True, null=True)
    target_child_age = models.FloatField(blank=True, null=True)
    target_child_name = models.CharField(max_length=255, blank=True, null=True)
    target_child_sex = models.CharField(max_length=255, blank=True, null=True)
    type = models.CharField(max_length=255, blank=True, null=True)
    media_end = models.FloatField(blank=True, null=True)
    media_start = models.FloatField(blank=True, null=True)
    media_unit = models.CharField(max_length=255, blank=True, null=True)
    collection = models.ForeignKey(
        Collection, models.DO_NOTHING, blank=True, null=True)
    collection_name = models.CharField(max_length=255, blank=True, null=True)
    num_morphemes = models.IntegerField(blank=True, null=True)
    language = models.CharField(max_length=255, blank=True, null=True)
    corpus_name = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'utterance'
        app_label = 'childesdb'
