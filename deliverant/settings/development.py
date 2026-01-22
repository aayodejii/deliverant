from .base import *

DEBUG = True

ALLOWED_HOSTS = ["*"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env("DB_NAME", default="deliverant"),
        "USER": env("DB_USER", default="deliverant"),
        "PASSWORD": env("DB_PASSWORD", default="deliverant"),
        "HOST": env("DB_HOST", default="localhost"),
        "PORT": env("DB_PORT", default="5432"),
    }
}

CORS_ALLOW_ALL_ORIGINS = True
