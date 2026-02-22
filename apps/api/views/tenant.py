from rest_framework.response import Response
from rest_framework.views import APIView

from apps.api.authentication import APIKeyAuthentication, IsAPIKeyAuthenticated


class TenantInfoView(APIView):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [IsAPIKeyAuthenticated]

    def get(self, request):
        tenant = request.user
        api_keys = tenant.api_keys.filter(status="ACTIVE").order_by("-created_at")

        return Response({
            "id": str(tenant.id),
            "name": tenant.name,
            "created_at": tenant.created_at.isoformat(),
            "api_keys": [
                {
                    "id": str(key.id),
                    "name": key.name,
                    "status": key.status,
                    "created_at": key.created_at.isoformat(),
                    "last_used_at": key.last_used_at.isoformat() if key.last_used_at else None,
                }
                for key in api_keys
            ],
        })
