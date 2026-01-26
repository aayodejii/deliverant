from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.api.authentication import APIKeyAuthentication, IsAPIKeyAuthenticated
from apps.api.serializers.endpoints import EndpointSerializer, EndpointCreateSerializer, EndpointUpdateSerializer
from apps.endpoints.models import Endpoint


class EndpointListCreateView(APIView):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [IsAPIKeyAuthenticated]

    def get(self, request):
        endpoints = Endpoint.objects.filter(tenant=request.user)
        serializer = EndpointSerializer(endpoints, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = EndpointCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        endpoint = serializer.save()
        return Response(EndpointSerializer(endpoint).data, status=status.HTTP_201_CREATED)


class EndpointDetailView(APIView):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [IsAPIKeyAuthenticated]

    def get_object(self, request, endpoint_id):
        try:
            return Endpoint.objects.get(id=endpoint_id, tenant=request.user)
        except Endpoint.DoesNotExist:
            return None

    def get(self, request, endpoint_id):
        endpoint = self.get_object(request, endpoint_id)
        if endpoint is None:
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "Endpoint not found", "details": {}}},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = EndpointSerializer(endpoint)
        return Response(serializer.data)

    def patch(self, request, endpoint_id):
        endpoint = self.get_object(request, endpoint_id)
        if endpoint is None:
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "Endpoint not found", "details": {}}},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = EndpointUpdateSerializer(endpoint, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        endpoint = serializer.save()
        return Response(EndpointSerializer(endpoint).data)

    def delete(self, request, endpoint_id):
        endpoint = self.get_object(request, endpoint_id)
        if endpoint is None:
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "Endpoint not found", "details": {}}},
                status=status.HTTP_404_NOT_FOUND,
            )
        endpoint.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
