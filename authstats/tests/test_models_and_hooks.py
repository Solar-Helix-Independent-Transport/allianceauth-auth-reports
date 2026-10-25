from types import SimpleNamespace
from unittest.mock import PropertyMock, patch

from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.test import RequestFactory

from allianceauth.authentication.models import State, UserProfile

from .. import auth_hooks
from ..models import (
    AuthReportsConfiguration, Report, ReportDataSource, ReportDataThrough,
    ReportFieldAlts, ReportFieldLastLogin, ReportResults,
)
from ..targets import target_for_results
from ..tasks import generate_report
from ..urls import urlpatterns
from . import UserTestCase

NO_ESI = patch("authstats.targets.find_unknown_character_ids",
               return_value=set())


class TestVisibleCorps(UserTestCase):
    def visible(self, user):
        return set(AuthReportsConfiguration.get_solo().visible_corps_for_user(
            type(user).objects.get(pk=user.pk)))

    def test_superuser_sees_all_candidates(self):
        self.user1.is_superuser = True
        self.user1.save()
        self.assertEqual(self.visible(self.user1),
                         {self.corp1, self.corp2, self.corp3})

    def test_own_state(self):
        self.user1.user_permissions.add(self.own_state)
        # every user is in the same state, so every corp with a main is visible
        self.assertEqual(self.visible(self.user1),
                         {self.corp1, self.corp2, self.corp3})

    def test_own_state_limited_to_own_state(self):
        other = State.objects.create(name="Other", priority=200)
        # update(): saving the profile would re-assess the state
        UserProfile.objects.filter(user=self.user3).update(state=other)
        AuthReportsConfiguration.get_solo().states_to_include.add(other)
        self.user1.user_permissions.add(self.own_state)
        self.assertNotIn(self.corp3, self.visible(self.user1))

    def test_holding_corps(self):
        conf = AuthReportsConfiguration.get_solo()
        conf.holding_corps.add(self.corp4)
        self.user1.user_permissions.add(self.holding_corps)
        self.assertEqual(self.visible(self.user1), {self.corp4})

    def test_no_main_sees_nothing(self):
        self.user4.user_permissions.add(self.own_corp)
        self.assertEqual(self.visible(self.user4), set())


class TestCandidateGroups(UserTestCase):
    def test_all_groups_without_autogroups(self):
        Group.objects.create(name="g")
        with patch("authstats.models.apps.is_installed", return_value=False):
            self.assertEqual(
                set(AuthReportsConfiguration.get_solo().candidate_groups()),
                set(Group.objects.all()))


class TestModelStrings(UserTestCase):
    def test_strings(self):
        report = Report.objects.create(name="Audit")
        alts = ReportFieldAlts.objects.create(
            name="Alts", description="All alts")
        src = ReportDataSource.objects.get(object_id=alts.id)
        field = ReportDataThrough.objects.create(
            report=report, report_Data_source=src, header="Alt list")
        self.assertEqual(str(report), "Audit")
        self.assertEqual(str(alts), "Alts: All alts")
        self.assertEqual(str(src), "Alts: All alts")
        self.assertEqual(str(field), "Alt list")

    def test_source_with_missing_filter(self):
        ct = ContentType.objects.get_for_model(ReportFieldAlts)
        src = ReportDataSource.objects.create(
            content_type=ct, object_id=999999)
        self.assertEqual(str(src), f"Error: authstats:{ct} 999999")


class TestAltsField(UserTestCase):
    def test_lists_alts_with_names_escaped(self):
        # the UI renders the message as HTML, and names are player chosen
        self.char2.character_name = "<script>alert(1)</script>"
        self.char2.corporation_name = "Corp & <b>Co</b>"
        self.char2.save()
        self.char3.alliance_name = "<img src=x onerror=alert(1)>"
        self.char3.save()
        alts = ReportFieldAlts.objects.create(
            name="Alts", description="All alts")

        out = alts.process_field(
            type(self.user1).objects.filter(pk__in=[self.user1.pk, self.user2.pk]))

        msg1 = out[self.user1.pk]["message"]
        self.assertTrue(out[self.user1.pk]["check"])
        self.assertIn("character.name1", msg1)
        self.assertIn("&lt;script&gt;alert(1)&lt;/script&gt;", msg1)
        self.assertIn("Corp &amp; &lt;b&gt;Co&lt;/b&gt;", msg1)
        self.assertNotIn("<script>", msg1)
        msg2 = out[self.user2.pk]["message"]
        self.assertIn("&lt;img src=x onerror=alert(1)&gt;", msg2)
        self.assertNotIn("<img", msg2)


