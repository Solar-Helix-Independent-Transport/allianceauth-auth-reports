import logging

from allianceauth import hooks
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models.signals import m2m_changed, post_save, pre_delete
from django.dispatch import Signal, receiver

from . import models

# signals go here


logger = logging.getLogger(__name__)


class hook_cache:
    all_hooks = None

    def get_hooks(self):
        if self.all_hooks is None:
            hook_array = set()
            # todo add same functionality to a report source kinds thingo
            _hooks = hooks.get_hooks("secure_group_filters")
            for app_hook in _hooks:
                for filter_model in app_hook():
                    if filter_model not in hook_array:
                        hook_array.add(filter_model)
            self.all_hooks = hook_array
        return self.all_hooks


filters = hook_cache()


def new_filter(sender, instance, created, **kwargs):
    try:
        if created:
            models.ReportDataSource.objects.create(filter_object=instance)
        else:
            # this is an updated model we dont at this stage care about this.
            pass
    except:
        logger.error("Bah Humbug")  # we failed! do something here


def rem_filter(sender, instance, **kwargs):
    try:
        models.ReportDataSource.objects.get(
            object_id=instance.pk, content_type__model=instance.__class__.__name__
        ).delete()
    except:
        logger.error("Bah Humbug")  # we failed! do something here


for _filter in filters.get_hooks():
    post_save.connect(new_filter, sender=_filter)
    pre_delete.connect(rem_filter, sender=_filter)


def purge_cached_reports(sender, instance, created, **kwargs):
    """
    Clear any cached data if a report gets updated/changed/what ever...
    """
    if not created:
        models.ReportResults.objects.filter(report_id=instance.id).delete()


post_save.connect(purge_cached_reports, sender=models.Report)
