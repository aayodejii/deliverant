from django.urls import path

from apps.api.views.analytics import (
    DeliveryVolumeView,
    EndpointHealthView,
    LatencyDistributionView,
    SuccessRateView,
)
from apps.api.views.deliveries import DeliveryListView, DeliveryDetailView, DeliveryCancelView
from apps.api.views.endpoints import EndpointListCreateView, EndpointDetailView
from apps.api.views.events import EventCreateView
from apps.api.views.replays import ReplayCreateView

urlpatterns = [
    path("endpoints", EndpointListCreateView.as_view(), name="endpoint-list"),
    path("endpoints/<uuid:endpoint_id>", EndpointDetailView.as_view(), name="endpoint-detail"),
    path("events", EventCreateView.as_view(), name="event-create"),
    path("deliveries", DeliveryListView.as_view(), name="delivery-list"),
    path("deliveries/<uuid:delivery_id>", DeliveryDetailView.as_view(), name="delivery-detail"),
    path("deliveries/<uuid:delivery_id>/cancel", DeliveryCancelView.as_view(), name="delivery-cancel"),
    path("replays", ReplayCreateView.as_view(), name="replay-create"),
    path("analytics/delivery-volume", DeliveryVolumeView.as_view(), name="analytics-delivery-volume"),
    path("analytics/success-rate", SuccessRateView.as_view(), name="analytics-success-rate"),
    path("analytics/latency-distribution", LatencyDistributionView.as_view(), name="analytics-latency-distribution"),
    path("analytics/endpoint-health", EndpointHealthView.as_view(), name="analytics-endpoint-health"),
]
