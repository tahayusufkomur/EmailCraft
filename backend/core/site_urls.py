from django.urls import path

from core.site_views import (
    site_billing_portal,
    site_dashboard,
    site_login,
    site_logout,
    site_me,
    site_organization_api_keys,
    site_organization_detail,
    site_organizations,
    site_provision,
    site_register,
    site_subscribe,
    site_template_detail,
    site_templates,
)

urlpatterns = [
    path('register', site_register, name='site-register'),
    path('login', site_login, name='site-login'),
    path('logout', site_logout, name='site-logout'),
    path('me', site_me, name='site-me'),
    path('dashboard', site_dashboard, name='site-dashboard'),
    path('organizations/', site_organizations, name='site-organizations'),
    path('organizations/<uuid:organization_id>/', site_organization_detail, name='site-organization-detail'),
    path('organizations/<uuid:organization_id>/api-keys', site_organization_api_keys, name='site-organization-api-keys'),
    path('templates/', site_templates, name='site-templates'),
    path('templates/<uuid:template_id>/', site_template_detail, name='site-template-detail'),
    path('billing/subscribe', site_subscribe, name='site-billing-subscribe'),
    path('billing/portal', site_billing_portal, name='site-billing-portal'),
    path('provision', site_provision, name='site-provision'),
]
