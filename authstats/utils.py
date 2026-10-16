import logging

from django.contrib.auth.models import User
from django.core.cache import cache

from allianceauth.eveonline.models import EveCharacter
from esi.models import Token

from authstats import providers

logger = logging.getLogger(__name__)


def get_main_queryset(corp_id):
    return User.objects.filter(
        profile__main_character__corporation_id=corp_id
    )


def get_orphan_queryset(corp_id):
    return EveCharacter.objects.filter(
        corporation_id=corp_id,
        character_ownership__isnull=False,
    ).exclude(
        character_ownership__user__profile__main_character__corporation_id=corp_id
    )


def get_knowns_queryset(corp_id):
    return EveCharacter.objects.filter(
        corporation_id=corp_id,
        character_ownership__isnull=False,
    ).exclude(
        character_ownership__user__profile__main_character__isnull=True
    )


MEMBERSHIP_SCOPES = ["esi-corporations.read_corporation_membership.v1"]


def get_membership_tokens(corp_id):
    return Token.objects.filter(
        character_id__in=EveCharacter.objects.filter(
            corporation_id=corp_id
        ).values(
            'character_id'
        )
    ).require_scopes(MEMBERSHIP_SCOPES)


def get_alliance_main_queryset(alliance_id):
    return User.objects.filter(
        profile__main_character__alliance_id=alliance_id
    )


def get_alliance_orphan_queryset(alliance_id):
    """Characters in the alliance whose main is outside it."""
    return EveCharacter.objects.filter(
        alliance_id=alliance_id,
        character_ownership__isnull=False,
    ).exclude(
        character_ownership__user__profile__main_character__alliance_id=alliance_id
    )


# ESI caches the member list for an hour, share it across report runs
ROSTER_CACHE_SECONDS = 30 * 60


def get_corp_roster(corp_id, token):
    """Character ids ESI lists as members of the corp, cached."""
    key = f"authstats:roster:{corp_id}"
    roster = cache.get(key)
    if roster is None:
        roster = list(
            providers.esi.client.Corporation.GetCorporationsCorporationIdMembers(
                corporation_id=corp_id,
                token=token,
            ).result(
                use_etag=False
            )
        )
        cache.set(key, roster, ROSTER_CACHE_SECONDS)
    return set(roster)


def find_unknown_character_ids(corp_id):
    known_character_ids = get_knowns_queryset(corp_id).values_list(
        "character_id",
        flat=True
    )
    unknown_member_list = []
    try:
        token = get_membership_tokens(corp_id).first()

        if token is None:
            raise Exception("No Tokens")

        unknown_member_list = get_corp_roster(corp_id, token)
        unknown_member_list.difference_update(known_character_ids)
    except Exception as e:
        logger.exception(e)

    return unknown_member_list
