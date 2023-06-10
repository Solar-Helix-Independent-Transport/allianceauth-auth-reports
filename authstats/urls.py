from django.urls import include, re_path

from . import app_settings, views
from .api import api

app_name = 'authstats'

urlpatterns = [
    re_path(r'^api/', api.urls),
]
