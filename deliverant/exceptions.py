from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        error_response = {
            "error": {
                "code": exc.__class__.__name__.upper(),
                "message": str(exc.detail) if hasattr(exc, "detail") else str(exc),
                "details": {},
            }
        }

        if hasattr(exc, "detail"):
            if isinstance(exc.detail, dict):
                error_response["error"]["details"] = exc.detail
            elif isinstance(exc.detail, list):
                error_response["error"]["details"] = {"errors": exc.detail}

        response.data = error_response

    return response
