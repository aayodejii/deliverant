from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.api.authentication import APIKeyAuthentication, IsAPIKeyAuthenticated
from apps.api.serializers.deliveries import DeliverySerializer, DeliveryDetailSerializer
from apps.deliveries.models import Delivery


class DeliveryListView(APIView):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [IsAPIKeyAuthenticated]

    def get(self, request):
        queryset = Delivery.objects.filter(tenant=request.user).select_related("endpoint", "event")

        delivery_status = request.query_params.get("status")
        if delivery_status:
            queryset = queryset.filter(status=delivery_status)

        endpoint_id = request.query_params.get("endpoint_id")
        if endpoint_id:
            queryset = queryset.filter(endpoint_id=endpoint_id)

        event_id = request.query_params.get("event_id")
        if event_id:
            queryset = queryset.filter(event_id=event_id)

        queryset = queryset.order_by("-created_at")[:100]

        serializer = DeliverySerializer(queryset, many=True)
        return Response(serializer.data)


class DeliveryDetailView(APIView):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [IsAPIKeyAuthenticated]

    def get_object(self, request, delivery_id):
        try:
            return Delivery.objects.select_related("endpoint", "event").prefetch_related(
                "attempts"
            ).get(id=delivery_id, tenant=request.user)
        except Delivery.DoesNotExist:
            return None

    def get(self, request, delivery_id):
        delivery = self.get_object(request, delivery_id)
        if delivery is None:
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "Delivery not found", "details": {}}},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = DeliveryDetailSerializer(delivery)
        return Response(serializer.data)


class DeliveryCancelView(APIView):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [IsAPIKeyAuthenticated]

    def post(self, request, delivery_id):
        try:
            delivery = Delivery.objects.get(id=delivery_id, tenant=request.user)
        except Delivery.DoesNotExist:
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "Delivery not found", "details": {}}},
                status=status.HTTP_404_NOT_FOUND,
            )

        if delivery.is_terminal:
            return Response(
                {
                    "error": {
                        "code": "INVALID_STATE",
                        "message": f"Cannot cancel delivery in {delivery.status} state",
                        "details": {},
                    }
                },
                status=status.HTTP_409_CONFLICT,
            )

        delivery.status = Delivery.Status.CANCELLED
        delivery.terminal_at = timezone.now()
        delivery.terminal_reason = "Cancelled by user"
        delivery.save(update_fields=["status", "terminal_at", "terminal_reason", "updated_at"])

        return Response({"status": "cancelled", "delivery_id": str(delivery.id)})
