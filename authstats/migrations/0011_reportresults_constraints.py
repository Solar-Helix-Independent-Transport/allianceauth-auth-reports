from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authstats', '0010_dedupe_reportresults'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='reportresults',
            constraint=models.CheckConstraint(check=models.Q(models.Q(('alliance__isnull', True), ('corporation__isnull', False), ('group__isnull', True)), models.Q(('alliance__isnull', False), ('corporation__isnull', True), (
                'group__isnull', True)), models.Q(('alliance__isnull', True), ('corporation__isnull', True), ('group__isnull', False)), _connector='OR'), name='authstats_results_exactly_one_target'),
        ),
        migrations.AddConstraint(
            model_name='reportresults',
            constraint=models.UniqueConstraint(fields=(
                'corporation', 'report'), name='authstats_results_unique_corporation_report'),
        ),
        migrations.AddConstraint(
            model_name='reportresults',
            constraint=models.UniqueConstraint(
                fields=('alliance', 'report'), name='authstats_results_unique_alliance_report'),
        ),
        migrations.AddConstraint(
            model_name='reportresults',
            constraint=models.UniqueConstraint(
                fields=('group', 'report'), name='authstats_results_unique_group_report'),
        ),
    ]
