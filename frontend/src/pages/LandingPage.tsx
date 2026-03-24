import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Code2, CreditCard, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

import { api } from '../lib/api';
import type { LandingResponse } from '../types/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const icons = [Code2, LayoutDashboard, CreditCard, CheckCircle2];

export function LandingPage() {
  const [data, setData] = useState<LandingResponse | null>(null);

  useEffect(() => {
    void api.fetchLanding().then(setData).catch(() => setData(null));
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60 bg-[radial-gradient(circle_at_top,_hsl(205_90%_58%_/_0.17),transparent_45%),radial-gradient(circle_at_80%_50%,_hsl(33_95%_57%_/_0.16),transparent_45%)] dark:bg-[radial-gradient(circle_at_top,_hsl(205_90%_58%_/_0.08),transparent_45%),radial-gradient(circle_at_80%_50%,_hsl(33_95%_57%_/_0.06),transparent_45%)]">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 md:py-28">
          <p className="mb-4 inline-flex rounded-full border border-border bg-background/90 px-3 py-1 text-xs font-medium text-muted-foreground">
            Built for product teams shipping email at scale
          </p>
          <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight md:text-6xl">
            {data?.hero.title ?? 'MailCraft: Build and ship email templates quickly'}
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            {data?.hero.subtitle ??
              'Use a focused builder for your customers and manage subscriptions, billing, and usage from one dashboard.'}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/register">
                Start free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/pricing">View pricing</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <a href="/builder/">Open builder</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-14 md:grid-cols-2">
        {(data?.features ?? [
          'Email-safe HTML export',
          'Template management and templates',
          'S3-backed media uploads by organization',
          'API-key based multi-tenant access',
        ]).map((feature, index) => {
          const Icon = icons[index % icons.length];
          return (
            <Card key={feature}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Icon className="h-5 w-5 text-primary" />
                  {feature}
                </CardTitle>
                <CardDescription>
                  Production-focused defaults with clean handoff between builder usage and account billing.
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </section>

      <section className="border-y border-border/60 bg-muted/20">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">1. Embed the Builder</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Load the dedicated `/builder/` app in your product and initialize with your API key.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">2. Manage Templates</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Use your dashboard to review templates, storage usage, and render limits.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">3. Scale with Billing</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Upgrade plans instantly and keep Stripe-based subscription status in sync.
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
