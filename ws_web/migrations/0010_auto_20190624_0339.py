# Generated by Django 2.2 on 2019-06-24 03:39

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('ws_web', '0009_auto_20190609_0729'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='workunit',
            name='utterance_ids',
        ),
        migrations.AddField(
            model_name='participant',
            name='worker_id',
            field=models.CharField(default='', max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='workunit',
            name='participant',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='ws_web.Participant'),
        ),
        migrations.CreateModel(
            name='WorkUnitContent',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('utterance_id', models.PositiveIntegerField()),
                ('work_unit', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='ws_web.WorkUnit')),
            ],
        ),
    ]
