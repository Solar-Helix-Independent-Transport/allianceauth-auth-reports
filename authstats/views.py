from django.contrib.auth.decorators import login_required, permission_required
from django.core.cache import cache
from django.shortcuts import redirect, render
from django.utils.translation import gettext_lazy as _

from allianceauth.eveonline.models import EveCharacter, EveCorporationInfo
from esi.decorators import token_required

from authstats.models import Report
from authstats.utils import (
    MEMBERSHIP_SCOPES, TRACKING_SCOPES, login_refresh_key,
)

from . import __version__

REQUIRED_SCOPES = [
    "esi-corporations.read_corporation_membership.v1"
]
# a director token doubles as the corp's membership token
DIRECTOR_SCOPES = TRACKING_SCOPES + MEMBERSHIP_SCOPES


def _add_token_corp(token):
    char = EveCharacter.objects.get_character_by_id(token.character_id)
    EveCorporationInfo.objects.get_or_create(
        corporation_id=char.corporation_id,
        defaults={
            'member_count': 0,
            'corporation_ticker': char.corporation_ticker,
            'corporation_name': char.corporation_name
        }
    )
    return char


@login_required
@token_required(scopes=REQUIRED_SCOPES)
def add_corp(request, token):
    _add_token_corp(token)
    return redirect('authstats:base')


@login_required
@token_required(scopes=DIRECTOR_SCOPES)
def add_director_token(request, token):
    char = _add_token_corp(token)
    # the corp may be marked as having no director token, fetch it next run
    cache.delete(login_refresh_key(char.corporation_id))
    return redirect('authstats:base')


@permission_required("authstats.basic_access")
def react_main(request, **kwargs):
    return render(
        request,
        'authstats/react_base_bs5.html',
        context={
            "version": __version__,
            "app_name": "authstats",
            "page_title": "Auth Reports"
        }
    )


@permission_required("authstats.basic_access")
def react_redirect(request):
    # get available models
    rid = 0
    try:
        rid = Report.objects.all().first().id
    except Exception:
        pass

    cid = request.user.profile.main_character.corporation_id
    return redirect("authstats:report", rid=rid, cid=cid)
