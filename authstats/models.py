import datetime
import json
import logging
import os
from collections import defaultdict

from allianceauth.authentication.models import CharacterOwnership, UserProfile
from allianceauth.eveonline.evelinks import dotlan, eveimageserver, zkillboard
from allianceauth.eveonline.models import (EveAllianceInfo, EveCharacter,
                                           EveCorporationInfo)
from allianceauth.notifications import notify
from django.contrib.auth.models import User
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils import timezone
from solo.models import SingletonModel

logger = logging.getLogger(__name__)


class AuthReportsConfiguration(SingletonModel):
    holding_corps = models.ManyToManyField(EveCorporationInfo)

    class Meta:
        verbose_name = "Site Configuration"
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


class ReportDataSource(models.Model):
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, editable=False
    )
    object_id = models.PositiveIntegerField(editable=False)
    filter_object = GenericForeignKey("content_type", "object_id")

    def __str__(self):
        try:
            return f"{self.filter_object.name}: {self.filter_object.description}"
        except:
            return f"Error: {self.content_type.app_label}:{self.content_type} {self.object_id}"

    class Meta:
        default_permissions = []


class Report(models.Model):
    name = models.CharField(max_length=250)
    report_fields = models.ManyToManyField(
        ReportDataSource, through='ReportDataThrough')

    def __str__(self):
        return self.name


class ReportDataThrough(models.Model):
    rank = models.IntegerField(default=5)
    report = models.ForeignKey(Report, on_delete=models.CASCADE)
    report_Data_source = models.ForeignKey(
        ReportDataSource, on_delete=models.CASCADE)
    header = models.CharField(max_length=250)
    pass_fail_aggregate = models.BooleanField(default=False)
    checkbox_only = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Report Field"
        verbose_name_plural = verbose_name + "s"

    def __str__(self):
        return f"{self.header}"


class ReportResults(models.Model):
    corporation = models.ForeignKey(
        EveCorporationInfo, on_delete=models.CASCADE)
    report = models.ForeignKey(Report, on_delete=models.CASCADE)
    results = models.TextField()
    last_update = models.DateTimeField(auto_now=True)


# Data Fields

class FieldBase(models.Model):

    name = models.CharField(max_length=500)
    description = models.CharField(max_length=500)

    class Meta:
        abstract = True

    def __str__(self):
        return f"{self.name}: {self.description}"


class ReportFieldAlts(FieldBase):
    """
        List all alts for display in report
         Options:
          - In corp only?
    """
    show_out_of_corp_alts = models.BooleanField(default=True)

    def process_field(self, users):
        co = CharacterOwnership.objects.filter(user__in=users).order_by('character__character_name').values_list(
            'user__id',
            'character__character_name',
            'character__character_id',
            "character__corporation_name",
            "character__corporation_id",
            "character__alliance_name",
            "character__alliance_id",
            "character__alliance_ticker",
            "character__corporation_ticker",
        )

        chars = defaultdict(list)
        for c in co:
            _char_url = zkillboard.character_url(c[2])
            _corp_url = zkillboard.corporation_url(c[4])
            _alli_url = zkillboard.alliance_url(c[6] if c[6] else 0)
            _str = f"<tr><td><a href='{_char_url}'>{c[1]}</a></td><td><a href='{_corp_url}'>{c[3]}</a></td>"
            if c[5]:
                _str += f"<td><a href='{_alli_url}'>{c[5]}</a></td></tr>"
            else:
                _str += f"<td></td></tr>"
            chars[c[0]].append(_str)

        output = defaultdict(lambda: {"message": "", "check": False})
        for c, char_list in chars.items():
            _msg = "".join(char_list)
            _msg = (f"<table class='table table-hover' style='white-space: nowrap;'>"
                    f"<tr><th>Character</th><th>Corporation</th><th>Alliance</th></tr>{_msg}</table>")
            output[c] = {"message": _msg, "check": True}
        return output

    class Meta:
        verbose_name = "Report Field: Character Alts"
        verbose_name_plural = verbose_name
