import json
import logging

from celery import shared_task

from django.contrib.auth.models import User
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone

from allianceauth.eveonline.models import EveCorporationInfo
from allianceauth.services.tasks import QueueOnce

from authstats.utils import (
    find_unknown_character_ids, get_main_queryset, get_orphan_queryset,
)

from .models import Report, ReportDataThrough, ReportResults

TZ_STRING = "%Y-%m-%dT%H:%M:%SZ"

logger = logging.getLogger(__name__)


@shared_task(bind=True, base=QueueOnce, max_retries=None)
def run_report_for_corp(self, corp_id, report_id):
    report = Report.objects.get(id=report_id)
    corp = EveCorporationInfo.objects.get(corporation_id=corp_id)
    fields = ReportDataThrough.objects.filter(report=report).order_by("rank")

    mains = get_main_queryset(corp_id)
    unknown_character_count = len(find_unknown_character_ids(corp_id))
    orphan_character_count = get_orphan_queryset(corp_id)

    output = {"report": {"name": report.name,
                         "corporation": corp.corporation_name},
              "headers": {},
              "data": {},
              "members": mains.count(),
              "unknowns": unknown_character_count + orphan_character_count,
              "updated": timezone.now(),
              "show_avatar": report.show_character_image
              }

    for f in fields:
        output['headers'][f.id] = {"rank": f.rank, "header": f.header,
                                   "field": f"field-{f.id}",
                                   "checkbox": f.checkbox_only,
                                   "aggregate": f.pass_fail_aggregate,
                                   "pass": 0,
                                   "description": f.long_descriptions,
                                   "allow_sort": f.allow_sort}

        try:  # TODO create new method for clean table data
            _f = f.report_Data_source.filter_object
            f_data = {}
            if hasattr(_f, "process_field"):
                f_data = _f.process_field(mains)
            elif hasattr(_f, "audit_filter"):
                logger.debug(
                    f"{_f} has no process_field, falling back to audit_filter")
                f_data = _f.audit_filter(mains)
            for u in mains:
                if u.id not in output['data']:
                    output['data'][u.id] = {"character": {
                        "name": u.profile.main_character.character_name, "id": u.profile.main_character.character_id}}
                output['data'][u.id][f"field-{f.id}"] = {
                    "check": f_data[u.id]['check'],
                    "data": "" if f.checkbox_only else f_data[u.id]['message']
                }
                output['headers'][f.id]['pass'] += 1 if f_data[u.id]['check'] else 0

        except Exception as e:
            logger.error(f"Error in Filter {e}")

    # strip the uid's from the data its just annoying to deal with.
    output['data'] = list(output['data'].values())
    output['headers'] = list(output['headers'].values())
    ReportResults.objects.update_or_create(corporation=corp, report=report,
                                           defaults={"results": json.dumps(output, cls=DjangoJSONEncoder)})

    return output


# @shared_task(bind=True, base=QueueOnce, max_retries=None)
# def run_reports_for_exporting(self, report_id, webhook_url):
#     """
#         Export the Stats for this report for all corps to a discord webhook as json?
#     """
#     pass...
