# Generated by Django 4.0.10 on 2023-06-20 10:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0020_userprofile_language_userprofile_night_mode'),
        ('authstats', '0002_reportdatathrough_checkbox_only'),
    ]

    operations = [
        migrations.AddField(
            model_name='authreportsconfiguration',
            name='states_to_include',
            field=models.ManyToManyField(to='authentication.state'),
        ),
    ]
