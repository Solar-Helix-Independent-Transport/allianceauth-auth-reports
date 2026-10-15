from __future__ import annotations

import json
import logging
from datetime import timedelta
from typing import List

from ninja import Field, NinjaAPI, Schema
from ninja.pagination import LimitOffsetPagination
from ninja.security import django_auth
from ninja.types import DictStrAny

from django.core.exceptions import ObjectDoesNotExist
from django.db.models import QuerySet
from django.utils import timezone

from allianceauth.eveonline.models import EveCorporationInfo

from authstats import schema
from authstats.targets import TARGET_TYPES, CorpTarget, get_target
from authstats.tasks import queue_report

from . import providers
from .models import (
    AuthReportsConfiguration, Report, ReportDataThrough, ReportResults,
)

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


api = NinjaAPI(
    title="Auth Stats API",
    version="0.0.3",
    urls_namespace='authstats:api',
    auth=django_auth
)
# openapi_url=settings.DEBUG and "/openapi.json" or "")


@api.get(
    "/get_report/{report_id}/{corp_id}",
    response={200: dict, 403: str},
    tags=["Report"]
)
def get_report_for_corp(request, report_id: int, corp_id: int):
    try:
        target = CorpTarget.get(corp_id)
    except EveCorporationInfo.DoesNotExist:
        target = None
    if target is None or not target.is_visible_to(request.user):
        return 403, f"Access Denied to get_report_for_corp {report_id}/{corp_id} for {request.user}"
    report = Report.objects.get(id=report_id)
    if report.restricted and not request.user.has_perm("authstats.restricted_reports"):
        return 403, f"Access Denied to get_report_for_corp {report_id}/{corp_id} for {request.user}"
    return report_for_target(target, report)


def report_for_target(target, report):
    """Cached results for a target, queueing a run if stale or missing."""
    try:
        results = ReportResults.objects.get(
            report=report, **target.results_filter())
        if results.last_update < timezone.now() - timedelta(hours=1):
            queue_report(target, report.id)
        return json.loads(results.results)
    except ReportResults.DoesNotExist:
        # send task!
        queue_report(target, report.id)
        return {"report": {"name": f"{report.name}",
                           "corporation": target.label},
                "target": target.as_dict(),
                "data": False,
                "members": 0,
                "unknowns": 0}


def visible_target_or_none(request, target_type, target_id):
    try:
        target = get_target(target_type, target_id)
    except (KeyError, ObjectDoesNotExist):
        return None
    return target if target.is_visible_to(request.user) else None


def visible_reports(request):
    _reports = Report.objects.all()
    if not request.user.has_perm("authstats.restricted_reports"):
        _reports = _reports.filter(restricted=False)
    return _reports


@api.get(
    "/targets",
    response={200: List[schema.Target], 403: str},
    tags=["Targets"]
)
def get_targets(request):
    if not request.user.has_perm("authstats.basic_access"):
        return 403, f"Access Denied to get_targets for {request.user}"
    conf = AuthReportsConfiguration.get_solo()
    out = []
    for a in conf.visible_targets(request.user, "alliance").order_by("alliance_name"):
        out.append({"type": "alliance", "id": a.alliance_id,
                    "name": a.alliance_name, "ticker": a.alliance_ticker})
    for c in conf.visible_targets(request.user, "corp").select_related(
            "alliance").order_by("corporation_name"):
        parent = None
        if c.alliance:
            parent = {"type": "alliance", "id": c.alliance.alliance_id,
                      "name": c.alliance.alliance_name, "ticker": c.alliance.alliance_ticker}
        out.append({"type": "corp", "id": c.corporation_id, "name": c.corporation_name,
                    "ticker": c.corporation_ticker, "parent": parent})
    for g in conf.visible_targets(request.user, "group").order_by("name"):
        out.append({"type": "group", "id": g.pk, "name": g.name})
    return out


@api.get(
    "/reports",
    response={200: List[schema.Report], 403: str},
    tags=["Targets"]
)
def get_reports_for_type(request, target_type: str = None):
    if not request.user.has_perm("authstats.basic_access"):
        return 403, f"Access Denied to get_reports for {request.user}"
    _reports = visible_reports(request)
    if target_type in Report.TARGET_TYPE_FLAGS:
        _reports = _reports & Report.for_target_type(target_type)
    return _reports


@api.get(
    "/report/{target_type}/{target_id}/{report_id}",
    response={200: dict, 403: str, 404: str},
    tags=["Targets"]
)
def get_report(request, target_type: str, target_id: int, report_id: int):
    if not request.user.has_perm("authstats.basic_access"):
        return 403, f"Access Denied to get_report for {request.user}"
    target = visible_target_or_none(request, target_type, target_id)
    if target is None:
        return 403, f"Access Denied to get_report {target_type}/{target_id} for {request.user}"
    report = visible_reports(request).filter(id=report_id).first()
    if report is None or not report.enabled_for(target_type):
        return 404, f"Report {report_id} not found for {target_type}"
    return report_for_target(target, report)


