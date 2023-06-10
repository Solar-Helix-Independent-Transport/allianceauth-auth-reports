import logging

from allianceauth.eveonline.models import (EveAllianceInfo, EveCharacter,
                                           EveCorporationInfo)
from django.core.exceptions import ObjectDoesNotExist
from django.db import models

logger = logging.getLogger(__name__)
