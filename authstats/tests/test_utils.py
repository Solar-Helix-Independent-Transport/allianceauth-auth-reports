from unittest.mock import MagicMock, patch

from django.core.cache import cache

from ..utils import (
    ROSTER_CACHE_SECONDS, find_unknown_character_ids, get_corp_roster,
)
from . import UserTestCase


def esi_members(*ids):
    esi = MagicMock()
    esi.client.Corporation.GetCorporationsCorporationIdMembers.return_value.result.return_value = list(
        ids)
    return esi


class TestCorpRoster(UserTestCase):
    def test_fetches_and_caches(self):
        esi = esi_members(1, 2, 3)
        with patch("authstats.utils.providers.esi", esi):
            self.assertEqual(get_corp_roster(123, "token"), {1, 2, 3})
            self.assertEqual(get_corp_roster(123, "token"), {1, 2, 3})
        call = esi.client.Corporation.GetCorporationsCorporationIdMembers
        call.assert_called_once_with(corporation_id=123, token="token")
        self.assertEqual(cache.get("authstats:roster:123"), [1, 2, 3])
        self.assertLessEqual(
            cache.ttl("authstats:roster:123"), ROSTER_CACHE_SECONDS)

    def test_rosters_cached_per_corp(self):
        with patch("authstats.utils.providers.esi", esi_members(1)):
            get_corp_roster(123, "token")
        with patch("authstats.utils.providers.esi", esi_members(2)):
            self.assertEqual(get_corp_roster(2, "token"), {2})

    def test_returns_a_copy(self):
        with patch("authstats.utils.providers.esi", esi_members(1, 2)):
            get_corp_roster(123, "token").clear()
            self.assertEqual(get_corp_roster(123, "token"), {1, 2})


@patch("authstats.utils.get_membership_tokens")
class TestFindUnknownCharacterIds(UserTestCase):
    def test_known_characters_removed(self, tokens):
        tokens.return_value.first.return_value = "token"
        # char1/char2 are owned by user1, 99 is not known to auth
        with patch("authstats.utils.providers.esi", esi_members(1, 2, 99)):
            self.assertEqual(find_unknown_character_ids(123), {99})

    def test_owned_without_main_is_unknown(self, tokens):
        tokens.return_value.first.return_value = "token"
        # char9 is owned by user4, who has no main
        with patch("authstats.utils.providers.esi", esi_members(3, 9)):
            self.assertEqual(find_unknown_character_ids(2), {9})

    def test_no_token_is_empty(self, tokens):
        tokens.return_value.first.return_value = None
        esi = esi_members(99)
        with patch("authstats.utils.providers.esi", esi), \
                self.assertLogs("authstats.utils", "ERROR"):
            self.assertEqual(list(find_unknown_character_ids(123)), [])
        esi.client.Corporation.GetCorporationsCorporationIdMembers.assert_not_called()

    def test_esi_error_is_empty(self, tokens):
        tokens.return_value.first.return_value = "token"
        esi = MagicMock()
        esi.client.Corporation.GetCorporationsCorporationIdMembers.side_effect = OSError(
            "down")
        with patch("authstats.utils.providers.esi", esi), \
                self.assertLogs("authstats.utils", "ERROR"):
            self.assertEqual(list(find_unknown_character_ids(123)), [])
