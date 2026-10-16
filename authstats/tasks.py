import json
import logging

from celery import shared_task

from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone

from allianceauth.services.tasks import QueueOnce

from .models import (
    AuthReportsConfiguration, Report, ReportDataThrough, ReportResults,
)
from .targets import TARGET_TYPES, get_target

TZ_STRING = "%Y-%m-%dT%H:%M:%SZ"

logger = logging.getLogger(__name__)


@shared_task(bind=True, base=QueueOnce, max_retries=None)
def run_report(self, target_type, target_id, report_id):
    """
        Returns a short message, not the output: celery result consumers
        (result backends, task monitors) can't serialise its datetime (#7).
    """
    output = generate_report(target_type, target_id, report_id)
    return (f"{output['report']['name']} updated for {target_type} "
            f"{output['target']['name']}: {output['members']} members")


def generate_report(target_type, target_id, report_id):
    """Run a report against a target, store and return the output."""
    report = Report.objects.get(id=report_id)
    target = get_target(target_type, target_id)
    fields = ReportDataThrough.objects.filter(report=report).order_by("rank")

    mains = target.mains().select_related("profile__main_character")

    output = {"report": {"name": report.name,
                         # legacy UI reads this, keep it as the target label
                         "corporation": target.label},
              "target": target.as_dict(),
              "headers": {},
              "data": {},
              "members": mains.count(),
              "unknowns": 0,
              "updated": timezone.now(),
              "show_avatar": report.show_character_image
              }
    output.update(target.extras())

    # build each row once, not once per field
    for u in mains:
        output['data'][u.id] = {"character": {
            "name": u.profile.main_character.character_name,
            "id": u.profile.main_character.character_id}}

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
            for uid, row in output['data'].items():
                row[f"field-{f.id}"] = {
                    "check": f_data[uid]['check'],
                    "data": "" if f.checkbox_only else f_data[uid]['message']
                }
                output['headers'][f.id]['pass'] += 1 if f_data[uid]['check'] else 0

        except Exception as e:
            logger.error(f"Error in Filter {e}")

    # strip the uid's from the data its just annoying to deal with.
    output['data'] = list(output['data'].values())
    output['headers'] = list(output['headers'].values())
    ReportResults.objects.update_or_create(
        report=report,
        **target.results_filter(),
        defaults={"results": json.dumps(output, cls=DjangoJSONEncoder)}
    )

    return output


@shared_task(bind=True, base=QueueOnce, max_retries=None)
def run_report_for_corp(self, corp_id, report_id):
    """
        Deprecated: use run_report("corp", corp_id, report_id).

        Re-queued rather than called directly so run_report's QueueOnce lock
        stops it running alongside a run_report for the same corp and report.
    """
    queue_report(get_target("corp", corp_id), report_id)


@shared_task
def refresh_overview_reports():
    """
        Keep the global overview warm: queue every overview report for every
        target of the types it is enabled for.
    """
    conf = AuthReportsConfiguration.get_solo()
    for report in Report.objects.filter(show_in_global=True):
        for target_type in report.enabled_target_types():
            target_cls = TARGET_TYPES[target_type]
            for obj in conf.candidate_targets(target_type):
                queue_report(target_cls(obj), report.id)
        logger.info(f"Queued overview refresh for {report.name}")


def queue_report(target, report_id):
    run_report.apply_async(
        args=[target.target_type, target.target_id, report_id],
        priority=target.priority
    )


# @shared_task(bind=True, base=QueueOnce, max_retries=None)
# def run_reports_for_exporting(self, report_id, webhook_url):
#     """
#         Export the Stats for this report for all corps to a discord webhook as json?
#     """
#     pass...
