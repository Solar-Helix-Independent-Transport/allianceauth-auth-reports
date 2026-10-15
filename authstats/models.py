import logging
from collections import defaultdict

from solo.models import SingletonModel

from django.contrib.auth.models import Group
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils import timezone

from allianceauth.authentication.models import (
    CharacterOwnership, State, UserProfile,
)
from allianceauth.eveonline.evelinks import zkillboard
from allianceauth.eveonline.models import (
    EveAllianceInfo, EveCharacter, EveCorporationInfo,
)
from allianceauth.groupmanagement.managers import GroupManager

logger = logging.getLogger(__name__)


class AuthReportsConfiguration(SingletonModel):

    holding_corps = models.ManyToManyField(EveCorporationInfo)
    states_to_include = models.ManyToManyField(State)

    class Meta:
        verbose_name = "Auth Reports Configuration"
        permissions = (
            ('basic_access',
             'Can access reports module'),
            ('holding_corps',
             'Can access configured holding corp reports.'),
            ('own_corp',
             'Can access own corporations reports.'),
            ('own_alliance',
             'Can access own alliances reports.'),
            ('own_state',
             'Can access own states reports.'),
            ('restricted_reports',
             'Can access restricted reports.'),
            ('global_reports',
             'Can access all reports for all targets.'),
            ('own_groups',
             'Can access reports for groups they lead.'),
        )

        default_permissions = []

    def holding_corp_id_qs(self):
        return self.holding_corps.all().values('corporation_id')

    def member_corp_id_qs(self):
        return UserProfile.objects.filter(
            state__in=self.states_to_include.all()
        ).values_list("main_character__corporation_id", flat=True)

    def candidate_corps(self):
        return EveCorporationInfo.objects.filter(
            (
                models.Q(
                    corporation_id__in=self.member_corp_id_qs()
                ) |
                models.Q(
                    corporation_id__in=self.holding_corp_id_qs()
                )
            )
        )

    def candidate_alliances(self):
        # alliances of every candidate corp
        return EveAllianceInfo.objects.filter(
            evecorporationinfo__in=self.candidate_corps()
        ).distinct()

    def candidate_targets(self, target_type):
        """Every target of `target_type` reports can run against."""
        if target_type == "corp":
            return self.candidate_corps()
        if target_type == "alliance":
            return self.candidate_alliances()
        if target_type == "group":
            return Group.objects.all()
        raise ValueError(f"Unknown target type {target_type}")

    def visible_corps_for_user(self, user):
        _q = self.candidate_corps()

        # superusers get all visible
        if user.is_superuser:
            logger.debug('Returning all corps for superuser %s.' % user)
            return _q.all()

        if user.has_perm('authstats.global_reports'):
            logger.debug('Returning all corps for %s.' % user)
            return _q.all()

        try:
            char = user.profile.main_character
            assert char
            # build all accepted queries
            queries = []
            if user.has_perm('authstats.own_corp'):
                # print("corp")
                queries.append(
                    models.Q(corporation_id=char.corporation_id))

            if user.has_perm('authstats.own_alliance'):
                # print("alli")
                if char.alliance_id is not None:
                    queries.append(
                        models.Q(alliance__alliance_id=char.alliance_id))
                else:
                    queries.append(
                        models.Q(corporation_id=char.corporation_id))

            if user.has_perm('authstats.own_state'):
                # print("state")
                queries.append(
                    models.Q(
                        corporation_id__in=EveCharacter.objects.filter(
                            character_ownership__user__profile__state=user.profile.state
                        ).values("corporation_id").distinct()
                    )
                )

            if user.has_perm('authstats.holding_corps'):
                # print("holding")
                queries.append(
                    models.Q(
                        corporation_id__in=self.holding_corp_id_qs()
                    )
                )
            logger.debug('%s queries for user %s visible corporations.' %
                         (len(queries), user))

            # filter based on queries
            if len(queries) == 0:
                return _q.none()
            query = queries.pop()
            for q in queries:
                query |= q
            return _q.filter(query)

        except AssertionError:
            logger.debug(
                'User %s has no main character. Nothing visible.' % user)
            return _q.none()

    def visible_targets(self, user, target_type):
        """
            Queryset of the target objects of `target_type` this user may view.
        """
        if target_type == "corp":
            return self.visible_corps_for_user(user)
        if target_type == "alliance":
            return self.visible_alliances_for_user(user)
        if target_type == "group":
            return self.visible_groups_for_user(user)
        raise ValueError(f"Unknown target type {target_type}")

    def visible_alliances_for_user(self, user):
        _q = self.candidate_alliances()

        if user.is_superuser or user.has_perm('authstats.global_reports'):
            return _q.all()

        if not user.has_perm('authstats.own_alliance'):
            return _q.none()

        try:
            char = user.profile.main_character
            assert char and char.alliance_id
            return _q.filter(alliance_id=char.alliance_id)
        except AssertionError:
            return _q.none()

    def visible_groups_for_user(self, user):
        if user.is_superuser or user.has_perm('authstats.global_reports'):
            return self.candidate_targets("group")

        if not user.has_perm('authstats.own_groups'):
            return Group.objects.none()

        # leaders opt in via own_groups, being a leader is not enough
        return Group.objects.filter(
            pk__in=GroupManager.get_group_leaders_groups(user).values("pk")
        )


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
    restricted = models.BooleanField(default=False)
    show_character_image = models.BooleanField(default=True)
    show_for_corps = models.BooleanField(
        default=True, help_text="Available for corporation and alliance reports.")
    show_for_groups = models.BooleanField(
        default=False, help_text="Available for group reports.")
    show_in_global = models.BooleanField(
        default=False, help_text="Shown on the global overview.")

    # target type -> flag enabling a report for it
    TARGET_TYPE_FLAGS = {
        "corp": "show_for_corps",
        "alliance": "show_for_corps",
        "group": "show_for_groups",
    }

    def __str__(self):
        return self.name

    def enabled_for(self, target_type):
        return getattr(self, self.TARGET_TYPE_FLAGS[target_type])

    def enabled_target_types(self):
        return [t for t in self.TARGET_TYPE_FLAGS if self.enabled_for(t)]

    @classmethod
    def for_target_type(cls, target_type):
        return cls.objects.filter(**{cls.TARGET_TYPE_FLAGS[target_type]: True})


