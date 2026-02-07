from django.urls import path

from core.views import create_session

urlpatterns = [
    path('auth/session', create_session, name='auth-session'),
]
