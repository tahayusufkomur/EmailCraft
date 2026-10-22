from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from django.views.static import serve

GALLERY_ASSETS_ROOT = settings.BASE_DIR.parent / 'frontend' / 'public' / 'gallery-assets'

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('dj_rest_auth.urls')),
    path('api/v1/auth/registration/', include('dj_rest_auth.registration.urls')),
    path('api/v1/', include('core.urls')),
    path('api/v1/', include('templates_api.urls')),
    path('gallery-assets/<path:path>', serve, {'document_root': GALLERY_ASSETS_ROOT}),
]
