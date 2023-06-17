from allianceauth import hooks
from allianceauth.services.hooks import MenuItemHook, UrlHook
from django.utils.translation import gettext_lazy as _

from . import app_settings, models, urls

# class AuthStats(MenuItemHook):
#     def __init__(self):

#         MenuItemHook.__init__(self,
#                               app_settings.AUTHSTATS_APP_NAME,
#                               'far fa-eye fa-fw',
#                               'authstats:react',
#                               navactive=['authstats:react', 'authstats:view'])

#     def render(self, request):
#         if request.user.has_perm('authstats.permsomething'):
#             return MenuItemHook.render(self, request)
#         return ''


@hooks.register('url_hook')
def register_url():
    return UrlHook(urls, 'authstats', r'^reports/')


@hooks.register("secure_group_filters")
def filters():
    return [models.ReportFieldAlts]


@hooks.register('discord_cogs_hook')
def register_cogs():
    return []
