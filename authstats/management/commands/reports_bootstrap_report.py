from django.core.management.base import BaseCommand

from ...models import (
    Report, ReportDataSource, ReportDataThrough, ReportFieldAlts,
)


class Command(BaseCommand):
    help = 'Create a Basic Report'

    def handle(self, *args, **options):
        self.stdout.write("Creating Basic Report")
        alts_filed = ReportFieldAlts.objects.create(
            name="Alts - Field",
            description="Alts"
        )
        data_source = ReportDataSource.objects.all().last()
        self.stdout.write(f"Adding `{data_source}` to report")
        report = Report.objects.create(
            name="Corporation Member Alts",
        )
        through_field = ReportDataThrough.objects.create(
            report=report,
            report_Data_source=data_source,
            rank=5,
            header="Alts",
            long_descriptions="All known alts on this account.",
            allow_sort=False
        )
        self.stdout.write(f"`Corporation Member Alts` report created.")
