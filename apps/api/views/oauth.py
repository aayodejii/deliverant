from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.api.authentication import APIKeyAuthentication, IsAPIKeyAuthenticated
from apps.tenants.models import APIKey, Tenant, User


class OAuthProvisionView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        internal_secret = request.headers.get("X-Internal-Secret")
        if internal_secret != settings.INTERNAL_API_SECRET:
            return Response(
                {"error": {"code": "FORBIDDEN", "message": "Invalid internal secret"}},
                status=status.HTTP_403_FORBIDDEN,
            )

        email = request.data.get("email")
        name = request.data.get("name", "")
        provider = request.data.get("provider")
        provider_account_id = request.data.get("provider_account_id")

        if not email or not provider or not provider_account_id:
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "email, provider, and provider_account_id are required"}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email=email).first()

        if user is None:
            tenant_name = name or email.split("@")[0]
            base_name = tenant_name
            counter = 1
            while Tenant.objects.filter(name=tenant_name).exists():
                tenant_name = f"{base_name}-{counter}"
                counter += 1

            tenant = Tenant.objects.create(name=tenant_name)
            user = User.objects.create(
                username=email,
                email=email,
                first_name=name.split()[0] if name else "",
                last_name=" ".join(name.split()[1:]) if name and len(name.split()) > 1 else "",
                tenant=tenant,
            )
        else:
            tenant = user.tenant
            if tenant is None:
                tenant_name = name or email.split("@")[0]
                base_name = tenant_name
                counter = 1
                while Tenant.objects.filter(name=tenant_name).exists():
                    tenant_name = f"{base_name}-{counter}"
                    counter += 1
                tenant = Tenant.objects.create(name=tenant_name)
                user.tenant = tenant
                user.save(update_fields=["tenant"])

        APIKey.objects.filter(
            tenant=tenant, name="oauth-dashboard", status=APIKey.Status.ACTIVE
        ).update(status=APIKey.Status.REVOKED)

        _, raw_key = APIKey.objects.create_key(tenant=tenant, name="oauth-dashboard")

        return Response({
            "api_key": raw_key,
            "user_id": str(user.id),
            "tenant_id": str(tenant.id),
            "tenant_name": tenant.name,
        })


class RevokeSessionView(APIView):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [IsAPIKeyAuthenticated]

    def post(self, request):
        request.auth.revoke()
        return Response({"ok": True})
