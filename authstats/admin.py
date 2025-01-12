from solo.admin import SingletonModelAdmin

from django.contrib import admin
from django.utils.html import format_html

from .models import (
    AuthReportsConfiguration, Report, ReportDataSource, ReportDataThrough,
    ReportFieldAlts,
)


class ReportDataFieldThroughAdmin(admin.StackedInline):
    model = ReportDataThrough


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    inlines = [
        ReportDataFieldThroughAdmin,
    ]


admin.site.register(ReportDataSource)
admin.site.register(ReportFieldAlts)

admin.site.register(AuthReportsConfiguration, SingletonModelAdmin)
