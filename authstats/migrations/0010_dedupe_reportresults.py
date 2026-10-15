from django.db import migrations
from django.db.models import Count


def dedupe_corp_results(apps, schema_editor):
    """
        Nothing enforced one result per (corporation, report) before 0011;
        keep the most recently updated row of any duplicates.
    """
    ReportResults = apps.get_model('authstats', 'ReportResults')
    dupes = ReportResults.objects.values(
        "corporation_id", "report_id"
    ).annotate(n=Count("id")).filter(n__gt=1)
    for d in dupes:
        rows = ReportResults.objects.filter(
            corporation_id=d["corporation_id"], report_id=d["report_id"]
        ).order_by("-last_update", "-id")
        ReportResults.objects.filter(
            id__in=list(rows.values_list("id", flat=True)[1:])
        ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('authstats', '0009_reportresults_targets'),
    ]

    operations = [
        migrations.RunPython(dedupe_corp_results, migrations.RunPython.noop),
    ]
