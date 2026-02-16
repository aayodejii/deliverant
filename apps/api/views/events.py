from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.api.authentication import APIKeyAuthentication, IsAPIKeyAuthenticated
from apps.api.serializers.events import EventCreateSerializer


class EventCreateView(APIView):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [IsAPIKeyAuthenticated]

    def post(self, request):
        serializer = EventCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        try:
            result = serializer.save()
        except ValidationError as e:
            if "idempotency_key" in e.detail and "different payload" in str(e.detail):
                return Response(
                    {
                        "error": {
                            "code": "IDEMPOTENCY_KEY_CONFLICT",
                            "message": "Idempotency key reused with different payload",
                            "details": e.detail,
                        }
                    },
                    status=status.HTTP_409_CONFLICT,
                )
            raise

        event = result["event"]
        deliveries_data = [
            {
                "delivery_id": str(d["delivery"].id),
                "endpoint_id": str(d["delivery"].endpoint_id),
                "created": d["created"],
            }
            for d in result["deliveries"]
        ]

        return Response(
            {
                "event_id": str(event.id),
                "deliveries": deliveries_data,
            },
            status=status.HTTP_202_ACCEPTED,
        )