@api.get(
    "/unknowns/{target_type}/{target_id}",
    response={200: dict, 403: str, 404: str},
    tags=["Targets"]
)
def get_unknowns(request, target_type: str, target_id: int):
    if not request.user.has_perm("authstats.basic_access"):
        return 403, f"Access Denied to get_unknowns for {request.user}"
    target = visible_target_or_none(request, target_type, target_id)
    if target is None:
        return 403, f"Access Denied to get_unknowns {target_type}/{target_id} for {request.user}"
    if not target.has_unknowns:
        return 404, f"{target_type} targets have no unknown characters"
    return unknowns_for_target(target)


@api.get(
    "/overview",
    response={200: List[schema.Report], 403: str},
    tags=["Overview"]
)
def get_overview_reports(request):
    if not request.user.has_perm("authstats.basic_access"):
        return 403, f"Access Denied to get_overview_reports for {request.user}"
    return visible_reports(request).filter(show_in_global=True)


def all_pass_count(results, aggregate_fields):
    """Members passing every aggregate field in a stored results blob."""
    return sum(
        1 for row in results.get("data") or []
        if all(row.get(f, {}).get("check") for f in aggregate_fields)
    )


@api.get(
    "/overview/{report_id}",
    response={200: dict, 403: str, 404: str},
    tags=["Overview"]
)
def get_overview(request, report_id: int, target_type: str = None):
    if not request.user.has_perm("authstats.basic_access"):
        return 403, f"Access Denied to get_overview for {request.user}"
    report = visible_reports(request).filter(
        id=report_id, show_in_global=True).first()
    if report is None:
        return 404, f"Report {report_id} not on the overview"

    fields = [
        {"field": f"field-{f.id}", "header": f.header,
         "description": f.long_descriptions}
        for f in ReportDataThrough.objects.filter(
            report=report, pass_fail_aggregate=True).order_by("rank")
    ]
    aggregate_fields = [f["field"] for f in fields]

    types = report.enabled_target_types()
    if target_type:
        types = [t for t in types if t == target_type]

    conf = AuthReportsConfiguration.get_solo()
    stale = timezone.now() - timedelta(hours=1)
    rows = []
    for t in types:
        target_cls = TARGET_TYPES[t]
        objs = conf.visible_targets(request.user, t)
        cached = {
            getattr(r, f"{target_cls.results_field}_id"): r
            for r in ReportResults.objects.filter(
                report=report,
                **{f"{target_cls.results_field}__in": objs}
            )
        }
        for obj in objs:
            target = target_cls(obj)
            row = {"target": target.as_dict(), "members": None,
                   "unknowns": None, "updated": None,
                   "fields": {}, "all_pass": None}
            results = cached.get(obj.pk)
            if results is None or results.last_update < stale:
                queue_report(target, report.id)
            if results is not None:
                data = json.loads(results.results)
                row["members"] = data.get("members")
                if target.has_unknowns:
                    row["unknowns"] = data.get("unknowns")
                row["updated"] = data.get("updated")
                row["fields"] = {
                    h["field"]: h["pass"] for h in data.get("headers", [])
                    if h["field"] in aggregate_fields
                }
                row["all_pass"] = all_pass_count(data, aggregate_fields)
            rows.append(row)

    return {"report": {"id": report.id, "name": report.name},
            "target_types": report.enabled_target_types(),
            "fields": fields,
            "rows": rows}


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

    return visible_reports(request).filter(show_for_corps=True)


def chunk_ids(lo, n=500):
    for i in range(0, len(lo), n):
        yield lo[i:i + n]


@api.get(
    "/get_unknowns/{corp_id}",
    response={200: dict, 403: str},
    tags=["Report"]
)
def get_orphans_for_corp(request, corp_id: int):
    if not AuthReportsConfiguration.get_solo().visible_corps_for_user(request.user).filter(corporation_id=corp_id).exists():
        return 403, f"Access Denied to get_orphans_for_corp for {request.user}"

    return unknowns_for_target(CorpTarget.get(corp_id))


def unknowns_for_target(target):
    member_count = target.mains().count()

    names = []
    for c in chunk_ids(list(target.unknown_character_ids())):
        try:
            for _n in providers.esi.client.Universe.PostUniverseNames(
                body=c
            ).result(use_etag=False):
                names.append(
                    {
                        "character": {
                            "id": _n.id,
                            "name": _n.name
                        }
                    }
                )
        except Exception as e:
            logger.exception(e)

    orphans = []
    for c in target.orphans():
        try:
            orphans.append(
                {
                    "character": {
                        "id": c.character_id,
                        "name": c.character_name
                    },
                    "main": {
                        "id": c.character_ownership.user.profile.main_character.character_id,
                        "name": c.character_ownership.user.profile.main_character.character_name,
                        "cid": c.character_ownership.user.profile.main_character.corporation_id,
                        "cname": c.character_ownership.user.profile.main_character.corporation_name
                    }
                }
            )
        except Exception as e:
            logger.exception(e)

    output = {
        "missing": {
            "name": "Missing Characters",
            "corporation": target.label,
            "members": member_count,
            "data": names
        },
        "orphans": {
            "name": "Orphaned Characters",
            "corporation": target.label,
            "members": member_count,
            "data": orphans
        }
    }
    if hasattr(target, "corps_without_token"):
        output["corps_without_token"] = target.corps_without_token()
    return output
