# Generated by Django 2.2 on 2019-04-03 06:15

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ws_web', '0003_added_new_tables_in_postgres'),
    ]

    operations = [
        migrations.AddField(
            model_name='derivedtokens',
            name='speaker_name',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='derivedtokens',
            name='speaker_role',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
