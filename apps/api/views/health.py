from django.db import connection
from django.core.cache import cache
from rest_framework.response import Response
from rest_framework.views import APIView

from deliverant.celery import app


class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        db_ok = self._check_db()
        redis_ok = self._check_redis()

        healthy = db_ok and redis_ok
        status_code = 200 if healthy else 503

        return Response({
            "status": "healthy" if healthy else "unhealthy",
            "checks": {
                "database": "ok" if db_ok else "error",
                "redis": "ok" if redis_ok else "error",
            },
        }, status=status_code)

    def _check_db(self):
        try:
            connection.ensure_connection()
            return True
        except Exception:
            return False

    def _check_redis(self):
        try:
            cache.set("health_check", "ok", timeout=5)
            return cache.get("health_check") == "ok"
        except Exception:
            return False


class HealthDBView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        try:
            connection.ensure_connection()
            return Response({"status": "ok"})
        except Exception as e:
            return Response({"status": "error", "detail": str(e)}, status=503)


class HealthRedisView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        try:
            cache.set("health_check", "ok", timeout=5)
            if cache.get("health_check") == "ok":
                return Response({"status": "ok"})
            return Response({"status": "error", "detail": "read failed"}, status=503)
        except Exception as e:
            return Response({"status": "error", "detail": str(e)}, status=503)


class HealthWorkersView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        try:
            inspect = app.control.inspect(timeout=2.0)
            active = inspect.active()
            if active is None:
                return Response({"status": "error", "detail": "no workers responding"}, status=503)
            workers = {name: len(tasks) for name, tasks in active.items()}
            return Response({"status": "ok", "workers": workers})
        except Exception as e:
            return Response({"status": "error", "detail": str(e)}, status=503)
