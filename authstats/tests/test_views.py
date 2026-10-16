from unittest.mock import MagicMock

from django.test import Client, RequestFactory, override_settings
from django.urls import reverse

from allianceauth.eveonline.models import EveCorporationInfo

from .. import views
from ..models import Report
from . import UserTestCase


class TestReactViews(UserTestCase):
    def setUp(self):
        super().setUp()
        self.client = Client()

    def test_main_needs_basic_access(self):
        self.client.force_login(self.user1)
        r = self.client.get(reverse("authstats:overview"))
        self.assertEqual(r.status_code, 302)
        self.assertIn("login", r.url)

    @override_settings(STORAGES={
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    })
    def test_main_renders_with_basic_access(self):
        self.user1.user_permissions.add(self.basic_access)
        self.client.force_login(self.user1)
        r = self.client.get(reverse("authstats:overview"))
        self.assertEqual(r.status_code, 200)
        self.assertTemplateUsed(r, "authstats/react_base_bs5.html")
        self.assertEqual(r.context["app_name"], "authstats")

    def test_redirect_to_first_report_for_main_corp(self):
        report = Report.objects.create(name="r")
        Report.objects.create(name="r2")
        self.user1.user_permissions.add(self.basic_access)
        self.client.force_login(self.user1)
        r = self.client.get(reverse("authstats:base"))
        self.assertRedirects(
            r, reverse("authstats:report", kwargs={
                       "rid": report.id, "cid": 123}),
            fetch_redirect_response=False)

    def test_redirect_without_reports(self):
        self.user1.user_permissions.add(self.basic_access)
        self.client.force_login(self.user1)
        r = self.client.get(reverse("authstats:base"))
        self.assertRedirects(
            r, reverse("authstats:report", kwargs={"rid": 0, "cid": 123}),
            fetch_redirect_response=False)

    def test_users_without_main_never_reach_views(self):
        # AA's url hook wraps every view in main_character_required
        self.user4.user_permissions.add(self.basic_access)
        self.client.force_login(self.user4)
        r = self.client.get(reverse("authstats:base"))
        self.assertRedirects(r, reverse("authentication:dashboard"),
                             fetch_redirect_response=False)


class TestAddCorp(UserTestCase):
    # skip login_required and token_required, the view gets the token handed in
    view = staticmethod(views.add_corp.__wrapped__.__wrapped__)

    def request(self):
        request = RequestFactory().get("/reports/add_corp_token/")
        request.user = self.user1
        return request

    def test_creates_missing_corp(self):
        char = self.create_char(50, "new.char", corp=EveCorporationInfo(
            corporation_id=777, corporation_name="New Corp",
            corporation_ticker="NEW"))
        r = self.view(self.request(), MagicMock(
            character_id=char.character_id))
        self.assertEqual(r.status_code, 302)
        self.assertEqual(r.url, reverse("authstats:base"))
        corp = EveCorporationInfo.objects.get(corporation_id=777)
        self.assertEqual(corp.corporation_name, "New Corp")
        self.assertEqual(corp.corporation_ticker, "NEW")
        self.assertEqual(corp.member_count, 0)

    def test_existing_corp_untouched(self):
        self.view(self.request(), MagicMock(character_id=1))
        corp = EveCorporationInfo.objects.get(corporation_id=123)
        self.assertEqual(corp.member_count, 1)
