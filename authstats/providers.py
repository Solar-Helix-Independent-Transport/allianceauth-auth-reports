from esi.openapi_clients import ESIClientProvider as OpenAPIProvider

from . import __title__, __url__, __version__

esi = OpenAPIProvider(
    compatibility_date="2025-11-06",
    ua_appname=__title__,
    ua_url=__url__,
    ua_version=__version__,
    operations=[
        "PostUniverseNames",
        "GetCorporationsCorporationIdMembers"
    ]
)
