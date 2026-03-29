from django.urls import include, path

from core.views import (
    GoogleLoginView,
    create_session,
    email_setup,
    google_callback,
    google_login_redirect,
    guest_checkout,
    landing_page,
    magic_link_send,
    magic_link_verify,
    pricing_page,
    stripe_webhook,
    subscribe_callback,
    subscribe_page,
    subscribe_plan,
)

urlpatterns = [
    path('site/', include('core.site_urls')),
    path('auth/session', create_session, name='auth-session'),
    path('auth/google', GoogleLoginView.as_view(), name='auth-google'),
    path('auth/google/login/', google_login_redirect, name='auth-google-login'),
    path('auth/google/callback/', google_callback, name='auth-google-callback'),
    path('pages/landing', landing_page, name='landing-page'),
    path('pages/pricing', pricing_page, name='pricing-page'),
    path('pages/subscribe', subscribe_page, name='subscribe-page'),
    path('billing/subscribe', subscribe_plan, name='billing-subscribe'),
    path('billing/guest-checkout', guest_checkout, name='billing-guest-checkout'),
    path('billing/stripe/webhook', stripe_webhook, name='stripe-webhook'),
    path('auth/subscribe-callback', subscribe_callback, name='auth-subscribe-callback'),
    path('auth/magic-link', magic_link_send, name='auth-magic-link'),
    path('auth/magic-link/verify', magic_link_verify, name='auth-magic-link-verify'),
    path('email/setup', email_setup, name='email-setup'),
]
