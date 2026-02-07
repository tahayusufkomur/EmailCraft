from django.urls import include, path

from core.views import (
    GoogleLoginView,
    create_session,
    landing_page,
    pricing_page,
    stripe_webhook,
    subscribe_page,
    subscribe_plan,
)

urlpatterns = [
    path('site/', include('core.site_urls')),
    path('auth/session', create_session, name='auth-session'),
    path('auth/google', GoogleLoginView.as_view(), name='auth-google'),
    path('pages/landing', landing_page, name='landing-page'),
    path('pages/pricing', pricing_page, name='pricing-page'),
    path('pages/subscribe', subscribe_page, name='subscribe-page'),
    path('billing/subscribe', subscribe_plan, name='billing-subscribe'),
    path('billing/stripe/webhook', stripe_webhook, name='stripe-webhook'),
]
