import { type FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { AuthShell } from '../components/auth/AuthShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlError = params.get('error');
    if (urlError) {
      const errorMessages: Record<string, string> = {
        invalid_link: 'This sign-in link is invalid.',
        link_expired: 'This sign-in link has expired. Please request a new one.',
        link_already_used: 'This sign-in link has already been used.',
        missing_token: 'Invalid sign-in link.',
        google_denied: 'Google sign-in was cancelled.',
      };
      setError(errorMessages[urlError] || urlError);
    }
  }, [location.search]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSent(false);
    try {
      await api.sendMagicLink(email);
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Sign in to MailCraft"
      subtitle="Enter your email to receive a passwordless sign-in link."
    >
      {sent ? (
        <div className="space-y-4 rounded-tile border border-border bg-muted/50 p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckCircle2 className="h-4 w-4 text-marketing-accent" />
            <span>Check your inbox</span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>.
            The link expires in 15 minutes.
          </p>
          <Button
            className="w-full rounded-full"
            variant="outline"
            onClick={() => {
              setSent(false);
              setEmail('');
            }}
          >
            Use a different email
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <Button
              className="w-full rounded-full"
              size="lg"
              loading={busy}
              loadingText="Sending link..."
              type="submit"
            >
              Continue with email
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="relative flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <Button asChild className="w-full rounded-full" size="lg" variant="outline">
            <a href="/api/auth/google/login/">Continue with Google</a>
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
