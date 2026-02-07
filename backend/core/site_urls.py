from django.urls import path

from core.site_views import (
    site_dashboard,
    site_me,
    site_register,
    site_subscribe,
    site_template_detail,
    site_templates,
)

urlpatterns = [
    path('register', site_register, name='site-register'),
    path('me', site_me, name='site-me'),
    path('dashboard', site_dashboard, name='site-dashboard'),
    path('templates/', site_templates, name='site-templates'),
    path('templates/<uuid:template_id>/', site_template_detail, name='site-template-detail'),
    path('billing/subscribe', site_subscribe, name='site-billing-subscribe'),
]
