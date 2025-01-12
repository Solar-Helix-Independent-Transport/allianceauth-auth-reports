from django.utils.translation import gettext_lazy as _

from allianceauth import hooks
from allianceauth.services.hooks import MenuItemHook, UrlHook

from . import app_settings, models, urls


class AuthStats(MenuItemHook):
    def __init__(self):

        MenuItemHook.__init__(self,
                              app_settings.AUTHSTATS_APP_NAME,
                              'fas fa-book-open fa-fw',
                              'authstats:base',
                              navactive=['authstats:base'])

    def render(self, request):
        if request.user.has_perm('authstats.basic_access'):
            return MenuItemHook.render(self, request)
        return ''


@hooks.register('menu_item_hook')
def register_menu():
    return AuthStats()


@hooks.register('url_hook')
def register_url():
    return UrlHook(urls, 'authstats', r'^reports/')


@hooks.register("secure_group_filters")
def filters():
    return [models.ReportFieldAlts]


@hooks.register('discord_cogs_hook')
def register_cogs():
    return []
