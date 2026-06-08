from decouple import Csv, config

from .base import *  # noqa: F403, F401

DEBUG = True
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="127.0.0.1,localhost", cast=Csv())

CORS_ALLOW_ALL_ORIGINS = True
