from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("core.urls")),
    # Alias métier stables (/api/*)
    path("api/", include("config.api_alias_urls")),
    # Routes versionnées existantes (/api/v1/*)
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/", include("accounts.admin_urls")),
    path("api/v1/", include("referentials.urls")),
    path("api/v1/", include("dossiers.urls")),
    path("api/v1/", include("payments.urls")),
    path("api/v1/", include("reports.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
