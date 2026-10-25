from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand

from ...models import (
    Report, ReportDataSource, ReportDataThrough, ReportFieldAlts,
    ReportFieldLastLogin,
)


class Command(BaseCommand):
    help = 'Create a Basic Report'

    def data_source(self, filter_object):
        # the post_save signal normally made it already
        data_source, _ = ReportDataSource.objects.get_or_create(
            content_type=ContentType.objects.get_for_model(filter_object),
            object_id=filter_object.pk
        )
        self.stdout.write(f"Adding `{data_source}` to report")
        return data_source

    def handle(self, *args, **options):
        self.stdout.write("Creating Basic Report")
        alts_filed = ReportFieldAlts.objects.create(
            name="Alts - Field",
            description="Alts"
        )
        login_field = ReportFieldLastLogin.objects.create(
            name="Last Login - Field",
            description="Last Login"
        )
        report = Report.objects.create(
            name="Corporation Member Alts",
        )
        ReportDataThrough.objects.create(
            report=report,
            report_Data_source=self.data_source(login_field),
            rank=4,
            header="Last Login",
            long_descriptions=(
                f"Last login of any character on this account, fails after "
                f"{login_field.days_since_login} days. Needs a Director token."),
        )
        ReportDataThrough.objects.create(
            report=report,
            report_Data_source=self.data_source(alts_filed),
            rank=5,
            header="Alts",
            long_descriptions="All known alts on this account.",
            allow_sort=False
        )
        self.stdout.write(f"`Corporation Member Alts` report created.")
