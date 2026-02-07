from django.urls import include, path
from rest_framework.routers import DefaultRouter

from templates_api.views import TemplateViewSet, export_html, gallery_list, presign_upload

router = DefaultRouter()
router.register('templates', TemplateViewSet, basename='template')

urlpatterns = [
    path('', include(router.urls)),
    path('gallery', gallery_list, name='gallery-list'),
    path('upload/presign', presign_upload, name='upload-presign'),
    path('export/html', export_html, name='export-html'),
]
