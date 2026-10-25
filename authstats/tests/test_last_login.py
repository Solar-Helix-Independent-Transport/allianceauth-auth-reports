from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import RequestFactory
from django.urls import reverse
from django.utils import timezone

from .. import views
from ..models import MemberLogin, ReportFieldLastLogin
from ..utils import (
    LOGIN_REFRESH_SECONDS, get_director_token, login_refresh_key,
    refresh_member_logins,
)
from . import UserTestCase


def esi_roles(*roles_per_call):
    esi = MagicMock()
    esi.client.Character.GetCharactersCharacterIdRoles.return_value.result.side_effect = [
        r if isinstance(r, Exception) else SimpleNamespace(roles=r)
        for r in roles_per_call
    ]
    return esi


def esi_tracking(*members):
    esi = MagicMock()
    esi.client.Corporation.GetCorporationsCorporationIdMembertracking.return_value.result.return_value = [
        SimpleNamespace(character_id=c, logon_date=on, logoff_date=None)
        for c, on in members
    ]
    return esi


@patch("authstats.utils.get_corp_tokens")
class TestDirectorToken(UserTestCase):
    def test_first_director_wins(self, tokens):
        tokens.return_value = [MagicMock(character_id=1),
                               MagicMock(character_id=2)]
        with patch("authstats.utils.providers.esi", esi_roles(["Accountant"], ["Director"])):
            self.assertIs(get_director_token(123), tokens.return_value[1])

    def test_failing_token_skipped(self, tokens):
        tokens.return_value = [MagicMock(character_id=1),
                               MagicMock(character_id=2)]
        with patch("authstats.utils.providers.esi", esi_roles(Exception("bad"), ["Director"])), \
                self.assertLogs("authstats.utils", "WARNING"):
            self.assertIs(get_director_token(123), tokens.return_value[1])

    def test_no_director(self, tokens):
        tokens.return_value = [MagicMock(character_id=1)]
        with patch("authstats.utils.providers.esi", esi_roles(None)):
            self.assertIsNone(get_director_token(123))


@patch("authstats.utils.get_director_token", return_value="token")
class TestRefreshMemberLogins(UserTestCase):
    def test_stores_tracking(self, token):
        on = timezone.now() - timedelta(days=2)
        with patch("authstats.utils.providers.esi", esi_tracking((1, on), (99, None))):
            refresh_member_logins([123])
        self.assertEqual(MemberLogin.objects.get(
            character_id=1).logon_date, on)
        self.assertIsNone(MemberLogin.objects.get(character_id=99).logon_date)
        self.assertEqual(MemberLogin.objects.get(
            character_id=1).corporation_id, 123)

    def test_replaces_existing(self, token):
        MemberLogin.objects.create(character_id=1, corporation_id=2,
                                   updated=timezone.now())
        on = timezone.now()
        with patch("authstats.utils.providers.esi", esi_tracking((1, on))):
            refresh_member_logins([123])
        row = MemberLogin.objects.get(character_id=1)
        self.assertEqual((row.corporation_id, row.logon_date), (123, on))

    def test_fetched_once_per_window(self, token):
        esi = esi_tracking((1, timezone.now()))
        with patch("authstats.utils.providers.esi", esi):
            refresh_member_logins([123])
            refresh_member_logins([123])
        esi.client.Corporation.GetCorporationsCorporationIdMembertracking.assert_called_once_with(
            corporation_id=123, token="token")
        self.assertLessEqual(cache.ttl(login_refresh_key(123)),
                             LOGIN_REFRESH_SECONDS)

    def test_no_token_marked_fresh(self, token):
        token.return_value = None
        esi = esi_tracking()
        with patch("authstats.utils.providers.esi", esi):
            refresh_member_logins([123])
            refresh_member_logins([123])
        token.assert_called_once_with(123)
        esi.client.Corporation.GetCorporationsCorporationIdMembertracking.assert_not_called()

    def test_esi_error_logged(self, token):
        esi = MagicMock()
        esi.client.Corporation.GetCorporationsCorporationIdMembertracking.side_effect = Exception(
            "boom")
        with patch("authstats.utils.providers.esi", esi), \
                self.assertLogs("authstats.utils", "ERROR"):
            refresh_member_logins([123])
        self.assertFalse(MemberLogin.objects.exists())


@patch("authstats.utils.refresh_member_logins")
class TestLastLoginField(UserTestCase):
    def setUp(self):
        super().setUp()
        self.field = ReportFieldLastLogin.objects.create(
            name="login", description="d", days_since_login=10)
        self.users = User.objects.filter(
            pk__in=[self.user1.pk, self.user2.pk, self.user3.pk])

    def login(self, char_id, days_ago):
        MemberLogin.objects.create(
            character_id=char_id, corporation_id=0, updated=timezone.now(),
            logon_date=timezone.now() - timedelta(days=days_ago))

    def test_latest_alt_login_counts(self, refresh):
        self.login(1, 20)
        self.login(2, 3)
        out = self.field.process_field(self.users)
        self.assertTrue(out[self.user1.id]["check"])
        self.assertIn("3 Days Ago", out[self.user1.id]["message"])

    def test_old_login_fails(self, refresh):
        self.login(3, 11)
        self.assertFalse(self.field.process_field(
            self.users)[self.user2.id]["check"])

    def test_no_data(self, refresh):
        out = self.field.process_field(self.users)
        self.assertEqual(out[self.user2.id],
                         {"message": "No Data", "check": False})
        self.field.no_data_pass = True
        self.assertTrue(self.field.process_field(
            self.users)[self.user2.id]["check"])

    def test_refreshes_corps_of_all_alts(self, refresh):
        self.field.process_field(self.users)
        refresh.assert_called_once_with({123, 2, 3, 4})

    def test_main_corp_only(self, refresh):
        # char7 is user3's alt in corp4, their main is in corp3
        self.login(7, 1)
        self.field.main_corp_only = True
        out = self.field.process_field(self.users)
        self.assertEqual(out[self.user3.id]["message"], "No Data")
        refresh.assert_called_once_with({123, 2, 3})

    def test_secure_groups_methods(self, refresh):
        self.login(1, 1)
        self.assertTrue(self.field.process_filter(self.user1))
        self.assertFalse(self.field.process_filter(self.user2))
        self.assertTrue(self.field.audit_filter(
            self.users)[self.user1.id]["check"])


class TestAddDirectorToken(UserTestCase):
    def test_requests_membership_scope_too(self):
        self.assertEqual(set(views.DIRECTOR_SCOPES), {
            "esi-corporations.track_members.v1",
            "esi-characters.read_corporation_roles.v1",
            "esi-corporations.read_corporation_membership.v1",
        })

    # skip login_required and token_required, the view gets the token handed in
    view = staticmethod(views.add_director_token.__wrapped__.__wrapped__)

    def test_clears_refresh_mark(self):
        cache.set(login_refresh_key(123), True)
        request = RequestFactory().get("/reports/add_director_token/")
        request.user = self.user1
        r = self.view(request, MagicMock(character_id=1))
        self.assertEqual(r.url, reverse("authstats:base"))
        self.assertIsNone(cache.get(login_refresh_key(123)))
