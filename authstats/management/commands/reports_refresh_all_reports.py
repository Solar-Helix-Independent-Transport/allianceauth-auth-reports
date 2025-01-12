
from django.core.management.base import BaseCommand

from ...models import ReportResults
from ...tasks import run_report_for_corp


class Command(BaseCommand):
    help = 'refresh all a reports'

    def handle(self, *args, **options):
        for rep in ReportResults.objects.all():
            self.stdout.write(
                f"Refreshing Report:    Corp:{rep.corporation}     Report:{rep.report.name}")
            run_report_for_corp.delay(
                rep.corporation.corporation_id, rep.report_id)
