"""
Alliance Auth Test Suite Django settings.
"""

import os

from allianceauth.project_template.project_name.settings.base import *  # noqa

SITE_URL = "https://example.com"
CSRF_TRUSTED_ORIGINS = [SITE_URL]

# Celery configuration
CELERY_ALWAYS_EAGER = True  # Forces celery to run locally for testing

INSTALLED_APPS += [
    'allianceauth.eveonline.autogroups',
    'authstats'
]

ROOT_URLCONF = 'tests.urls'

NOSE_ARGS = [
    # '--with-coverage',
    # '--cover-package=',
    # '--exe',  # If your tests need this to be found/run, check they py files are not chmodded +x
]


PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# LOGGING = None  # Comment out to enable logging for debugging

# Register an application at https://developers.eveonline.com for Authentication
# & API Access and fill out these settings. Be sure to set the callback URL
# to https://example.com/sso/callback substituting your domain for example.com
# Logging in to auth requires the publicData scope (can be overridden through the
# LOGIN_TOKEN_SCOPES setting). Other apps may require more (see their docs).
ESI_SSO_CLIENT_ID = '123'
ESI_SSO_CLIENT_SECRET = '123'
ESI_SSO_CALLBACK_URL = '123'
ESI_USER_CONTACT_EMAIL = '123@123.com'

CACHES = {
    "default": {
        # "BACKEND": "redis_cache.RedisCache",
        # "LOCATION": "localhost:6379",
        # "OPTIONS": {
        #    "DB": 1,
        # }
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://localhost:6379/1",
        "OPTIONS": {
            "COMPRESSOR": "django_redis.compressors.lzma.LzmaCompressor",
        }
    }
}

# CI runs the suite against MySQL and MariaDB as well. CT_TEST_DB=mysql
# covers both, since Django uses the same backend for them.
if os.environ.get("CT_TEST_DB") == "mysql":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": os.environ.get("DB_NAME", "authstats"),
            "USER": os.environ.get("DB_USER", "root"),
            "PASSWORD": os.environ.get("DB_PASSWORD", "root"),
            "HOST": os.environ.get("DB_HOST", "127.0.0.1"),
            "PORT": os.environ.get("DB_PORT", "3306"),
            "OPTIONS": {
                "charset": "utf8mb4",
                "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
            },
            "TEST": {
                "CHARSET": "utf8mb4",
                "COLLATION": "utf8mb4_unicode_ci",
            },
        }
    }
