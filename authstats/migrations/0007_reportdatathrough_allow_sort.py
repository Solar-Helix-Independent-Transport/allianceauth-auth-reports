# Generated by Django 4.0.10 on 2023-06-24 09:46

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authstats', '0006_report_show_character_image'),
    ]

    operations = [
        migrations.AddField(
            model_name='reportdatathrough',
            name='allow_sort',
            field=models.BooleanField(
                default=True, help_text='Allow sorting of this column in the UI.'),
        ),
    ]
