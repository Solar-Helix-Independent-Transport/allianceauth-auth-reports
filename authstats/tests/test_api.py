from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import Group, Permission, User
from django.test import Client
from django.urls import resolve, reverse

from allianceauth.authentication.models import CharacterOwnership

from ..api import chunk_ids
from ..models import Report, ReportResults
from . import UserTestCase

NO_ESI = patch("authstats.targets.find_unknown_character_ids",
               return_value=set())


@NO_ESI
@patch("authstats.api.queue_report")
class TestTargetApi(UserTestCase):
    def setUp(self):
        super().setUp()
        self.own_groups = Permission.objects.get_by_natural_key(
            'own_groups', 'authstats', 'authreportsconfiguration')
        self.group = Group.objects.create(name="Capital Pilots")
        self.group.authgroup.group_leaders.add(self.user2)
        self.user2.user_permissions.add(
            self.basic_access, self.own_corp, self.own_alliance, self.own_groups)
        self.report = Report.objects.create(name="r", show_for_groups=True)
        self.restricted = Report.objects.create(
            name="secret", restricted=True, show_for_groups=True)
        self.client = Client()
        self.client.force_login(self.user2)

    def get(self, path):
        return self.client.get(f"/reports/api{path}")

    def test_targets_lists_each_visible_type(self, q, _esi):
        r = self.get("/targets")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json(), [
            {"type": "alliance", "id": 3, "name": "alliance.names1",
                "ticker": "TEST", "parent": None},
            {"type": "corp", "id": 2, "name": "corporation.name2", "ticker": "DEF",
             "parent": {"type": "alliance", "id": 3, "name": "alliance.names1", "ticker": "TEST"}},
            {"type": "group", "id": self.group.pk,
                "name": "Capital Pilots", "ticker": None, "parent": None},
        ])

    def test_targets_needs_basic_access(self, q, _esi):
        self.client.force_login(self.user1)
        self.assertEqual(self.get("/targets").status_code, 403)

    def test_reports_hide_restricted(self, q, _esi):
        r = self.get("/reports?target_type=group")
        self.assertEqual([x["name"] for x in r.json()], ["r"])

    def test_report_for_each_visible_type_queues_run(self, q, _esi):
        for t, i in (("corp", 2), ("alliance", 3), ("group", self.group.pk)):
            r = self.get(f"/report/{t}/{i}/{self.report.id}")
            self.assertEqual(r.status_code, 200, t)
            self.assertEqual(r.json()["target"]["type"], t)
            self.assertEqual(q.call_args.args[0].key, (t, i))

    def test_report_serves_cached_results(self, q, _esi):
        ReportResults.objects.create(
            group=self.group, report=self.report, results='{"cached": 1}')
        self.assertEqual(self.get(
            f"/report/group/{self.group.pk}/{self.report.id}").json(), {"cached": 1})
        q.assert_not_called()

    def test_report_denied_for_invisible_or_unknown_targets(self, q, _esi):
        other = Group.objects.create(name="Directors")
        for path in ("/report/corp/123/", "/report/alliance/4/", f"/report/group/{other.pk}/",
                     "/report/nope/1/", "/report/corp/999/"):
            self.assertEqual(
                self.get(f"{path}{self.report.id}").status_code, 403, path)
        q.assert_not_called()

    def test_restricted_report_not_found(self, q, _esi):
        self.assertEqual(
            self.get(f"/report/corp/2/{self.restricted.id}").status_code, 404)

    def test_unknowns_group_404(self, q, _esi):
        self.assertEqual(
            self.get(f"/unknowns/group/{self.group.pk}").status_code, 404)

    def test_unknowns_alliance(self, q, _esi):
        r = self.get("/unknowns/alliance/3").json()
        self.assertEqual(r["missing"]["corporation"], "alliance.names1")
        self.assertEqual(r["missing"]["members"], 1)
        self.assertEqual(r["corps_without_token"], 1)
        # char9/char10 belong to user4 who has no main, so they can't be listed with a main
        self.assertEqual(r["orphans"]["data"], [])

    def test_legacy_unknowns_unchanged_shape(self, q, _esi):
        legacy = self.get("/get_unknowns/2").json()
        new = self.get("/unknowns/corp/2").json()
        self.assertEqual(legacy, new)
        self.assertEqual(set(legacy), {"missing", "orphans"})


class TestRoutes(UserTestCase):
    def test_target_and_legacy_routes(self):
        self.assertEqual(reverse("authstats:target_report", kwargs={"target_type": "alliance", "tid": 3, "rid": 1}),
                         "/reports/show/alliance/3/1/")
        self.assertEqual(resolve("/reports/show/2/1/").url_name, "report")
        self.assertEqual(
            resolve("/reports/show/group/2/1/").url_name, "target_report")


