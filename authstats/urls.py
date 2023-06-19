from django.urls import include, re_path

from . import app_settings, views
from .api import api

app_name = 'authstats'

urlpatterns = [
    re_path(r'^api/', api.urls),
    re_path(r'^add_corp_token/', views.add_corp, name="add_corp"),
    re_path(r'^/', views.react_main, name='base'),
]
