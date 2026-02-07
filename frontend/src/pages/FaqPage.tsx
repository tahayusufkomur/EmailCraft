import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const faqs = [
  {
    question: 'Can I use MailCraft inside my own product?',
    answer: 'Yes. The email builder is served separately at /builder and can be embedded with your API key and postMessage events.',
  },
  {
    question: 'How are limits enforced?',
    answer:
      'Render counts and storage usage are tracked per organization. Your plan controls both limits and they are visible in dashboard usage cards.',
  },
  {
    question: 'Does billing support upgrades?',
    answer:
      'Yes. Billing checkout is Stripe-backed. After successful checkout, webhook updates your organization plan and limits automatically.',
  },
  {
    question: 'Can I use Google login?',
    answer:
      'Google auth is integrated with django-allauth. In development it works when Google client credentials and callback URLs are configured.',
  },
];

export function FaqPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <h1 className="font-heading text-4xl font-semibold tracking-tight">FAQ</h1>
      <p className="mt-2 text-muted-foreground">Answers for onboarding, integration, and billing behavior.</p>
      <div className="mt-8 space-y-4">
        {faqs.map((item) => (
          <Card key={item.question}>
            <CardHeader>
              <CardTitle className="text-xl">{item.question}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{item.answer}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
