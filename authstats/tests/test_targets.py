import json
from io import StringIO
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import Group, Permission, User
from django.core.management import call_command
from django.db import IntegrityError, connection, transaction
from django.db.migrations.executor import MigrationExecutor
from django.test import Client, TransactionTestCase
from django.test.utils import CaptureQueriesContext
from django.utils import timezone

from allianceauth.eveonline.models import EveCorporationInfo
from allianceauth.tests.auth_utils import AuthUtils

from ..models import (
    AuthReportsConfiguration, Report, ReportDataSource, ReportDataThrough,
    ReportFieldAlts, ReportResults,
)
from ..targets import (
    AllianceTarget, CorpTarget, GroupTarget, get_target, target_for_results,
)
from ..tasks import queue_report, run_report, run_report_for_corp
from . import UserTestCase

NO_ESI = patch("authstats.targets.find_unknown_character_ids",
               return_value=set())


@NO_ESI
class TestRunReport(UserTestCase):
    def setUp(self):
        super().setUp()
        self.report = Report.objects.create(name="Alts")
        alts = ReportFieldAlts.objects.create(name="Alts", description="Alts")
        self.field = ReportDataThrough.objects.create(
            report=self.report,
            report_Data_source=ReportDataSource.objects.get(object_id=alts.id),
            header="Alts",
            pass_fail_aggregate=True,
        )

    def test_corp_report_output(self, _esi):
        out = run_report("corp", self.corp1.corporation_id, self.report.id)
        self.assertEqual(
            out["target"], {"type": "corp", "id": 123, "name": "corporation.name1"})
        # legacy UI key carries the target label
        self.assertEqual(out["report"]["corporation"], "corporation.name1")
        self.assertEqual(out["members"], 1)
        self.assertEqual(out["data"][0]["character"], {
                         "name": "character.name1", "id": 1})
        self.assertTrue(out["data"][0][f"field-{self.field.id}"]["check"])
        self.assertEqual(out["headers"][0]["pass"], 1)

    def test_results_stored_once_per_target_report(self, _esi):
        run_report("corp", self.corp2.corporation_id, self.report.id)
        run_report("corp", self.corp2.corporation_id, self.report.id)
        rows = ReportResults.objects.filter(report=self.report)
        self.assertEqual(rows.count(), 1)
        self.assertEqual(rows.get().corporation, self.corp2)
        self.assertEqual(json.loads(rows.get().results)
                         ["target"]["type"], "corp")

    def test_legacy_task_delegates(self, _esi):
        out = run_report_for_corp(self.corp1.corporation_id, self.report.id)
        self.assertEqual(out["target"]["id"], self.corp1.corporation_id)

    def test_row_queries_do_not_scale_with_members(self, _esi):
        # first run creates the results row; measure update runs only
        run_report("corp", self.corp2.corporation_id, self.report.id)

        with CaptureQueriesContext(connection) as one:
            run_report("corp", self.corp2.corporation_id, self.report.id)

        for i in range(5):
            u = AuthUtils.create_user(f"Extra{i}")
            u.profile.main_character = self.create_char(
                100 + i, f"extra{i}", corp=self.corp2)
            u.profile.save()

        with CaptureQueriesContext(connection) as six:
            out = run_report("corp", self.corp2.corporation_id, self.report.id)
        self.assertEqual(out["members"], 6)
        self.assertEqual(len(one), len(six))


