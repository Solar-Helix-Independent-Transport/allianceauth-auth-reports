import datetime
import json
import logging
import os

from allianceauth.authentication.models import CharacterOwnership, UserProfile
from allianceauth.eveonline.evelinks import eveimageserver
from allianceauth.eveonline.models import (EveAllianceInfo, EveCharacter,
                                           EveCorporationInfo)
from allianceauth.notifications import notify
from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

logger = logging.getLogger(__name__)


class AuthReportsConfiguration(models.Model):
    holding_corps = models.ManyToManyField(EveCorporationInfo)

    class Meta:
        permissions = (
            ('holding_corps',
             'Can access configured holding corp reports.'),
            ('own_corp',
             'Can access own corporations reports.'),
            ('own_alliance',
             'Can access own alliances reports.'),
            ('own_state',
             'Can access own states reports.'),
        )

        default_permissions = []

    def holding_corp_qs(self):
        return None
