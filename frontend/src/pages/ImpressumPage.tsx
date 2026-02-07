import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export function ImpressumPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <h1 className="font-heading text-4xl font-semibold tracking-tight">Impressum</h1>
      <p className="mt-2 text-muted-foreground">Legal publisher information for MailCraft.</p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Provider Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>MailCraft GmbH</p>
          <p>Example Street 42</p>
          <p>10115 Berlin, Germany</p>
          <p>Email: legal@mailcraft.io</p>
          <p>Managing Director: Jane Example</p>
          <p>VAT ID: DE000000000</p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Liability Notice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            This page is a development placeholder. Replace legal identity, registration details, and policy links before production launch.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
