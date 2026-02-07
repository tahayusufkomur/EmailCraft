from django.conf import settings
from django.contrib import messages
from django.contrib.admin import AdminSite
from django.contrib.auth import get_user_model, login as auth_login
from django.core.mail import send_mail
from django.shortcuts import redirect, render
from django.urls import path, reverse
from django.views.decorators.csrf import csrf_protect

from .forms import AdminEmailLoginForm, AdminOTPVerifyForm
from .models import AdminLoginAttempt, AdminLoginOTP

User = get_user_model()


def _mask_email(email):
    """Mask an email: j***@example.com"""
    local, domain = email.rsplit('@', 1)
    if len(local) <= 1:
        masked = local
    else:
        masked = local[0] + '***'
    return f'{masked}@{domain}'


def _send_otp_email(user, raw_code):
    subject = getattr(settings, 'ADMIN_2FA_EMAIL_SUBJECT', 'Admin Login Code')
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@example.com')
    expiry_minutes = getattr(settings, 'ADMIN_OTP_EXPIRY_SECONDS', 300) // 60
    send_mail(
        subject=subject,
        message=(
            f'Your admin login code is: {raw_code}\n\n'
            f'This code expires in {expiry_minutes} minutes.\n'
            f'If you did not request this, please ignore this email.'
        ),
        from_email=from_email,
        recipient_list=[user.email],
        fail_silently=False,
    )


class TwoFactorAdminSite(AdminSite):

    def get_urls(self):
        custom_urls = [
            path('verify-code/', csrf_protect(self.verify_code_view), name='admin-verify-code'),
        ]
        return custom_urls + super().get_urls()

    def login(self, request, extra_context=None):
        if request.user.is_authenticated and request.user.is_staff:
            return redirect(self.get_url('index'))

        form = AdminEmailLoginForm(request.POST or None)
        error = None

        if request.method == 'POST' and form.is_valid():
            email = form.cleaned_data['email'].lower().strip()
            password = form.cleaned_data['password']

            if AdminLoginAttempt.is_rate_limited(email):
                error = 'Too many login attempts. Please try again later.'
            else:
                try:
                    user = User.objects.get(email=email)
                except User.DoesNotExist:
                    user = None

                if user and user.check_password(password) and user.is_active and user.is_staff:
                    if not user.email:
                        error = 'This account has no email address configured.'
                    else:
                        AdminLoginOTP.cleanup_expired()
                        otp, raw_code = AdminLoginOTP.create_for_user(user)
                        _send_otp_email(user, raw_code)
                        verify_url = f"{reverse('admin:admin-verify-code')}?token={otp.token}"
                        next_url = request.POST.get('next', request.GET.get('next', ''))
                        if next_url:
                            verify_url += f'&next={next_url}'
                        return redirect(verify_url)
                else:
                    AdminLoginAttempt.record(email)
                    error = 'Invalid email or password.'

        context = {
            'form': form,
            'error': error,
            'title': 'Log in',
            'site_header': self.site_header,
            'next': request.POST.get('next', request.GET.get('next', '')),
            **(extra_context or {}),
        }
        return render(request, 'admin/login_email.html', context)

    def verify_code_view(self, request):
        token = request.POST.get('token') or request.GET.get('token', '')
        next_url = request.POST.get('next', request.GET.get('next', ''))

        if not token:
            messages.error(request, 'Invalid verification link.')
            return redirect(reverse('admin:login'))

        try:
            otp = AdminLoginOTP.objects.get(token=token, used=False)
        except AdminLoginOTP.DoesNotExist:
            messages.error(request, 'This verification link has expired or already been used.')
            return redirect(reverse('admin:login'))

        if otp.is_exhausted:
            messages.error(request, 'Too many attempts or code expired. Please log in again.')
            return redirect(reverse('admin:login'))

        form = AdminOTPVerifyForm(request.POST or None, initial={'token': token})
        error = None
        max_attempts = getattr(settings, 'ADMIN_LOGIN_MAX_ATTEMPTS', 5)
        remaining = max_attempts - otp.attempts

        if request.method == 'POST' and form.is_valid():
            code = form.cleaned_data['code']
            if otp.verify(code):
                auth_login(request, otp.user, backend='django.contrib.auth.backends.ModelBackend')
                return redirect(next_url or reverse('admin:index'))
            else:
                remaining = max_attempts - otp.attempts
                if remaining <= 0:
                    messages.error(request, 'Too many incorrect attempts. Please log in again.')
                    return redirect(reverse('admin:login'))
                error = f'Invalid code. {remaining} attempt(s) remaining.'

        context = {
            'form': form,
            'error': error,
            'masked_email': _mask_email(otp.user.email),
            'remaining': remaining,
            'title': 'Verify Code',
            'site_header': self.site_header,
            'token': token,
            'next': next_url,
        }
        return render(request, 'admin/verify_code.html', context)
