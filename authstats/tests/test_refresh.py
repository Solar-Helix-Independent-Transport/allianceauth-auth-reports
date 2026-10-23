from io import StringIO
from unittest.mock import patch

from django.contrib.auth.models import Group
from django.core.management import CommandError, call_command
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase

from allianceauth.eveonline.autogroups.models import (
    AutogroupsConfig, ManagedAllianceGroup, ManagedCorpGroup,
)

from ..models import (
    Report, ReportDataSource, ReportDataThrough, ReportFieldAlts,
)
from ..tasks import refresh_overview_reports
from . import UserTestCase


@patch("authstats.tasks.queue_report")
class TestRefreshOverviewReports(UserTestCase):
    def setUp(self):
        super().setUp()
        self.group = Group.objects.create(name="Capital Pilots")

    def queued(self, q):
        return {(c.args[0].key, c.args[1]) for c in q.call_args_list}

    def test_only_global_reports_and_enabled_types(self, q):
        corps = Report.objects.create(name="corps", show_in_global=True)
        groups = Report.objects.create(name="groups", show_in_global=True,
                                       show_for_corps=False, show_for_groups=True)
        Report.objects.create(name="not global", show_for_groups=True)

        refresh_overview_reports()

        # candidate corps are the corps of mains (corp1-3) plus holding corps (none)
        self.assertEqual(self.queued(q), {
            (("corp", 123), corps.id), (("corp", 2),
                                        corps.id), (("corp", 3), corps.id),
            (("alliance", 3), corps.id), (("alliance", 4), corps.id),
            (("group", self.group.pk), groups.id),
        })

    def test_skips_autogroups_corp_and_alliance_groups(self, q):
        config = AutogroupsConfig.objects.create()
        corp_group = Group.objects.create(name="Corp ABC")
        alli_group = Group.objects.create(name="Alliance TEST")
        ManagedCorpGroup.objects.create(
            group=corp_group, config=config, corp=self.corp1)
        ManagedAllianceGroup.objects.create(
            group=alli_group, config=config, alliance=self.alli1)
        groups = Report.objects.create(name="groups", show_in_global=True,
                                       show_for_corps=False, show_for_groups=True)

        refresh_overview_reports()

        self.assertEqual(self.queued(
            q), {(("group", self.group.pk), groups.id)})

    def test_nothing_without_global_reports(self, q):
        Report.objects.create(name="plain")
        refresh_overview_reports()
        q.assert_not_called()


@patch("authstats.management.commands.reports_run_report.generate_report", return_value={})
class TestRunReportCommand(UserTestCase):
    def run_cmd(self, *args):
        call_command("reports_run_report", *args, stdout=StringIO())

    def test_target_args(self, run):
        self.run_cmd("--report", "1", "--target_type",
                     "group", "--target_id", "5")
        run.assert_called_once_with("group", 5, 1)

    def test_target_type_defaults_to_corp(self, run):
        self.run_cmd("--report", "1", "--target_id", "123")
        run.assert_called_once_with("corp", 123, 1)

    def test_corp_id_alias(self, run):
        self.run_cmd("--report", "1", "--corp_id", "123")
        run.assert_called_once_with("corp", 123, 1)

    def test_bad_args(self, run):
        with self.assertRaises(CommandError):
            self.run_cmd("--report", "1")
        with self.assertRaises(CommandError):
            self.run_cmd("--report", "1", "--corp_id", "1", "--target_id", "2")
        with self.assertRaises(CommandError):
            self.run_cmd("--report", "1", "--target_type",
                         "nope", "--target_id", "2")
        run.assert_not_called()


class TestBootstrapReportCommand(UserTestCase):
    def test_creates_alts_report(self):
        call_command("reports_bootstrap_report", stdout=StringIO())
        report = Report.objects.get(name="Corporation Member Alts")
        field = ReportDataThrough.objects.get(report=report)
        self.assertEqual(field.header, "Alts")
        self.assertFalse(field.allow_sort)
        self.assertIsInstance(
            field.report_Data_source.filter_object, ReportFieldAlts)


class TestSyncFiltersCommand(UserTestCase):
    def test_recreates_missing_sources_once(self):
        kept = ReportFieldAlts.objects.create(name="kept", description="k")
        lost = ReportFieldAlts.objects.create(name="lost", description="l")
        ReportDataSource.objects.filter(object_id=lost.id).delete()

        call_command("reports_sync_filters", stdout=StringIO())

        for f in (kept, lost):
            self.assertEqual(
                ReportDataSource.objects.filter(object_id=f.id).count(), 1)


class TestDedupeDataSourceMigration(TransactionTestCase):
    before = [("authstats", "0012_default_member_state")]
    after = [("authstats", "0013_dedupe_reportdatasource")]

    def migrate(self, target):
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate(target)
        return executor.loader.project_state(target).apps

    def test_dupes_merged_into_oldest(self):
        apps = self.migrate(self.before)
        ct = apps.get_model("contenttypes", "ContentType").objects.get(
            app_label="authstats", model="reportfieldalts")
        Source = apps.get_model("authstats", "ReportDataSource")
        keep, dupe = (Source.objects.create(content_type=ct, object_id=1)
                      for _ in range(2))
        other = Source.objects.create(content_type=ct, object_id=2)
        report = apps.get_model("authstats", "Report").objects.create(name="r")
        Through = apps.get_model("authstats", "ReportDataThrough")
        Through.objects.create(
            report=report, report_Data_source=dupe, header="h")

        apps = self.migrate(self.after)
        Source = apps.get_model("authstats", "ReportDataSource")
        self.assertEqual(
            sorted(Source.objects.values_list("id", flat=True)),
            [keep.id, other.id])
        self.assertEqual(
            apps.get_model("authstats", "ReportDataThrough").objects.get(
                header="h").report_Data_source_id, keep.id)
