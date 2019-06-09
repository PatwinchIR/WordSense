# Generated by Django 2.2 on 2019-06-09 07:29

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('ws_web', '0008_tags_transcript_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='tags',
            name='sense',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, to='ws_web.WordNet30'),
        ),
        migrations.AlterUniqueTogether(
            name='tags',
            unique_together={('token', 'participant', 'sense')},
        ),
        migrations.RemoveField(
            model_name='tags',
            name='sense_offset',
        ),
    ]