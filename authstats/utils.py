import logging

from django.contrib.auth.models import User
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

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
# member tracking also needs the Director role, checked with the roles scope
TRACKING_SCOPES = [
    "esi-corporations.track_members.v1",
    "esi-characters.read_corporation_roles.v1",
]


def get_corp_tokens(corp_id, scopes):
    return Token.objects.filter(
        character_id__in=EveCharacter.objects.filter(
            corporation_id=corp_id
        ).values(
            'character_id'
        )
    ).require_scopes(scopes)


def get_membership_tokens(corp_id):
    return get_corp_tokens(corp_id, MEMBERSHIP_SCOPES)


def get_director_token(corp_id):
    """A tracking token whose character is a Director, or None."""
    for token in get_corp_tokens(corp_id, TRACKING_SCOPES):
        try:
            roles = providers.esi.client.Character.GetCharactersCharacterIdRoles(
                character_id=token.character_id,
                token=token,
            ).result(
                use_etag=False
            )
            if "Director" in (roles.roles or []):
                return token
        except Exception as e:
            # one bad token mustn't stop us trying the rest
            logger.warning(
                f"Roles check failed for token {token.pk} in corp {corp_id}: {e}")
    return None


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


# ESI caches member tracking for an hour, fetching sooner gets the same data
LOGIN_REFRESH_SECONDS = 60 * 60


def login_refresh_key(corp_id):
    return f"authstats:logins:{corp_id}"


def refresh_member_logins(corp_ids):
    """
        Update MemberLogin from ESI member tracking for each corp, skipping
        corps fetched (or found without a director token) in the last hour.
    """
    from authstats.models import MemberLogin

    for corp_id in corp_ids:
        # marks the corp fresh, and stops parallel report runs fetching it too
        if not cache.add(login_refresh_key(corp_id), True, LOGIN_REFRESH_SECONDS):
            continue
        try:
            token = get_director_token(corp_id)
            if token is None:
                continue
            tracking = providers.esi.client.Corporation.GetCorporationsCorporationIdMembertracking(
                corporation_id=corp_id,
                token=token,
            ).result(
                use_etag=False
            )
            now = timezone.now()
            rows = [
                MemberLogin(
                    character_id=c.character_id,
                    corporation_id=corp_id,
                    logon_date=c.logon_date,
                    logoff_date=c.logoff_date,
                    updated=now,
                ) for c in tracking
            ]
            # replace rather than upsert, MySQL can't upsert on unique_fields
            with transaction.atomic():
                MemberLogin.objects.filter(
                    character_id__in=[r.character_id for r in rows]
                ).delete()
                MemberLogin.objects.bulk_create(rows, batch_size=1000)
        except Exception as e:
            logger.exception(f"Member tracking failed for corp {corp_id}: {e}")


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
