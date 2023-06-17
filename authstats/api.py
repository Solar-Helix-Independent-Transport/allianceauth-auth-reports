from __future__ import annotations

import logging
from typing import List

from allianceauth.eveonline.models import EveCorporationInfo
from django.conf import settings
from django.db.models import QuerySet
from ninja import Field, NinjaAPI, Schema
from ninja.pagination import LimitOffsetPagination, paginate
from ninja.security import django_auth
from ninja.types import DictStrAny

from authstats import schema
from authstats.tasks import run_report_for_corp

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

    return EveCorporationInfo.objects.all()


@api.get(
    "/get_reports",
    response={200: List[schema.Report]},
    tags=["Report"]
)
def get_report_for_corp(request):
    if not request.user.is_superuser:
        return 403, {"message": "Hard no pall!"}

    return Report.objects.all()
