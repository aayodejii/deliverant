from rest_framework.response import Response
from rest_framework.views import APIView

from apps.api.authentication import APIKeyAuthentication, IsAPIKeyAuthenticated
from workers.kill_switch import activate, deactivate, is_active


class KillSwitchView(APIView):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [IsAPIKeyAuthenticated]

    def get(self, request):
        return Response({"active": is_active()})

    def post(self, request):
        active = request.data.get("active")
        if active is True:
            activate()
        elif active is False:
            deactivate()
        return Response({"active": is_active()})
