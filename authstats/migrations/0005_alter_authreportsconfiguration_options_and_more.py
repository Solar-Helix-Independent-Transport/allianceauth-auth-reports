# Generated by Django 4.0.10 on 2023-06-24 09:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authstats', '0004_alter_authreportsconfiguration_options'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='authreportsconfiguration',
            options={'default_permissions': [], 'permissions': (('basic_access', 'Can access reports module'), ('holding_corps', 'Can access configured holding corp reports.'), ('own_corp', 'Can access own corporations reports.'), (
                'own_alliance', 'Can access own alliances reports.'), ('own_state', 'Can access own states reports.'), ('restricted_reports', 'Can access restricted reports.')), 'verbose_name': 'Auth Reports Configuration'},
        ),
        migrations.AddField(
            model_name='report',
            name='restricted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='reportdatathrough',
            name='long_descriptions',
            field=models.CharField(
                blank=True, default=None, help_text='Long description show to the user on hover of column name.', max_length=500, null=True),
        ),
        migrations.AlterField(
            model_name='reportdatathrough',
            name='checkbox_only',
            field=models.BooleanField(
                default=False, help_text='Show this columns data as pass/fail checkboxes only.'),
        ),
        migrations.AlterField(
            model_name='reportdatathrough',
            name='header',
            field=models.CharField(
                help_text='Column header show to the user.', max_length=250),
        ),
        migrations.AlterField(
            model_name='reportdatathrough',
            name='pass_fail_aggregate',
            field=models.BooleanField(
                default=False, help_text='Show an aggregate of how many members pass this field in the header.'),
        ),
        migrations.AlterField(
            model_name='reportdatathrough',
            name='rank',
            field=models.IntegerField(
                default=5, help_text='Order the field will be show in. Lowest First.'),
        ),
    ]