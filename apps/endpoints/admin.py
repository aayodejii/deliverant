from django.contrib import admin

from apps.endpoints.models import Endpoint


@admin.register(Endpoint)
class EndpointAdmin(admin.ModelAdmin):
    list_display = ["id", "tenant", "name", "url", "status", "created_at"]
    list_filter = ["status", "tenant"]
    search_fields = ["name", "url", "tenant__name"]
    readonly_fields = ["id", "paused_at", "created_at", "updated_at"]
