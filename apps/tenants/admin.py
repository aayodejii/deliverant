from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from apps.tenants.models import Tenant, User, APIKey


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "created_at"]
    search_fields = ["name"]
    readonly_fields = ["id", "created_at"]


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["id", "username", "email", "tenant", "is_staff"]
    list_filter = ["is_staff", "is_superuser", "is_active", "tenant"]
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Tenant", {"fields": ("tenant",)}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("Tenant", {"fields": ("tenant",)}),
    )


@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display = ["id", "tenant", "name", "status", "created_at", "last_used_at"]
    list_filter = ["status", "tenant"]
    search_fields = ["name", "tenant__name"]
    readonly_fields = ["id", "key_hash", "created_at", "last_used_at"]

    def save_model(self, request, obj, form, change):
        if not change:
            api_key, raw_key = APIKey.objects.create_key(
                tenant=obj.tenant,
                name=obj.name,
            )
            self.message_user(request, f"API Key created: {raw_key}")
        else:
            super().save_model(request, obj, form, change)
