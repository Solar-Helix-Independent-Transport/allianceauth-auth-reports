from __future__ import annotations

import json
import logging
from datetime import timedelta
from typing import List

from ninja import Field, NinjaAPI, Schema
from ninja.pagination import LimitOffsetPagination
from ninja.security import django_auth
from ninja.types import DictStrAny

from django.contrib.auth.models import User
from django.db.models import QuerySet
from django.utils import timezone

from allianceauth.eveonline.models import EveCharacter, EveCorporationInfo
from esi.models import Token

from authstats import schema
from authstats.tasks import run_report_for_corp

from . import providers
from .models import AuthReportsConfiguration, Report, ReportResults

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
        }


api = NinjaAPI(title="Auth Stats API", version="0.0.3",
               urls_namespace='authstats:api', auth=django_auth, csrf=True)  # ,
# openapi_url=settings.DEBUG and "/openapi.json" or "")


@api.get(
    "/get_report/{report_id}/{corp_id}",
    response={200: dict, 403: str},
    tags=["Report"]
)
def get_report_for_corp(request, report_id: int, corp_id: int):
    if not AuthReportsConfiguration.get_solo().visible_corps_for_user(request.user).filter(corporation_id=corp_id).exists():
        return 403, f"Access Denied to get_report_for_corp {report_id}/{corp_id} for {request.user}"
    try:
        report = ReportResults.objects.get(
            corporation__corporation_id=corp_id, report_id=report_id)
        if report.report.restricted and not request.user.has_perm("authstats.restricted_reports"):
            return 403, f"Access Denied to get_report_for_corp {report_id}/{corp_id} for {request.user}"
        if report.last_update < timezone.now() - timedelta(hours=1):
            run_report_for_corp.delay(corp_id, report_id)
        return json.loads(report.results)
    except ReportResults.DoesNotExist:
        corp = EveCorporationInfo.objects.get(corporation_id=corp_id)
        report = Report.objects.get(id=report_id)
        # send task!
        run_report_for_corp.delay(corp_id, report_id)
        return {"report": {"name": f"{report.name}",
                           "corporation": corp.corporation_name},
                "data": False,
                "members": 0,
                "unknowns": 0}


@api.get(
    "/get_corps",
    response={200: List[schema.Corporation]},
    tags=["Report"]
)
def get_corps(request):
    return AuthReportsConfiguration.get_solo().visible_corps_for_user(request.user)


@api.get(
    "/get_reports",
    response={200: List[schema.Report], 403: str},
    tags=["Report"]
)
def get_reports(request):
    if not request.user.has_perm("authstats.basic_access"):
        return 403, f"Access Denied to get_reports for {request.user}"

    _reports = Report.objects.all()
    if not request.user.has_perm("authstats.restricted_reports"):
        _reports = _reports.filter(restricted=False)
    return _reports


@api.get(
    "/get_unknowns/{corp_id}",
    response={200: dict, 403: str},
    tags=["Report"]
)
def get_orphans_for_corp(request, corp_id: int):
    if not AuthReportsConfiguration.get_solo().visible_corps_for_user(request.user).filter(corporation_id=corp_id).exists():
        return 403, f"Access Denied to get_orphans_for_corp for {request.user}"

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
