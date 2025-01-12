import logging

from django.core.exceptions import ObjectDoesNotExist
from django.db import models

from allianceauth.eveonline.models import EveCorporationInfo

logger = logging.getLogger(__name__)
