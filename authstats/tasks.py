import datetime
import json
import logging

from allianceauth.eveonline.models import EveCharacter
from allianceauth.eveonline.providers import provider as eve_names
from allianceauth.services.tasks import QueueOnce
from celery import chain, shared_task
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone
from esi.errors import TokenExpiredError
from esi.models import Token
from requests.adapters import MaxRetryError

from . import app_settings, providers

TZ_STRING = "%Y-%m-%dT%H:%M:%SZ"

logger = logging.getLogger(__name__)

# Bulk Updates