class ReportDataThrough(models.Model):
    # through fields
    report = models.ForeignKey(Report, on_delete=models.CASCADE)
    report_Data_source = models.ForeignKey(
        ReportDataSource, on_delete=models.CASCADE)

    # report fields
    rank = models.IntegerField(
        default=5, help_text="Order the field will be show in. Lowest First.")
    header = models.CharField(
        max_length=250, help_text="Column header show to the user.")
    long_descriptions = models.CharField(
        max_length=500, help_text="Long description shown to the user on hover of column name.", null=True, default=None, blank=True)

    pass_fail_aggregate = models.BooleanField(
        default=False, help_text="Show an aggregate of how many members pass this field in the header.")
    checkbox_only = models.BooleanField(
        default=False, help_text="Show this columns data as pass/fail checkboxes only.")
    allow_sort = models.BooleanField(
        default=True, help_text="Allow sorting of this column in the UI.")

    class Meta:
        verbose_name = "Report Field"
        verbose_name_plural = verbose_name + "s"

    def __str__(self):
        return f"{self.header}"


class ReportResults(models.Model):
    # exactly one target FK is set, see Meta.constraints
    corporation = models.ForeignKey(
        EveCorporationInfo, on_delete=models.CASCADE, null=True, blank=True)
    alliance = models.ForeignKey(
        EveAllianceInfo, on_delete=models.CASCADE, null=True, blank=True)
    group = models.ForeignKey(
        Group, on_delete=models.CASCADE, null=True, blank=True)
    report = models.ForeignKey(Report, on_delete=models.CASCADE)
    results = models.TextField()
    last_update = models.DateTimeField(auto_now=True)

    class Meta:
        # plain (unconditional) unique constraints: NULLs never collide, and
        # MySQL/MariaDB ignore conditional ones
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(corporation__isnull=False,
                             alliance__isnull=True, group__isnull=True)
                    | models.Q(corporation__isnull=True, alliance__isnull=False, group__isnull=True)
                    | models.Q(corporation__isnull=True, alliance__isnull=True, group__isnull=False)
                ),
                name="authstats_results_exactly_one_target",
            ),
            models.UniqueConstraint(
                fields=["corporation", "report"],
                name="authstats_results_unique_corporation_report",
            ),
            models.UniqueConstraint(
                fields=["alliance", "report"],
                name="authstats_results_unique_alliance_report",
            ),
            models.UniqueConstraint(
                fields=["group", "report"],
                name="authstats_results_unique_group_report",
            ),
        ]


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
