from django.urls import include, path, re_path

from . import app_settings, views
from .api import api

app_name = 'authstats'

urlpatterns = [
    re_path(r'^api/', api.urls),
    re_path(r'^add_corp_token/', views.add_corp, name="add_corp"),
    path('show/', views.react_redirect, name='base'),
    # legacy corp route, still used by the AA4 UI
    path('show/<int:cid>/<int:rid>/', views.react_main, name='report'),
    path('show/<str:target_type>/<int:tid>/<int:rid>/',
         views.react_main, name='target_report'),
    path('overview/', views.react_main, name='overview'),
    path('overview/<int:rid>/', views.react_main, name='overview_report'),
]
