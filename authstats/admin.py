from solo.admin import SingletonModelAdmin

from django.contrib import admin
from django.utils.html import format_html

from .models import (
    AuthReportsConfiguration, Report, ReportDataSource, ReportDataThrough,
    ReportFieldAlts, ReportFieldLastLogin,
)


class ReportDataFieldThroughAdmin(admin.StackedInline):
    model = ReportDataThrough


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ["name", "restricted", "show_for_corps",
                    "show_for_groups", "show_in_global"]
    inlines = [
        ReportDataFieldThroughAdmin,
    ]


admin.site.register(ReportDataSource)
admin.site.register(ReportFieldAlts)
admin.site.register(ReportFieldLastLogin)

admin.site.register(AuthReportsConfiguration, SingletonModelAdmin)
