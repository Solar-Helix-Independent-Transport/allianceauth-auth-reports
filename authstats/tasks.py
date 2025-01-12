import json
import logging

from celery import chain, shared_task
from requests.adapters import MaxRetryError

from django.contrib.auth.models import User
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone

from allianceauth.eveonline.models import EveCharacter, EveCorporationInfo
from allianceauth.eveonline.providers import provider as eve_names
from allianceauth.services.tasks import QueueOnce
from esi.errors import TokenExpiredError
from esi.models import Token

from . import app_settings, providers
from .models import Report, ReportDataThrough, ReportResults

TZ_STRING = "%Y-%m-%dT%H:%M:%SZ"

logger = logging.getLogger(__name__)


@shared_task(bind=True, base=QueueOnce, max_retries=None)
def run_report_for_corp(self, corp_id, report_id):
    report = Report.objects.get(id=report_id)
    corp = EveCorporationInfo.objects.get(corporation_id=corp_id)

    fields = ReportDataThrough.objects.filter(report=report).order_by("rank")

    mains = User.objects.filter(
        profile__main_character__corporation_id=corp_id)

    known_character_ids = EveCharacter.objects.filter(
        corporation_id=corp_id, character_ownership__isnull=False).values_list("character_id", flat=True)
    unknown_member_list = []

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
    except Exception as e:
        logger.exception(e)

    output = {"report": {"name": report.name,
                         "corporation": corp.corporation_name},
              "headers": {},
              "data": {},
              "members": mains.count(),
              "unknowns": len(unknown_member_list),
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
                logger.warning(
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


@shared_task(bind=True, base=QueueOnce, max_retries=None)
def run_reports_for_exporting(self, report_id, webhook_url):
    """
        Export the Stats for this report for all corps to a discord webhook as json?
    """