def esi_names(*names):
    esi = MagicMock()
    esi.client.Universe.PostUniverseNames.return_value.result.return_value = [
        SimpleNamespace(id=i, name=n) for i, n in names]
    return esi


@patch("authstats.api.queue_report")
class TestEndpointAccess(UserTestCase):
    def setUp(self):
        super().setUp()
        self.client = Client()
        self.client.force_login(self.user1)
        self.report = Report.objects.create(name="corps")
        self.groups = Report.objects.create(
            name="groups", show_for_corps=False, show_for_groups=True)
        self.restricted = Report.objects.create(name="secret", restricted=True)

    def get(self, path):
        return self.client.get(f"/reports/api{path}")

    def grant(self, *perms):
        self.user1.user_permissions.add(*perms)

    def names(self, r):
        return sorted(x["name"] for x in r.json())

    def test_basic_access_required(self, q):
        for path in ["/reports", "/get_reports", f"/unknowns/corp/123",
                     "/overview", f"/report/corp/123/{self.report.id}"]:
            self.assertEqual(self.get(path).status_code, 403, path)

    def test_reports_filtered_by_type(self, q):
        self.grant(self.basic_access)
        self.assertEqual(self.names(self.get("/reports")), ["corps", "groups"])
        self.assertEqual(self.names(
            self.get("/reports?target_type=corp")), ["corps"])
        self.assertEqual(self.names(
            self.get("/reports?target_type=group")), ["groups"])
        # unknown types are not filtered
        self.assertEqual(self.names(
            self.get("/reports?target_type=nope")), ["corps", "groups"])

    def test_restricted_reports_need_perm(self, q):
        self.grant(self.basic_access, self.restricted_reports)
        self.assertEqual(self.names(self.get("/reports?target_type=corp")),
                         ["corps", "secret"])

    def test_legacy_reports_are_corp_reports(self, q):
        self.grant(self.basic_access)
        self.assertEqual(self.names(self.get("/get_reports")), ["corps"])

    def test_legacy_corps(self, q):
        self.assertEqual(self.get("/get_corps").json(), [])
        self.grant(self.own_corp)
        self.assertEqual(self.get("/get_corps").json(), [{
            "corporation_id": 123, "corporation_name": "corporation.name1",
            "alliance_id": None, "alliance_name": None}])

    def test_unknowns_invisible_or_unknown_target(self, q):
        self.grant(self.basic_access, self.own_corp)
        for path in ["/unknowns/corp/2", "/unknowns/corp/999", "/unknowns/nope/1"]:
            self.assertEqual(self.get(path).status_code, 403, path)

    def test_legacy_unknowns_invisible_corp(self, q):
        self.grant(self.own_corp)
        self.assertEqual(self.get("/get_unknowns/2").status_code, 403)

    @patch("authstats.targets.find_unknown_character_ids", return_value={90, 91})
    def test_unknowns_names_from_esi(self, _unknowns, q):
        self.grant(self.basic_access, self.own_corp)
        with patch("authstats.api.providers.esi", esi_names((90, "Ninety"), (91, "NinetyOne"))):
            r = self.get("/unknowns/corp/123").json()
        self.assertEqual(r["missing"]["data"], [
            {"character": {"id": 90, "name": "Ninety"}},
            {"character": {"id": 91, "name": "NinetyOne"}},
        ])
        self.assertEqual(r["missing"]["members"], 1)

    @patch("authstats.targets.find_unknown_character_ids", return_value={90})
    def test_unknowns_esi_error_still_answers(self, _unknowns, q):
        self.grant(self.basic_access, self.own_corp)
        esi = MagicMock()
        esi.client.Universe.PostUniverseNames.side_effect = OSError("down")
        with patch("authstats.api.providers.esi", esi), \
                self.assertLogs("authstats.api", "ERROR"):
            r = self.get("/unknowns/corp/123")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["missing"]["data"], [])

    @patch("authstats.targets.find_unknown_character_ids", return_value=set())
    def test_orphans_listed_with_their_main(self, _unknowns, q):
        # user2's alt in corp1: an orphan of corp1 whose main is in corp2
        alt = self.create_char(60, "alt.char", corp=self.corp1)
        CharacterOwnership.objects.create(
            user=self.user2, character=alt, owner_hash="alt60")
        self.grant(self.basic_access, self.own_corp)
        r = self.get("/unknowns/corp/123").json()
        self.assertEqual(r["orphans"]["data"], [{
            "character": {"id": 60, "name": "alt.char"},
            "main": {"id": 3, "name": "character.name3",
                     "cid": 2, "cname": "corporation.name2"},
        }])

    def test_chunk_ids(self, q):
        self.assertEqual(list(chunk_ids(list(range(5)), 2)),
                         [[0, 1], [2, 3], [4]])
        self.assertEqual(list(chunk_ids([])), [])
