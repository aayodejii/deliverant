from rest_framework import authentication
from rest_framework import exceptions

from apps.tenants.models import APIKey


class APIKeyAuthentication(authentication.BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")

        if not auth_header:
            return None

        parts = auth_header.split()

        if len(parts) != 2 or parts[0] != self.keyword:
            return None

        raw_key = parts[1]
        api_key = APIKey.get_from_key(raw_key)

        if api_key is None:
            raise exceptions.AuthenticationFailed("Invalid API key")

        api_key.update_last_used()

        return (api_key.tenant, api_key)

    def authenticate_header(self, request):
        return self.keyword
