from django.contrib import admin
from django.utils.html import format_html

from .models import (Report, ReportDataSource, ReportDataThrough,
                     ReportFieldAlts)


class ReportDataFieldThroughAdmin(admin.StackedInline):
    model = ReportDataThrough


class ReportAdmin(admin.ModelAdmin):
    inlines = [
        ReportDataFieldThroughAdmin,
    ]


admin.site.register(Report, ReportAdmin)

admin.site.register(ReportDataSource)
admin.site.register(ReportFieldAlts)
