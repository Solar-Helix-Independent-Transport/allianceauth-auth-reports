from __future__ import annotations

import logging
from typing import List

from allianceauth.eveonline.models import EveCharacter, EveCorporationInfo
from django.conf import settings
from django.contrib.auth.models import User
from django.db.models import QuerySet
from esi.errors import TokenExpiredError
from esi.models import Token
from ninja import Field, NinjaAPI, Schema
from ninja.pagination import LimitOffsetPagination, paginate
from ninja.security import django_auth
from ninja.types import DictStrAny

from authstats import schema
from authstats.tasks import run_report_for_corp

from . import providers
from .models import Report

logger = logging.getLogger(__name__)


class Paginator(LimitOffsetPagination):
    class Input(Schema):
        limit: int = Field(1000000, ge=1)
        offset: int = Field(0, ge=0)

    def paginate_queryset(
        self,
        queryset: QuerySet,
        pagination: Input,
        **params: DictStrAny,
    ) -> any:
        offset = pagination.offset
        limit: int = pagination.limit
        return {
            "items": queryset[offset: offset + limit],
            "count": self._items_count(queryset),
        }  # noqa: E203


api = NinjaAPI(title="Auth Stats API", version="0.0.1",
               urls_namespace='authstats:api', auth=django_auth, csrf=True)  # ,
# openapi_url=settings.DEBUG and "/openapi.json" or "")


@api.get(
    "/get_report/{report_id}/{corp_id}",
    # response={200: List[schema.EveName]},
    tags=["Report"]
)
def get_report_for_corp(request, report_id: int, corp_id: int):
    if not request.user.is_superuser:
        return 403, {"message": "Hard no pall!"}

    return run_report_for_corp(corp_id, report_id)


@api.get(
    "/get_corps",
    response={200: List[schema.Corporation]},
    tags=["Report"]
)
def get_report_for_corp(request):
    if not request.user.is_superuser:
        return 403, {"message": "Hard no pall!"}

    return EveCorporationInfo.objects.filter(corporation_id__in=EveCharacter.objects.filter(userprofile__state__name="Member").values("corporation_id"))


@api.get(
    "/get_reports",
    response={200: List[schema.Report]},
    tags=["Report"]
)
def get_report_for_corp(request):
    if not request.user.is_superuser:
        return 403, {"message": "Hard no pall!"}

    return Report.objects.all()


@api.get(
    "/get_unknowns/{corp_id}",
    # response={200: List[schema.Report]},
    tags=["Report"]
)
def get_orphans_for_corp(request, corp_id: int):
    if not request.user.is_superuser:
        return 403, {"message": "Hard no pall!"}

    corp = EveCorporationInfo.objects.get(corporation_id=corp_id)

    mains = User.objects.filter(
        profile__main_character__corporation_id=corp_id)

    known_character_ids = EveCharacter.objects.filter(
        corporation_id=corp_id, character_ownership__isnull=False).values_list("character_id", flat=True)
    names = []
    try:
        scopes = "esi-corporations.read_corporation_membership.v1"
        token = Token.objects.filter(
            character_id__in=EveCharacter.objects.filter(
                corporation_id=corp_id).values('character_id')).require_scopes(scopes)
        if not token.exists():
            raise Exception("No Tokens")
        unknown_member_list = set(providers.esi.client.Corporation.get_corporations_corporation_id_members(
            corporation_id=corp_id, token=token.first().valid_access_token()).results())
        for m in known_character_ids:
            try:
                unknown_member_list.remove(m)
            except KeyError:
                pass
        names = providers.esi.client.Universe.post_universe_names(
            ids=list(unknown_member_list)).results()
    except Exception as e:
        logger.exception(e)

    return {"report": {"name": "Orphan Characters",
                       "corporation": corp.corporation_name},
            "members": mains.count(), "data": names}
