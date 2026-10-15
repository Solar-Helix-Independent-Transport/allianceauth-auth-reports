import json
from unittest.mock import patch

from django.contrib.auth.models import Group, Permission
from django.test import Client
from django.urls import reverse
from django.utils import timezone

from ..models import (
    Report, ReportDataSource, ReportDataThrough, ReportFieldAlts,
    ReportResults,
)
from . import UserTestCase


def results_blob(members, field_checks):
    """field_checks: list of per-member dicts {field: bool}"""
    headers = {}
    for row in field_checks:
        for f, ok in row.items():
            headers.setdefault(f, 0)
            headers[f] += 1 if ok else 0
    return json.dumps({
        "members": members, "unknowns": 2, "updated": "2026-10-15T00:00:00Z",
        "headers": [{"field": f, "pass": p} for f, p in headers.items()],
        "data": [{"character": {}, **{f: {"check": ok} for f, ok in row.items()}}
                 for row in field_checks],
    })


class TestReportFlags(UserTestCase):
    def test_defaults(self):
        r = Report.objects.create(name="r")
        self.assertEqual((r.show_for_corps, r.show_for_groups, r.show_in_global),
                         (True, False, False))
        self.assertEqual(r.enabled_target_types(), ["corp", "alliance"])

    def test_for_target_type(self):
        corps = Report.objects.create(name="corps")
        groups = Report.objects.create(
            name="groups", show_for_corps=False, show_for_groups=True)
        self.assertEqual(list(Report.for_target_type("alliance")), [corps])
        self.assertEqual(list(Report.for_target_type("group")), [groups])


@patch("authstats.api.queue_report")
class TestOverviewApi(UserTestCase):
    def setUp(self):
        super().setUp()
        self.global_reports = Permission.objects.get_by_natural_key(
            'global_reports', 'authstats', 'authreportsconfiguration')
        self.user1.user_permissions.add(self.basic_access, self.global_reports)
        self.group = Group.objects.create(name="Capital Pilots")

        self.report = Report.objects.create(
            name="Audit", show_for_groups=True, show_in_global=True)
        alts = ReportFieldAlts.objects.create(name="a", description="a")
        src = ReportDataSource.objects.get(object_id=alts.id)
        self.f1 = ReportDataThrough.objects.create(
            report=self.report, report_Data_source=src, header="Token",
            pass_fail_aggregate=True, rank=1)
        self.f2 = ReportDataThrough.objects.create(
            report=self.report, report_Data_source=src, header="Discord",
            pass_fail_aggregate=True, rank=2)
        self.info = ReportDataThrough.objects.create(
            report=self.report, report_Data_source=src, header="Alts", rank=3)
        self.k1, self.k2 = f"field-{self.f1.id}", f"field-{self.f2.id}"

        self.client = Client()
        self.client.force_login(self.user1)

    def get(self, path):
        return self.client.get(f"/reports/api{path}")

    def row(self, body, t, i):
        return next(r for r in body["rows"] if r["target"]["type"] == t and r["target"]["id"] == i)

    def test_overview_report_list(self, q):
        Report.objects.create(name="not global")
        self.assertEqual([r["name"]
                         for r in self.get("/overview").json()], ["Audit"])

    def test_rows_fields_and_all_pass(self, q):
        ReportResults.objects.create(corporation=self.corp1, report=self.report, results=results_blob(3, [
            {self.k1: True, self.k2: True},
            {self.k1: True, self.k2: False},
            {self.k1: False, self.k2: False},
        ]))
        body = self.get(f"/overview/{self.report.id}").json()
        self.assertEqual([f["header"]
                         for f in body["fields"]], ["Token", "Discord"])
        self.assertEqual(body["target_types"], ["corp", "alliance", "group"])
        r = self.row(body, "corp", 123)
        self.assertEqual(r["members"], 3)
        self.assertEqual(r["unknowns"], 2)
        self.assertEqual(r["fields"], {self.k1: 2, self.k2: 1})
        self.assertEqual(r["all_pass"], 1)
        # fresh row is not re-queued, never-run rows are
        queued = {c.args[0].key for c in q.call_args_list}
        self.assertNotIn(("corp", 123), queued)
        self.assertIn(("group", self.group.pk), queued)
        self.assertIsNone(self.row(body, "group", self.group.pk)["members"])

    def test_stale_rows_queue(self, q):
        rr = ReportResults.objects.create(corporation=self.corp1, report=self.report,
                                          results=results_blob(1, [{self.k1: True, self.k2: True}]))
        ReportResults.objects.filter(pk=rr.pk).update(
            last_update=timezone.now() - timezone.timedelta(hours=2))
        self.get(f"/overview/{self.report.id}?target_type=corp")
        self.assertIn(("corp", 123), {c.args[0].key for c in q.call_args_list})

    def test_group_unknowns_are_null(self, q):
        ReportResults.objects.create(group=self.group, report=self.report,
                                     results=results_blob(1, [{self.k1: True, self.k2: True}]))
        r = self.row(self.get(f"/overview/{self.report.id}?target_type=group").json(),
                     "group", self.group.pk)
        self.assertIsNone(r["unknowns"])
        self.assertEqual(r["all_pass"], 1)

    def test_type_filter_and_disabled_types(self, q):
        self.report.show_for_groups = False
        self.report.save()
        body = self.get(f"/overview/{self.report.id}").json()
        self.assertEqual({r["target"]["type"]
                         for r in body["rows"]}, {"corp", "alliance"})
        body = self.get(
            f"/overview/{self.report.id}?target_type=alliance").json()
        self.assertEqual({r["target"]["type"]
                         for r in body["rows"]}, {"alliance"})

    def test_rows_limited_to_visible_targets(self, q):
        self.user2.user_permissions.add(self.basic_access, self.own_corp)
        self.client.force_login(self.user2)
        body = self.get(f"/overview/{self.report.id}").json()
        self.assertEqual([r["target"] for r in body["rows"]],
                         [{"type": "corp", "id": 2, "name": "corporation.name2"}])

    def test_not_global_or_restricted_404(self, q):
        plain = Report.objects.create(name="plain")
        self.assertEqual(self.get(f"/overview/{plain.id}").status_code, 404)
        self.report.restricted = True
        self.report.save()
        self.assertEqual(
            self.get(f"/overview/{self.report.id}").status_code, 404)

    def test_needs_basic_access(self, q):
        self.client.force_login(self.user3)
        self.assertEqual(self.get("/overview").status_code, 403)
        self.assertEqual(
            self.get(f"/overview/{self.report.id}").status_code, 403)

    def test_report_endpoint_respects_flags(self, q):
        corp_only = Report.objects.create(name="corp only")
        self.assertEqual(
            self.get(f"/report/group/{self.group.pk}/{corp_only.id}").status_code, 404)
        self.assertEqual(
            self.get(f"/report/corp/123/{corp_only.id}").status_code, 200)
        names = [r["name"]
                 for r in self.get("/reports?target_type=group").json()]
        self.assertEqual(names, ["Audit"])

    def test_legacy_reports_only_corp_enabled(self, q):
        Report.objects.create(name="groups only",
                              show_for_corps=False, show_for_groups=True)
        self.assertNotIn("groups only", [r["name"]
                         for r in self.get("/get_reports").json()])

    def test_routes(self, q):
        self.assertEqual(reverse("authstats:overview"), "/reports/overview/")
        self.assertEqual(reverse("authstats:overview_report",
                         kwargs={"rid": 4}), "/reports/overview/4/")
