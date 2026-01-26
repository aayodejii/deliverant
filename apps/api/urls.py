from django.urls import path

from apps.api.views.endpoints import EndpointListCreateView, EndpointDetailView

urlpatterns = [
    path("endpoints", EndpointListCreateView.as_view(), name="endpoint-list"),
    path("endpoints/<uuid:endpoint_id>", EndpointDetailView.as_view(), name="endpoint-detail"),
]
