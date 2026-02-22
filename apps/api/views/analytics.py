from datetime import timedelta

from django.db.models import Count, Avg, Q
from django.db.models.functions import TruncHour
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.api.authentication import APIKeyAuthentication, IsAPIKeyAuthenticated
from apps.attempts.models import Attempt
from apps.deliveries.models import Delivery
from apps.endpoints.models import Endpoint


class DeliveryVolumeView(APIView):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [IsAPIKeyAuthenticated]

    def get(self, request):
        hours = min(int(request.query_params.get("hours", 24)), 168)
        since = timezone.now() - timedelta(hours=hours)

        rows = (
            Delivery.objects.filter(tenant=request.user, created_at__gte=since)
            .annotate(hour=TruncHour("created_at"))
            .values("hour")
            .annotate(
                total=Count("id"),
                delivered=Count("id", filter=Q(status="DELIVERED")),
                failed=Count("id", filter=Q(status="FAILED")),
            )
            .order_by("hour")
        )

        data = [
            {
                "hour": row["hour"].isoformat(),
                "total": row["total"],
                "delivered": row["delivered"],
                "failed": row["failed"],
            }
            for row in rows
        ]

        return Response(data)


class SuccessRateView(APIView):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [IsAPIKeyAuthenticated]

    def get(self, request):
        hours = min(int(request.query_params.get("hours", 24)), 168)
        since = timezone.now() - timedelta(hours=hours)

        rows = (
            Delivery.objects.filter(
                tenant=request.user,
                created_at__gte=since,
                status__in=["DELIVERED", "FAILED"],
            )
            .annotate(hour=TruncHour("created_at"))
            .values("hour")
            .annotate(
                total=Count("id"),
                delivered=Count("id", filter=Q(status="DELIVERED")),
            )
            .order_by("hour")
        )

        data = [
            {
                "hour": row["hour"].isoformat(),
                "rate": round((row["delivered"] / row["total"]) * 100, 1) if row["total"] > 0 else 0,
                "total": row["total"],
            }
            for row in rows
        ]

        return Response(data)


class LatencyDistributionView(APIView):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [IsAPIKeyAuthenticated]

    def get(self, request):
        since = timezone.now() - timedelta(hours=24)

        attempts = Attempt.objects.filter(
            tenant=request.user,
            started_at__gte=since,
            latency_ms__isnull=False,
        ).values_list("latency_ms", flat=True)

        buckets = [
            {"label": "<100ms", "min": 0, "max": 100},
            {"label": "100-300ms", "min": 100, "max": 300},
            {"label": "300-500ms", "min": 300, "max": 500},
            {"label": "500ms-1s", "min": 500, "max": 1000},
            {"label": "1-3s", "min": 1000, "max": 3000},
            {"label": "3-5s", "min": 3000, "max": 5000},
            {"label": ">5s", "min": 5000, "max": float("inf")},
        ]

        counts = {b["label"]: 0 for b in buckets}
        for ms in attempts:
            for b in buckets:
                if b["min"] <= ms < b["max"]:
                    counts[b["label"]] += 1
                    break

        data = [{"bucket": label, "count": count} for label, count in counts.items()]
        return Response(data)


class EndpointHealthView(APIView):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [IsAPIKeyAuthenticated]

    def get(self, request):
        since = timezone.now() - timedelta(hours=24)
        endpoints = Endpoint.objects.filter(tenant=request.user)

        data = []
        for ep in endpoints:
            stats = Delivery.objects.filter(
                endpoint=ep,
                created_at__gte=since,
                status__in=["DELIVERED", "FAILED"],
            ).aggregate(
                total=Count("id"),
                delivered=Count("id", filter=Q(status="DELIVERED")),
                avg_latency=Avg("attempts__latency_ms"),
            )

            data.append({
                "endpoint_id": str(ep.id),
                "name": ep.name,
                "status": ep.status,
                "total": stats["total"] or 0,
                "delivered": stats["delivered"] or 0,
                "success_rate": round((stats["delivered"] / stats["total"]) * 100, 1) if stats["total"] else 0,
                "avg_latency_ms": round(stats["avg_latency"] or 0),
            })

        return Response(data)
