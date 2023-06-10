from __future__ import annotations

import logging

from django.conf import settings
from django.db.models import QuerySet
from ninja import Field, NinjaAPI, Schema
from ninja.pagination import LimitOffsetPagination, paginate
from ninja.security import django_auth
from ninja.types import DictStrAny

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
               urls_namespace='authstats:api', auth=django_auth, csrf=True,
               openapi_url=settings.DEBUG and "/openapi.json" or "")