class TestTargets(UserTestCase):
    def test_get_target(self):
        t = get_target("corp", 123)
        self.assertIsInstance(t, CorpTarget)
        self.assertEqual(t.key, ("corp", 123))
        self.assertEqual(t.results_filter(), {"corporation": self.corp1})
        with self.assertRaises(KeyError):
            get_target("nope", 1)
        with self.assertRaises(EveCorporationInfo.DoesNotExist):
            get_target("corp", 999)

    def test_target_for_results(self):
        report = Report.objects.create(name="r")
        row = ReportResults.objects.create(
            corporation=self.corp1, report=report, results="{}")
        self.assertEqual(target_for_results(row).key, ("corp", 123))

    def test_queue_report_uses_target_priority(self):
        with patch("authstats.tasks.run_report.apply_async") as aa:
            queue_report(CorpTarget(self.corp1), 7)
        aa.assert_called_once_with(args=["corp", 123, 7], priority=5)

    @patch("authstats.management.commands.reports_refresh_all_reports.queue_report")
    def test_refresh_all_queues_every_result(self, q):
        report = Report.objects.create(name="r")
        ReportResults.objects.create(
            corporation=self.corp1, report=report, results="{}")
        ReportResults.objects.create(
            corporation=self.corp2, report=report, results="{}")
        call_command("reports_refresh_all_reports", stdout=StringIO())
        self.assertEqual(
            sorted(c.args[0].target_id for c in q.call_args_list), [2, 123])


