import { type FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

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
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Enter your email to receive a sign-in link. No password needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sent ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>.
                Check your inbox — the link expires in 15 minutes.
              </p>
              <Button
                className="w-full"
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
            <>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
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
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button className="w-full" disabled={busy} type="submit">
                  {busy ? 'Sending...' : 'Continue with email'}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button asChild className="w-full" variant="outline">
                <a href="/api/auth/google/login/">Continue with Google</a>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
