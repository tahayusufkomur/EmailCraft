from django import forms


class AdminEmailLoginForm(forms.Form):
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={
            'class': 'vTextField',
            'autofocus': True,
            'autocomplete': 'email',
            'placeholder': 'Email address',
        }),
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'vTextField',
            'autocomplete': 'current-password',
            'placeholder': 'Password',
        }),
    )


class AdminOTPVerifyForm(forms.Form):
    code = forms.CharField(
        min_length=6,
        max_length=6,
        widget=forms.TextInput(attrs={
            'class': 'vTextField',
            'inputmode': 'numeric',
            'pattern': '[0-9]{6}',
            'autocomplete': 'one-time-code',
            'autofocus': True,
            'placeholder': '000000',
            'style': 'font-size: 1.5em; letter-spacing: 0.3em; text-align: center;',
        }),
    )
    token = forms.CharField(widget=forms.HiddenInput())
