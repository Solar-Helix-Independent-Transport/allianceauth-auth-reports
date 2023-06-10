from django.conf import settings

AUTHSTATS_APP_NAME = getattr(settings, "AUTHSTATS_APP_NAME", "Auth Reports")
