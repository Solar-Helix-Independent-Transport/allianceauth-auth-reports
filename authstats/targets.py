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
    # order targets of this type are listed in
    ordering = ()

    @classmethod
    def candidate_qs(cls, conf):
        """Every object of this type reports can run against."""
        raise NotImplementedError

    @classmethod
    def visible_qs(cls, conf, user):
        """Objects of this type `user` may view."""
        raise NotImplementedError

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

    def unknowns_extras(self):
        """Target specific data merged into the unknowns output."""
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

    def listing_dict(self):
        """as_dict plus what the target picker shows."""
        return self.as_dict()


class CorpTarget(ReportTarget):
    target_type = "corp"
    results_field = "corporation"
    ordering = ("corporation_name",)

    @classmethod
    def candidate_qs(cls, conf):
        return conf.candidate_corps()

    @classmethod
    def visible_qs(cls, conf, user):
        return conf.visible_corps_for_user(user).select_related("alliance")

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

    def listing_dict(self):
        parent = AllianceTarget(
            self.obj.alliance).listing_dict() if self.obj.alliance else None
        return {**self.as_dict(), "ticker": self.obj.corporation_ticker, "parent": parent}

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
    ordering = ("alliance_name",)

    @classmethod
    def candidate_qs(cls, conf):
        return conf.candidate_alliances()

    @classmethod
    def visible_qs(cls, conf, user):
        return conf.visible_alliances_for_user(user)

    @classmethod
    def get(cls, target_id):
        return cls(EveAllianceInfo.objects.get(alliance_id=target_id))

    @property
    def target_id(self):
        return self.obj.alliance_id

    @property
    def label(self):
        return self.obj.alliance_name

    def listing_dict(self):
        return {**self.as_dict(), "ticker": self.obj.alliance_ticker}

    def _member_corp_ids(self):
        """
            Candidate corps in the alliance. Corps that are not candidates are
            hidden from corp reports, so the alliance report must hide them too.
        """
        from authstats.models import AuthReportsConfiguration
        return list(AuthReportsConfiguration.get_solo().candidate_corps().filter(
            alliance=self.obj
        ).values_list("corporation_id", flat=True))

    def mains(self):
        return get_alliance_main_queryset(self.target_id).filter(
            profile__main_character__corporation_id__in=self._member_corp_ids()
        )

    has_unknowns = True

    def _corps_by_token(self):
        """(corps with a membership token, corps without one), checked once."""
        if not hasattr(self, "_token_split"):
            with_token, without_token = [], []
            for corp_id in self._member_corp_ids():
                if get_membership_tokens(corp_id).exists():
                    with_token.append(corp_id)
                else:
                    without_token.append(corp_id)
            self._token_split = (with_token, without_token)
        return self._token_split

    def unknown_character_ids(self):
        unknowns = set()
        for corp_id in self._corps_by_token()[0]:
            unknowns |= set(find_unknown_character_ids(corp_id))
        return unknowns

    def corps_without_token(self):
        return len(self._corps_by_token()[1])

    def orphans(self):
        return get_alliance_orphan_queryset(self.target_id).filter(
            corporation_id__in=self._member_corp_ids()
        )

    def extras(self):
        return {"unknowns": len(self.unknown_character_ids()) + self.orphans().count(),
                **self.unknowns_extras()}

    def unknowns_extras(self):
        return {"corps_without_token": self.corps_without_token()}


class GroupTarget(ReportTarget):
    target_type = "group"
    results_field = "group"
    priority = 7
    ordering = ("name",)

    @classmethod
    def candidate_qs(cls, conf):
        return conf.candidate_groups()

    @classmethod
    def visible_qs(cls, conf, user):
        return conf.visible_groups_for_user(user)

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
