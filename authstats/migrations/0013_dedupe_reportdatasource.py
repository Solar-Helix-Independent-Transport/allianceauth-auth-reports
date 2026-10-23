from django.db import migrations, models
from django.db.models import Count, Min


def dedupe_data_sources(apps, schema_editor):
    """
        A filter recreated with a reused pk (eg after `migrate <app> zero`) got a
        second source. Keep the oldest, move report fields onto it.
    """
    ReportDataSource = apps.get_model('authstats', 'ReportDataSource')
    ReportDataThrough = apps.get_model('authstats', 'ReportDataThrough')
    dupes = ReportDataSource.objects.values(
        "content_type_id", "object_id"
    ).annotate(n=Count("id"), keep=Min("id")).filter(n__gt=1)
    for d in dupes:
        extra = ReportDataSource.objects.filter(
            content_type_id=d["content_type_id"], object_id=d["object_id"]
        ).exclude(id=d["keep"])
        ReportDataThrough.objects.filter(
            report_Data_source__in=extra
        ).update(report_Data_source_id=d["keep"])
        extra.delete()


class Migration(migrations.Migration):

    dependencies = [
        ('authstats', '0012_default_member_state'),
        ('contenttypes', '0002_remove_content_type_name'),
    ]

    operations = [
        migrations.RunPython(dedupe_data_sources, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name='reportdatasource',
            constraint=models.UniqueConstraint(
                fields=('content_type', 'object_id'),
                name='authstats_unique_data_source'),
        ),
    ]
