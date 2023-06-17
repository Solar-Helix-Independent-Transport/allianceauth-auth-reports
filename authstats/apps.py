from django.apps import AppConfig

from . import __version__


class AuthStatsConfig(AppConfig):
    name = 'authstats'
    label = 'authstats'

    verbose_name = f"Auth Reports v{__version__}"

    def ready(self):
        import authstats.signals
