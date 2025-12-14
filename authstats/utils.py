import logging

from django.contrib.auth.models import User

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


def find_unknown_character_ids(corp_id):
    known_character_ids = get_knowns_queryset(corp_id).values_list(
        "character_id",
        flat=True
    )
    unknown_member_list = []
    try:
        scopes = ["esi-corporations.read_corporation_membership.v1"]

        token = Token.objects.filter(
            character_id__in=EveCharacter.objects.filter(
                corporation_id=corp_id
            ).values(
                'character_id'
            )
        ).require_scopes(scopes)

        if not token.exists():
            raise Exception("No Tokens")

        unknown_member_list = set(
            providers.esi.client.Corporation.GetCorporationsCorporationIdMembers(
                corporation_id=corp_id,
                token=token.first(),
            ).result(
                use_etag=False
            )
        )
        for m in known_character_ids:
            try:
                unknown_member_list.remove(m)
            except KeyError:
                pass
    except Exception as e:
        logger.exception(e)

    return unknown_member_list