class TestResultsConstraints(UserTestCase):
    def setUp(self):
        super().setUp()
        self.report = Report.objects.create(name="r")

    def test_needs_a_target(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            ReportResults.objects.create(report=self.report, results="{}")

    def test_only_one_target(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            ReportResults.objects.create(
                report=self.report, corporation=self.corp1, alliance=self.alli1, results="{}")

    def test_one_result_per_target_report(self):
        ReportResults.objects.create(
            report=self.report, corporation=self.corp1, results="{}")
        with self.assertRaises(IntegrityError), transaction.atomic():
            ReportResults.objects.create(
                report=self.report, corporation=self.corp1, results="{}")

    def test_group_target_allowed(self):
        g = Group.objects.create(name="g")
        ReportResults.objects.create(report=self.report, group=g, results="{}")


class TestVisibleTargets(UserTestCase):
    def test_global_reports_sees_all_corps(self):
        global_reports = self.own_corp.__class__.objects.get_by_natural_key(
            'global_reports', 'authstats', 'authreportsconfiguration')
        self.user1.user_permissions.add(global_reports)
        self.user1 = type(self.user1).objects.get(pk=self.user1.pk)
        cs = AuthReportsConfiguration.get_solo().visible_targets(self.user1, "corp")
        for c in (self.corp1, self.corp2, self.corp3):
            self.assertIn(c, cs)

    def test_unknown_type(self):
        with self.assertRaises(ValueError):
            AuthReportsConfiguration.get_solo().visible_targets(self.user1, "nope")

    def test_is_visible_to(self):
        self.user1.user_permissions.add(self.own_corp)
        self.user1 = type(self.user1).objects.get(pk=self.user1.pk)
        self.assertTrue(CorpTarget(self.corp1).is_visible_to(self.user1))
        self.assertFalse(CorpTarget(self.corp2).is_visible_to(self.user1))


@patch("authstats.api.queue_report")
class TestLegacyReportEndpoint(UserTestCase):
    def setUp(self):
        super().setUp()
        self.report = Report.objects.create(name="r")
        self.user1.user_permissions.add(self.own_corp, self.basic_access)
        self.client = Client()
        self.client.force_login(self.user1)

    def url(self, corp_id):
        return f"/reports/api/get_report/{self.report.id}/{corp_id}"

    def test_invisible_corp_denied(self, q):
        self.assertEqual(self.client.get(self.url(2)).status_code, 403)
        self.assertEqual(self.client.get(self.url(999)).status_code, 403)
        q.assert_not_called()

    def test_missing_results_queue_a_run(self, q):
        r = self.client.get(self.url(123))
        self.assertEqual(r.status_code, 200)
        self.assertFalse(r.json()["data"])
        self.assertEqual(r.json()["target"]["id"], 123)
        self.assertEqual(q.call_args.args[0].key, ("corp", 123))

    def test_fresh_results_served_without_queue(self, q):
        ReportResults.objects.create(
            corporation=self.corp1, report=self.report, results='{"cached": true}')
        r = self.client.get(self.url(123))
        self.assertEqual(r.json(), {"cached": True})
        q.assert_not_called()

    def test_stale_results_queue_a_run(self, q):
        row = ReportResults.objects.create(
            corporation=self.corp1, report=self.report, results='{"cached": true}')
        ReportResults.objects.filter(pk=row.pk).update(
            last_update=timezone.now() - timezone.timedelta(hours=2))
        self.assertEqual(self.client.get(
            self.url(123)).json(), {"cached": True})
        q.assert_called_once()

    def test_restricted_report_denied(self, q):
        self.report.restricted = True
        self.report.save()
        self.assertEqual(self.client.get(self.url(123)).status_code, 403)


class TestDedupeMigration(TransactionTestCase):
    before = [("authstats", "0009_reportresults_targets")]
    after = [("authstats", "0011_reportresults_constraints")]

    def test_keeps_newest_duplicate(self):
        executor = MigrationExecutor(connection)
        executor.migrate(self.before)
        apps = executor.loader.project_state(self.before).apps
        Corp = apps.get_model("eveonline", "EveCorporationInfo")
        Report_ = apps.get_model("authstats", "Report")
        Results = apps.get_model("authstats", "ReportResults")

        corp = Corp.objects.create(corporation_id=1, corporation_name="c",
                                   corporation_ticker="C", member_count=1)
        report = Report_.objects.create(name="r")
        old = Results.objects.create(
            corporation=corp, report=report, results="old")
        new = Results.objects.create(
            corporation=corp, report=report, results="new")
        Results.objects.filter(pk=old.pk).update(
            last_update=timezone.now() - timezone.timedelta(days=1))

        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate(self.after)
        apps = executor.loader.project_state(self.after).apps
        Results = apps.get_model("authstats", "ReportResults")
        self.assertEqual(
            list(Results.objects.values_list("pk", flat=True)), [new.pk])


class TargetFixtures(UserTestCase):
    """
        alli1 (3): corp2 - user2 main char3; user4 (no main) owns char9, char10
        alli2 (4): corp3 - user3 main char5; corp4 - user3 alt char7
        corp1 (no alliance): user1 main char1
    """

    def setUp(self):
        super().setUp()
        self.own_groups = Permission.objects.get_by_natural_key(
            'own_groups', 'authstats', 'authreportsconfiguration')
        self.global_reports = Permission.objects.get_by_natural_key(
            'global_reports', 'authstats', 'authreportsconfiguration')
        self.group = Group.objects.create(name="Capital Pilots")
        self.other_group = Group.objects.create(name="Directors")
        self.user1.groups.add(self.group)
        self.user4.groups.add(self.group)

    def reload(self, user):
        return User.objects.get(pk=user.pk)


class TestAllianceTarget(TargetFixtures):
    def test_mains_are_users_with_main_in_alliance(self):
        self.assertEqual(
            list(AllianceTarget(self.alli1).mains()), [self.user2])
        self.assertEqual(
            list(AllianceTarget(self.alli2).mains()), [self.user3])

    @patch("authstats.targets.find_unknown_character_ids", return_value={900, 901})
    @patch("authstats.targets.get_membership_tokens")
    def test_extras(self, tokens, _unknowns):
        tokens.side_effect = lambda corp_id: MagicMock(
            exists=lambda: corp_id in (2, 3))
        # alli1: 2 ESI unknowns + char9/char10 whose owner has no main
        self.assertEqual(AllianceTarget(self.alli1).extras(),
                         {"unknowns": 4, "corps_without_token": 0})
        # alli2: char7 is user3's alt in a sibling corp, not an orphan
        self.assertEqual(AllianceTarget(self.alli2).extras(),
                         {"unknowns": 2, "corps_without_token": 1})

    @NO_ESI
    def test_run_report_stores_alliance_result(self, _esi):
        report = Report.objects.create(name="r")
        out = run_report("alliance", 3, report.id)
        self.assertEqual(
            out["target"], {"type": "alliance", "id": 3, "name": "alliance.names1"})
        self.assertEqual(out["members"], 1)
        self.assertEqual(ReportResults.objects.get(
            report=report).alliance, self.alli1)

    def test_priority_lower_than_corp(self):
        with patch("authstats.tasks.run_report.apply_async") as aa:
            queue_report(AllianceTarget(self.alli1), 1)
        aa.assert_called_once_with(args=["alliance", 3, 1], priority=7)

    def test_visible_with_own_alliance(self):
        self.user2.user_permissions.add(self.own_alliance)
        visible = AuthReportsConfiguration.get_solo().visible_targets(
            self.reload(self.user2), "alliance")
        self.assertEqual(list(visible), [self.alli1])

    def test_own_alliance_without_alliance_sees_none(self):
        self.user1.user_permissions.add(self.own_alliance)
        visible = AuthReportsConfiguration.get_solo().visible_targets(
            self.reload(self.user1), "alliance")
        self.assertFalse(visible.exists())

    def test_no_perm_sees_none(self):
        self.user2.user_permissions.add(self.own_corp)
        visible = AuthReportsConfiguration.get_solo().visible_targets(
            self.reload(self.user2), "alliance")
        self.assertFalse(visible.exists())

    def test_global_sees_alliances_of_candidate_corps(self):
        self.user1.user_permissions.add(self.global_reports)
        visible = AuthReportsConfiguration.get_solo().visible_targets(
            self.reload(self.user1), "alliance")
        self.assertEqual(set(visible), {self.alli1, self.alli2})


class TestGroupTarget(TargetFixtures):
    def test_mains_exclude_members_without_main(self):
        self.assertEqual(list(GroupTarget(self.group).mains()), [self.user1])
        self.assertEqual(GroupTarget(self.group).extras(),
                         {"members_without_main": 1})

    @NO_ESI
    def test_run_report_stores_group_result(self, _esi):
        report = Report.objects.create(name="r")
        out = run_report("group", self.group.pk, report.id)
        self.assertEqual(out["target"]["name"], "Capital Pilots")
        self.assertEqual(out["members_without_main"], 1)
        self.assertEqual(ReportResults.objects.get(
            report=report).group, self.group)
        self.assertEqual(target_for_results(ReportResults.objects.get(report=report)).key,
                         ("group", self.group.pk))

    def test_leader_with_own_groups_sees_led_groups(self):
        self.group.authgroup.group_leaders.add(self.user2)
        self.user2.user_permissions.add(self.own_groups)
        visible = AuthReportsConfiguration.get_solo().visible_targets(
            self.reload(self.user2), "group")
        self.assertEqual(list(visible), [self.group])

    def test_leader_via_leader_group(self):
        leaders = Group.objects.create(name="Leaders")
        self.user2.groups.add(leaders)
        self.group.authgroup.group_leader_groups.add(leaders)
        self.other_group.authgroup.group_leader_groups.add(leaders)
        self.group.authgroup.group_leaders.add(
            self.user2)  # both ways, no dupes
        self.user2.user_permissions.add(self.own_groups)
        visible = AuthReportsConfiguration.get_solo().visible_targets(
            self.reload(self.user2), "group")
        self.assertEqual(sorted(g.pk for g in visible), sorted(
            [self.group.pk, self.other_group.pk]))

    def test_leader_without_perm_sees_none(self):
        self.group.authgroup.group_leaders.add(self.user2)
        visible = AuthReportsConfiguration.get_solo().visible_targets(
            self.reload(self.user2), "group")
        self.assertFalse(visible.exists())

    def test_perm_without_leadership_sees_none(self):
        self.user2.user_permissions.add(self.own_groups)
        visible = AuthReportsConfiguration.get_solo().visible_targets(
            self.reload(self.user2), "group")
        self.assertFalse(visible.exists())

    def test_global_sees_all_groups(self):
        self.user1.user_permissions.add(self.global_reports)
        visible = AuthReportsConfiguration.get_solo().visible_targets(
            self.reload(self.user1), "group")
        self.assertTrue({self.group, self.other_group} <= set(visible))
