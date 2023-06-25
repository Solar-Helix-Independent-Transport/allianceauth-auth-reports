from ..models import AuthReportsConfiguration
from . import UserTestCase


class TestCorptoolsCorpAccessPerms(UserTestCase):
    def test_no_perms_get_self_u1(self):
        cs = AuthReportsConfiguration.get_solo().visible_corps_for_user(self.user1)
        self.assertNotIn(self.corp1, cs)
        self.assertNotIn(self.corp2, cs)
        self.assertNotIn(self.corp3, cs)
        self.assertNotIn(self.corp4, cs)

    def test_no_perms_get_self_u2(self):
        cs = AuthReportsConfiguration.get_solo().visible_corps_for_user(self.user2)
        self.assertNotIn(self.corp1, cs)
        self.assertNotIn(self.corp2, cs)
        self.assertNotIn(self.corp3, cs)
        self.assertNotIn(self.corp4, cs)

    def test_no_perms_get_self_u3(self):
        cs = AuthReportsConfiguration.get_solo().visible_corps_for_user(self.user2)
        self.assertNotIn(self.corp1, cs)
        self.assertNotIn(self.corp2, cs)
        self.assertNotIn(self.corp3, cs)
        self.assertNotIn(self.corp4, cs)

    def test_get_corp_u1(self):
        self.user1.user_permissions.add(self.own_corp)
        self.user1.refresh_from_db()
        cs = AuthReportsConfiguration.get_solo().visible_corps_for_user(self.user1)
        self.assertIn(self.corp1, cs)
        self.assertNotIn(self.corp2, cs)
        self.assertNotIn(self.corp3, cs)
        self.assertNotIn(self.corp4, cs)

    def test_get_corp_u2(self):
        self.user2.user_permissions.add(self.own_corp)
        self.user2.refresh_from_db()
        cs = AuthReportsConfiguration.get_solo().visible_corps_for_user(self.user2)
        self.assertNotIn(self.corp1, cs)
        self.assertIn(self.corp2, cs)
        self.assertNotIn(self.corp3, cs)
        self.assertNotIn(self.corp4, cs)

    def test_get_corp_u3(self):
        self.user3.user_permissions.add(self.own_corp)
        self.user3.refresh_from_db()
        cs = AuthReportsConfiguration.get_solo().visible_corps_for_user(self.user3)
        self.assertNotIn(self.corp1, cs)
        self.assertNotIn(self.corp2, cs)
        self.assertIn(self.corp3, cs)
        self.assertNotIn(self.corp4, cs)

    def test_get_alliance_u1(self):
        self.user1.user_permissions.add(self.own_alliance)
        self.user1.refresh_from_db()
        cs = AuthReportsConfiguration.get_solo().visible_corps_for_user(self.user1)
        self.assertIn(self.corp1, cs)
        self.assertNotIn(self.corp2, cs)
        self.assertNotIn(self.corp3, cs)
        self.assertNotIn(self.corp4, cs)

    def test_get_alliance_u2(self):
        self.user2.user_permissions.add(self.own_alliance)
        self.user2.refresh_from_db()
        cs = AuthReportsConfiguration.get_solo().visible_corps_for_user(self.user2)
        self.assertNotIn(self.corp1, cs)
        self.assertIn(self.corp2, cs)
        self.assertNotIn(self.corp3, cs)
        self.assertNotIn(self.corp4, cs)

    def test_get_alliance_u3(self):
        self.user3.user_permissions.add(self.own_alliance)
        self.user3.refresh_from_db()
        cs = AuthReportsConfiguration.get_solo().visible_corps_for_user(self.user3)
        self.assertNotIn(self.corp1, cs)
        self.assertNotIn(self.corp2, cs)
        self.assertIn(self.corp3, cs)
        self.assertNotIn(self.corp4, cs)  # alt corp no show
