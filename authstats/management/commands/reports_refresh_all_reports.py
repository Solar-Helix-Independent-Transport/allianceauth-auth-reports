from django.core.management.base import BaseCommand

from ...models import ReportResults
from ...targets import target_for_results
from ...tasks import queue_report


class Command(BaseCommand):
    help = 'refresh all a reports'

    def handle(self, *args, **options):
        for rep in ReportResults.objects.all():
            target = target_for_results(rep)
            self.stdout.write(
                f"Refreshing Report:    {target.target_type}:{target.label}     Report:{rep.report.name}")
            queue_report(target, rep.report_id)
