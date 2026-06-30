from .base import *  # noqa: F403, F401
import dj_database_url
from decouple import config

DEBUG = False

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Whitenoise pour servir les fichiers statiques
MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")  # noqa: F405
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Base de données via DATABASE_URL (fournie par Render)
DATABASE_URL = config("DATABASE_URL", default=None)
if DATABASE_URL:
    DATABASES = {  # noqa: F405
        "default": dj_database_url.parse(DATABASE_URL, conn_max_age=600)
    }

# CORS : autoriser le frontend GitHub Pages
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="https://dijajaja.github.io",
).split(",")
