from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.api.authentication import APIKeyAuthentication, IsAPIKeyAuthenticated
from apps.api.serializers.replays import ReplayCreateSerializer
from apps.deliveries.models import Delivery
from apps.replays.models import DeliveryBatch, DeliveryBatchItem


class ReplayCreateView(APIView):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [IsAPIKeyAuthenticated]

    def post(self, request):
        serializer = ReplayCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        delivery_ids = serializer.validated_data["delivery_ids"]
        dry_run = serializer.validated_data["dry_run"]
        tenant = request.user

        if len(delivery_ids) > settings.MAX_REPLAY_BATCH_SIZE:
            return Response(
                {
                    "error": {
                        "code": "BATCH_TOO_LARGE",
                        "message": f"Max batch size is {settings.MAX_REPLAY_BATCH_SIZE}",
                        "details": {},
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        source_deliveries = Delivery.objects.filter(
            id__in=delivery_ids, tenant=tenant
        ).select_related("event", "endpoint")

        found_ids = set(str(d.id) for d in source_deliveries)
        missing = set(str(id) for id in delivery_ids) - found_ids
        if missing:
            return Response(
                {
                    "error": {
                        "code": "NOT_FOUND",
                        "message": f"Deliveries not found: {', '.join(missing)}",
                        "details": {},
                    }
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        batch = DeliveryBatch.objects.create(
            tenant=tenant,
            dry_run=dry_run,
            requested_by=request.auth,
        )

        created_count = 0
        for source in source_deliveries:
            created_delivery = None

            if not dry_run:
                created_delivery = Delivery.objects.create(
                    tenant=tenant,
                    event=source.event,
                    endpoint=source.endpoint,
                    mode=Delivery.Mode.RELIABLE,
                    status=Delivery.Status.PENDING,
                )
                created_count += 1

            DeliveryBatchItem.objects.create(
                batch=batch,
                source_delivery=source,
                endpoint=source.endpoint,
                created_delivery=created_delivery,
            )

        if not dry_run:
            created_count = source_deliveries.count()

        batch.created_deliveries_count = created_count
        batch.status = DeliveryBatch.Status.COMPLETED
        batch.save(update_fields=["created_deliveries_count", "status"])

        return Response(
            {
                "batch_id": str(batch.id),
                "created_deliveries": created_count,
                "dry_run": dry_run,
            },
            status=status.HTTP_201_CREATED,
        )
