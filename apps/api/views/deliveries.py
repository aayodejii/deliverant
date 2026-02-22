from datetime import datetime

from django.db.models import Q
from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.api.authentication import APIKeyAuthentication, IsAPIKeyAuthenticated
from apps.api.serializers.deliveries import DeliverySerializer, DeliveryDetailSerializer
from apps.deliveries.models import Delivery
from apps.deliveries.state_machine import DeliveryStateMachine

PAGE_SIZE = 20


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

        search = request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(event__type__icontains=search) | Q(endpoint__name__icontains=search)
            )

        cursor = request.query_params.get("cursor")
        if cursor:
            cursor_dt = parse_datetime(cursor)
            if cursor_dt:
                queryset = queryset.filter(created_at__lt=cursor_dt)

        limit = min(int(request.query_params.get("limit", PAGE_SIZE)), 100)
        queryset = queryset.order_by("-created_at")[: limit + 1]
        results = list(queryset)

        has_more = len(results) > limit
        if has_more:
            results = results[:limit]

        serializer = DeliverySerializer(results, many=True)

        response_data = {
            "results": serializer.data,
            "has_more": has_more,
            "next_cursor": results[-1].created_at.isoformat() if has_more and results else None,
        }

        return Response(response_data)


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

        try:
            DeliveryStateMachine.cancel(delivery)
        except ValueError as e:
            return Response(
                {
                    "error": {
                        "code": "INVALID_STATE",
                        "message": str(e),
                        "details": {},
                    }
                },
                status=status.HTTP_409_CONFLICT,
            )

        return Response({"status": "cancelled", "delivery_id": str(delivery.id)})
