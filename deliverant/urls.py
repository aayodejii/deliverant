from django.contrib import admin
from django.urls import path, include

from apps.api.views.health import HealthView, HealthDBView, HealthRedisView, HealthWorkersView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("v1/", include("apps.api.urls")),
    path("health", HealthView.as_view(), name="health"),
    path("health/db", HealthDBView.as_view(), name="health-db"),
    path("health/redis", HealthRedisView.as_view(), name="health-redis"),
    path("health/workers", HealthWorkersView.as_view(), name="health-workers"),
    path("", include("django_prometheus.urls")),
]
