import json

from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand

from ...models import Report
from ...signals import filters
from ...tasks import run_report_for_corp


class Command(BaseCommand):
    help = 'run a report'

    def add_arguments(self, parser):
        parser.add_argument('--report', type=int)
        parser.add_argument('--corp_id', type=int)

    def handle(self, *args, **options):
        self.stdout.write(
            f"Running a report for RID:{options['report']} CID:{options['corp_id']}")
        return json.dumps(run_report_for_corp(options['corp_id'], options['report']), indent=4)
