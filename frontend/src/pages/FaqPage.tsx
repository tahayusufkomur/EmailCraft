import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { Button } from '../components/ui/button';

const faqs = [
  {
    question: 'Can I use MailCraft inside my own product?',
    answer:
      'Yes. The email builder is served separately at /builder and can be embedded inside any web app using an iframe, session token or API key, and window.postMessage events.',
  },
  {
    question: 'How are limits enforced?',
    answer:
      'Render counts, AI generations, and storage usage are tracked per organization. Your plan controls all quotas and real-time usage is visible in your dashboard cards.',
  },
  {
    question: 'Does billing support upgrades and downgrades?',
    answer:
      'Yes. Billing checkout is Stripe-backed. Upgrades take effect immediately with automatic proration, while downgrades are scheduled for the end of your current billing cycle.',
  },
  {
    question: 'How do dynamic merge variables work?',
    answer:
      'You define available variables (such as {{first_name}} or {{reset_url}}) per organization. Authors insert them via the toolbar dropdown, and POST /api/v1/render substitutes and HTML-escapes values at send time.',
  },
  {
    question: 'Can I keep my API key off the client browser?',
    answer:
      'Yes — and we recommend it for production. Exchange your API key on your backend via POST /api/v1/auth/session for a 4-hour sessionToken, then pass only sessionToken to the embedded iframe.',
  },
  {
    question: 'Can I use Google login?',
    answer:
      'Google OAuth is integrated via django-allauth. Click Continue with Google on the sign-in or registration screen to authenticate with your workspace account.',
  },
];

export function FaqPage() {
  return (
    <div className="py-20 sm:py-28">
      <div className="mx-auto max-w-text px-6 sm:px-8">
        <div className="text-center">
          <p className="text-eyebrow text-muted-foreground">FAQ</p>
          <h1 className="mt-3 text-display-2 font-bold tracking-tight text-foreground">
            Questions, answered.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-body-lg text-muted-foreground">
            Everything you need to know about embedding the builder, rendering emails via API, and
            managing organization plans.
          </p>
        </div>

        <div className="mt-14 divide-y divide-border border-y border-border">
          {faqs.map((item) => (
            <details key={item.question} className="group py-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left text-title-2 font-semibold text-foreground">
                <span>{item.question}</span>
                <Plus className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45" />
              </summary>
              <div className="faq-content">
                <div>
                  <p className="max-w-2xl pt-3 text-body text-muted-foreground">{item.answer}</p>
                </div>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-14 rounded-tile border border-border bg-muted p-8 text-center sm:p-10">
          <p className="text-eyebrow text-marketing-accent">Need deeper integration details?</p>
          <h2 className="mt-2 text-title-2 font-bold text-foreground">
            Explore the full developer documentation.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Read our complete guide covering postMessage events, session tokens, and REST endpoints.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button className="rounded-full" asChild>
              <Link to="/docs">Read the Docs</Link>
            </Button>
            <Button variant="outline" className="rounded-full" asChild>
              <a href="/builder/">Open Live Builder</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
