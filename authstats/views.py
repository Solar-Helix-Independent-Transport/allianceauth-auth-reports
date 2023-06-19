import json
import xml.etree.ElementTree as ET

from allianceauth.eveonline.models import EveCharacter, EveCorporationInfo
from django.contrib import messages
from django.contrib.auth.decorators import (login_required,
                                            permission_required,
                                            user_passes_test)
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from django_celery_beat.models import CrontabSchedule, PeriodicTask
from esi.decorators import _check_callback, token_required
from esi.views import sso_redirect

from authstats.models import Report

from . import __version__

REQUIRED_SCOPES = [
    "esi-corporations.read_corporation_membership.v1"
]


@login_required
@token_required(scopes=REQUIRED_SCOPES)
def add_corp(request, token):
    char = EveCharacter.objects.get_character_by_id(token.character_id)
    corp, created = EveCorporationInfo.objects.get_or_create(corporation_id=char.corporation_id,
                                                             defaults={'member_count': 0,
                                                                       'corporation_ticker': char.corporation_ticker,
                                                                       'corporation_name': char.corporation_name
                                                                       })
    return redirect('authstats:base')


@user_passes_test(lambda u: u.is_superuser)
def react_main(request):
    # get available models
    return render(request, 'authstats/react_base.html', context={"version": __version__, "app_name": "authstats", "page_title": "Auth Reports"})