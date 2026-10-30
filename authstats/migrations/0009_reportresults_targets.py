import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('eveonline', '0019_v5squash'),
        ('authstats', '0008_alter_reportdatathrough_long_descriptions'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='authreportsconfiguration',
            options={'default_permissions': [], 'permissions': (('basic_access', 'Can access reports module'), ('holding_corps', 'Can access configured holding corp reports.'), ('own_corp', 'Can access own corporations reports.'), (
                'own_alliance', 'Can access own alliances reports.'), ('own_state', 'Can access own states reports.'), ('restricted_reports', 'Can access restricted reports.'), ('global_reports', 'Can access all reports for all targets.')), 'verbose_name': 'Auth Reports Configuration'},
        ),
        migrations.AddField(
            model_name='reportresults',
            name='alliance',
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='eveonline.eveallianceinfo'),
        ),
        migrations.AddField(
            model_name='reportresults',
            name='group',
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='auth.group'),
        ),
        migrations.AlterField(
            model_name='reportresults',
            name='corporation',
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='eveonline.evecorporationinfo'),
        ),
    ]
