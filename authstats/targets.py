"""
    Report targets: what a report is run against.

    Each target type knows who its members are and how its results are
    stored; `run_report` only ever talks to this interface.
"""
import logging

from django.contrib.auth.models import Group

from allianceauth.eveonline.models import EveAllianceInfo, EveCorporationInfo

from authstats.utils import (
    find_unknown_character_ids, get_alliance_main_queryset,
    get_alliance_orphan_queryset, get_main_queryset, get_membership_tokens,
    get_orphan_queryset,
)

logger = logging.getLogger(__name__)


class ReportTarget:
    target_type = None
    # has an ESI membership roster to compare auth against
    has_unknowns = False
    # the ReportResults FK holding this target type
    results_field = None
    # celery priority for this target's report runs, AA default is 5
    priority = 5

    def __init__(self, obj):
        self.obj = obj

    @property
    def target_id(self):
        raise NotImplementedError

    @property
    def key(self):
        return (self.target_type, self.target_id)

    @property
    def label(self):
        raise NotImplementedError

    def mains(self):
        """User queryset, one row per report line."""
        raise NotImplementedError

    def extras(self):
        """Target specific counts merged into the report output."""
        return {}

    def results_filter(self):
        """kwargs selecting this target's ReportResults rows."""
        return {self.results_field: self.obj}

    def is_visible_to(self, user):
        from authstats.models import AuthReportsConfiguration
        return AuthReportsConfiguration.get_solo().visible_targets(
            user, self.target_type
        ).filter(pk=self.obj.pk).exists()

    def as_dict(self):
        return {"type": self.target_type, "id": self.target_id, "name": self.label}


class CorpTarget(ReportTarget):
    target_type = "corp"
    results_field = "corporation"

    @classmethod
    def get(cls, target_id):
        return cls(EveCorporationInfo.objects.get(corporation_id=target_id))

    @property
    def target_id(self):
        return self.obj.corporation_id

    @property
    def label(self):
        return self.obj.corporation_name

    def mains(self):
        return get_main_queryset(self.target_id)

    has_unknowns = True

    def unknown_character_ids(self):
        return set(find_unknown_character_ids(self.target_id))

    def orphans(self):
        return get_orphan_queryset(self.target_id)

    def extras(self):
        return {"unknowns": len(self.unknown_character_ids()) + self.orphans().count()}


class AllianceTarget(ReportTarget):
    target_type = "alliance"
    results_field = "alliance"
    priority = 7

    @classmethod
    def get(cls, target_id):
        return cls(EveAllianceInfo.objects.get(alliance_id=target_id))

    @property
    def target_id(self):
        return self.obj.alliance_id

    @property
    def label(self):
        return self.obj.alliance_name

    def mains(self):
        return get_alliance_main_queryset(self.target_id)

    has_unknowns = True

    def _member_corp_ids(self):
        return EveCorporationInfo.objects.filter(
            alliance=self.obj
        ).values_list("corporation_id", flat=True)

    def unknown_character_ids(self):
        unknowns = set()
        for corp_id in self._member_corp_ids():
            if get_membership_tokens(corp_id).exists():
                unknowns |= set(find_unknown_character_ids(corp_id))
        return unknowns

    def corps_without_token(self):
        return sum(
            1 for corp_id in self._member_corp_ids()
            if not get_membership_tokens(corp_id).exists()
        )

    def orphans(self):
        return get_alliance_orphan_queryset(self.target_id)

    def extras(self):
        return {"unknowns": len(self.unknown_character_ids()) + self.orphans().count(),
                "corps_without_token": self.corps_without_token()}


class GroupTarget(ReportTarget):
    target_type = "group"
    results_field = "group"
    priority = 7

    @classmethod
    def get(cls, target_id):
        return cls(Group.objects.get(pk=target_id))

    @property
    def target_id(self):
        return self.obj.pk

    @property
    def label(self):
        return self.obj.name

    def mains(self):
        return self.obj.user_set.filter(profile__main_character__isnull=False)

    def extras(self):
        return {"members_without_main": self.obj.user_set.filter(
            profile__main_character__isnull=True).count()}


TARGET_TYPES = {
    CorpTarget.target_type: CorpTarget,
    AllianceTarget.target_type: AllianceTarget,
    GroupTarget.target_type: GroupTarget,
}


def target_for_results(results):
    """The target a ReportResults row belongs to."""
    for target_cls in TARGET_TYPES.values():
        obj = getattr(results, target_cls.results_field)
        if obj is not None:
            return target_cls(obj)
    raise ValueError(f"ReportResults {results.pk} has no known target")


def get_target(target_type, target_id):
    """
        Build a target from its key. Raises KeyError for an unknown type and
        the model's DoesNotExist for an unknown id.
    """
    return TARGET_TYPES[target_type].get(target_id)
