import json

from django.core.management.base import BaseCommand, CommandError

from ...targets import TARGET_TYPES
from ...tasks import generate_report


class Command(BaseCommand):
    help = 'run a report'

    def add_arguments(self, parser):
        parser.add_argument('--report', type=int, required=True)
        parser.add_argument(
            '--target_type', choices=list(TARGET_TYPES), default="corp")
        parser.add_argument('--target_id', type=int)
        parser.add_argument('--corp_id', type=int,
                            help="Alias for --target_type corp --target_id <corp_id>")

    def handle(self, *args, **options):
        target_type = options['target_type']
        target_id = options['target_id']
        if options['corp_id'] is not None:
            if target_id is not None:
                raise CommandError(
                    "Use either --corp_id or --target_id, not both")
            target_type, target_id = "corp", options['corp_id']
        if target_id is None:
            raise CommandError("--target_id (or --corp_id) is required")
        self.stdout.write(
            f"Running a report for RID:{options['report']} {target_type}:{target_id}")
        return json.dumps(generate_report(target_type, target_id, options['report']), indent=4, default=str)