class TestFilterSignals(UserTestCase):
    def test_source_follows_filter_lifecycle(self):
        alts = ReportFieldAlts.objects.create(name="a", description="a")
        self.assertTrue(ReportDataSource.objects.filter(
            object_id=alts.id).exists())
        alts.name = "b"
        alts.save()
        self.assertEqual(ReportDataSource.objects.filter(
            object_id=alts.id).count(), 1)
        alts.delete()
        self.assertFalse(ReportDataSource.objects.filter(
            object_id=alts.id).exists())

    def test_create_failure_is_logged(self):
        with patch("authstats.signals.models.ReportDataSource.objects.get_or_create",
                   side_effect=ValueError), \
                self.assertLogs("authstats.signals", "ERROR"):
            ReportFieldAlts.objects.create(name="a", description="a")

    def test_delete_without_source(self):
        alts = ReportFieldAlts.objects.create(name="a", description="a")
        ReportDataSource.objects.filter(object_id=alts.id).delete()
        alts.delete()
        self.assertFalse(ReportDataSource.objects.filter(
            object_id=alts.id).exists())

    def test_delete_failure_is_logged(self):
        alts = ReportFieldAlts.objects.create(name="a", description="a")
        with patch("authstats.signals.models.ReportDataSource.objects.filter",
                   side_effect=ValueError), \
                self.assertLogs("authstats.signals", "ERROR"):
            alts.delete()

    def test_recreated_filter_reuses_orphaned_source(self):
        # `migrate <app> zero` drops the table without pre_delete and the
        # recreated filter gets the same pk
        alts = ReportFieldAlts.objects.create(name="a", description="a")
        ReportFieldAlts.objects.filter(pk=alts.pk)._raw_delete(
            ReportFieldAlts.objects.db)
        ReportFieldAlts.objects.create(pk=alts.pk, name="a", description="a")
        self.assertEqual(ReportDataSource.objects.filter(
            object_id=alts.id).count(), 1)

    def test_report_edit_purges_cached_results(self):
        report = Report.objects.create(name="r")
        ReportResults.objects.create(
            corporation=self.corp1, report=report, results="{}")
        report.name = "renamed"
        report.save()
        self.assertFalse(ReportResults.objects.filter(report=report).exists())


class TestAuthHooks(UserTestCase):
    def render(self, user):
        request = RequestFactory().get("/")
        request.user = type(user).objects.get(pk=user.pk)
        return auth_hooks.register_menu().render(request)

    def test_menu_needs_basic_access(self):
        self.assertEqual(self.render(self.user1), "")
        self.user1.user_permissions.add(self.basic_access)
        self.assertIn("/reports/show/", self.render(self.user1))

    def test_registrations(self):
        self.assertEqual(auth_hooks.register_url().include_pattern.urlconf_module.urlpatterns,
                         urlpatterns)
        self.assertEqual(auth_hooks.filters(), [
                         ReportFieldAlts, ReportFieldLastLogin])
        self.assertEqual(auth_hooks.register_cogs(), [])


@NO_ESI
class TestRunReportFilters(UserTestCase):
    def setUp(self):
        super().setUp()
        self.report = Report.objects.create(name="r")
        alts = ReportFieldAlts.objects.create(name="a", description="a")
        self.field = ReportDataThrough.objects.create(
            report=self.report, header="f", pass_fail_aggregate=True,
            report_Data_source=ReportDataSource.objects.get(object_id=alts.id))

    def run_with(self, filter_object):
        with patch.object(ReportDataSource, "filter_object", new_callable=PropertyMock,
                          return_value=filter_object):
            return generate_report("corp", 123, self.report.id)

    def test_audit_filter_fallback(self, _esi):
        uid = self.user1.pk
        out = self.run_with(SimpleNamespace(
            audit_filter=lambda users: {uid: {"check": True, "message": "ok"}}))
        self.assertEqual(out["data"][0][f"field-{self.field.id}"],
                         {"check": True, "data": "ok"})
        self.assertEqual(out["headers"][0]["pass"], 1)

    def test_checkbox_only_hides_message(self, _esi):
        self.field.checkbox_only = True
        self.field.save()
        uid = self.user1.pk
        out = self.run_with(SimpleNamespace(
            process_field=lambda users: {uid: {"check": False, "message": "no"}}))
        self.assertEqual(out["data"][0][f"field-{self.field.id}"],
                         {"check": False, "data": ""})
        self.assertEqual(out["headers"][0]["pass"], 0)

    def test_legacy_filter_shows_no_data(self, _esi):
        # only process_filter, see the README
        with self.assertLogs("authstats.tasks", "ERROR"):
            out = self.run_with(SimpleNamespace(
                process_filter=lambda users: None))
        self.assertNotIn(f"field-{self.field.id}", out["data"][0])

    def test_broken_filter_is_logged_and_skipped(self, _esi):
        def boom(users):
            raise RuntimeError("bad filter")
        with self.assertLogs("authstats.tasks", "ERROR"):
            out = self.run_with(SimpleNamespace(process_field=boom))
        self.assertNotIn(f"field-{self.field.id}", out["data"][0])
        self.assertEqual(out["headers"][0]["pass"], 0)


class TestTargetForResults(UserTestCase):
    def test_results_without_target(self):
        with self.assertRaises(ValueError):
            target_for_results(ReportResults(report=Report(name="r")))
