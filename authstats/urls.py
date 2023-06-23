from django.urls import include, path, re_path

from . import app_settings, views
from .api import api

app_name = 'authstats'

urlpatterns = [
    re_path(r'^api/', api.urls),
    re_path(r'^add_corp_token/', views.add_corp, name="add_corp"),
    path('show/', views.react_redirect, name='base'),
    path('show/<int:cid>/<int:rid>/', views.react_main, name='report'),
]
