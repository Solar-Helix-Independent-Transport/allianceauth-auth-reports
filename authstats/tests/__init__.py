from allianceauth.authentication.models import CharacterOwnership, State
from allianceauth.eveonline.models import (EveAllianceInfo, EveCharacter,
                                           EveCorporationInfo)
from allianceauth.tests.auth_utils import AuthUtils
from django.contrib.auth.models import Permission
from django.test import TestCase

# TODO REBUILD FOR THIS APP
from ..models import AuthReportsConfiguration


class UserTestCase(TestCase):
    @staticmethod
    def create_char(char_id, char_name, corp=None):
        c = EveCharacter(character_id=char_id,
                         character_name=char_name,
                         corporation_id=corp.corporation_id,
                         corporation_name=corp.corporation_name,
                         corporation_ticker=corp.corporation_ticker)
        if corp.alliance:
            c.alliance_id = corp.alliance.alliance_id
            c.alliance_name = corp.alliance.alliance_name
            c.alliance_ticker = corp.alliance.alliance_ticker
        c.save()
        return c

    def setUp(cls):
        AuthReportsConfiguration.get_solo().states_to_include.add(
            *State.objects.all().values_list("id", flat=True))
        cls.corp1 = EveCorporationInfo.objects.create(corporation_id=123,
                                                      corporation_name='corporation.name1',
                                                      corporation_ticker='ABC',
                                                      ceo_id=1,
                                                      member_count=1
                                                      )
        cls.alli1 = EveAllianceInfo.objects.create(alliance_id=3,
                                                   alliance_name="alliance.names1",
                                                   alliance_ticker="TEST",
                                                   executor_corp_id=123
                                                   )
        cls.alli2 = EveAllianceInfo.objects.create(alliance_id=4,
                                                   alliance_name="alliance.names4",
                                                   alliance_ticker="TEST4",
                                                   executor_corp_id=3
                                                   )

        cls.corp2 = EveCorporationInfo.objects.create(corporation_id=2,
                                                      corporation_name='corporation.name2',
                                                      corporation_ticker='DEF',
                                                      ceo_id=2,
                                                      member_count=1,
                                                      alliance=cls.alli1
                                                      )

        cls.corp3 = EveCorporationInfo.objects.create(corporation_id=3,
                                                      corporation_name='corporation.name3',
                                                      corporation_ticker='GHI',
                                                      ceo_id=3,
                                                      member_count=1,
                                                      alliance=cls.alli2
                                                      )

        cls.corp4 = EveCorporationInfo.objects.create(corporation_id=4,
                                                      corporation_name='corporation.name4',
                                                      corporation_ticker='JKL',
                                                      ceo_id=4,
                                                      member_count=1,
                                                      alliance=cls.alli2
                                                      )

        cls.char1 = cls.create_char(1, 'character.name1', corp=cls.corp1)
        cls.char2 = cls.create_char(2, 'character.name2', corp=cls.corp1)
        cls.char3 = cls.create_char(3, 'character.name3', corp=cls.corp2)
        cls.char4 = cls.create_char(4, 'character.name4', corp=cls.corp2)
        cls.char5 = cls.create_char(5, 'character.name5', corp=cls.corp3)
        cls.char6 = cls.create_char(6, 'character.name6', corp=cls.corp3)
        cls.char7 = cls.create_char(7, 'character.name7', corp=cls.corp4)
        cls.char8 = cls.create_char(8, 'character.name8', corp=cls.corp4)
        cls.char9 = cls.create_char(9, 'character.name9', corp=cls.corp2)
        cls.char10 = cls.create_char(10, 'character.name10', corp=cls.corp2)

        cls.user1 = AuthUtils.create_user('User1')
        cls.user1.profile.main_character = cls.char1
        CharacterOwnership.objects.create(
            user=cls.user1, character=cls.char1, owner_hash="abc123")
        CharacterOwnership.objects.create(
            user=cls.user1, character=cls.char2, owner_hash="cba123")
        cls.user1.profile.save()
        cls.user1.profile.refresh_from_db()

        cls.user2 = AuthUtils.create_user('User2')
        cls.user2.profile.main_character = cls.char3
        CharacterOwnership.objects.create(
            user=cls.user2, character=cls.char3, owner_hash="cba321")
        cls.user2.profile.save()
        cls.user2.profile.refresh_from_db()

        cls.user3 = AuthUtils.create_user('User3')
        cls.user3.profile.main_character = cls.char5
        CharacterOwnership.objects.create(
            user=cls.user3, character=cls.char5, owner_hash="abc432")
        CharacterOwnership.objects.create(
            user=cls.user3, character=cls.char7, owner_hash="def432")
        cls.user3.profile.save()
        cls.user3.profile.refresh_from_db()

        cls.user4 = AuthUtils.create_user('User4')
        CharacterOwnership.objects.create(
            user=cls.user4, character=cls.char9, owner_hash="def432a")
        CharacterOwnership.objects.create(
            user=cls.user4, character=cls.char10, owner_hash="def432b")

        cls.basic_access = Permission.objects.get_by_natural_key(
            'basic_access', 'authstats', 'authreportsconfiguration')
        cls.holding_corps = Permission.objects.get_by_natural_key(
            'holding_corps', 'authstats', 'authreportsconfiguration')
        cls.own_corp = Permission.objects.get_by_natural_key(
            'own_corp', 'authstats', 'authreportsconfiguration')
        cls.own_alliance = Permission.objects.get_by_natural_key(
            'own_alliance', 'authstats', 'authreportsconfiguration')
        cls.own_state = Permission.objects.get_by_natural_key(
            'own_state', 'authstats', 'authreportsconfiguration')
        cls.restricted_reports = Permission.objects.get_by_natural_key(
            'restricted_reports', 'authstats', 'authreportsconfiguration')
