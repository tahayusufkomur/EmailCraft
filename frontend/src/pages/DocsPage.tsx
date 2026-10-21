import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { cn } from '../lib/utils';

const DOMAIN = 'https://mailcraft.contentor.app';

type SectionId =
  | 'overview'
  | 'getting-started'
  | 'account-api'
  | 'embedding'
  | 'postmessage'
  | 'api-reference'
  | 'templates'
  | 'variables'
  | 'media'
  | 'plans'
  | 'security';

const SECTIONS: Array<{ id: SectionId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'account-api', label: 'Account API' },
  { id: 'embedding', label: 'Embedding the Builder' },
  { id: 'postmessage', label: 'postMessage API' },
  { id: 'api-reference', label: 'REST API Reference' },
  { id: 'templates', label: 'Templates' },
  { id: 'variables', label: 'Variables' },
  { id: 'media', label: 'Media & Uploads' },
  { id: 'plans', label: 'Plans & Limits' },
  { id: 'security', label: 'Security' },
];

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-border bg-muted p-4 font-mono text-xs leading-relaxed text-foreground">
      <code>{children}</code>
    </pre>
  );
}

function InlineCode({ children }: { children: string }) {
  return (
    <code className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
      {children}
    </code>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-b border-border pb-12 last:border-b-0">
      <h2 className="mb-4 text-title font-bold tracking-tight text-foreground">{title}</h2>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5 pt-2">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

export function DocsPage() {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');

  return (
    <div>
      <section className="border-b border-border bg-muted/50 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-eyebrow text-marketing-accent">Documentation</p>
          <h1 className="mt-3 text-display-2 font-bold tracking-tight text-foreground">
            MailCraft Developer Docs
          </h1>
          <p className="mt-3 max-w-2xl text-body-lg text-muted-foreground">
            Everything you need to embed, configure, and render emails in your product.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[220px_minmax(0,1fr)]">
          {/* Sidebar nav */}
          <aside className="hidden md:block">
            <nav className="sticky top-20 space-y-1">
              <p className="mb-3 px-3 text-eyebrow text-muted-foreground">On this page</p>
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    'block rounded-lg px-3 py-2 text-xs transition-colors',
                    activeSection === s.id
                      ? 'bg-accent font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="space-y-12">
            <Section id="overview" title="Overview">
              <p>
                MailCraft is an embeddable email template builder. Your users design email templates
                via a drag-and-drop editor, and your application receives production-ready,
                email-client-compatible HTML.
              </p>
              <Card className="rounded-tile">
                <CardHeader>
                  <CardTitle className="text-base">How it works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">1. Embed</strong> — Load the builder in an
                    iframe on your site with your API key or session token.
                  </p>
                  <p>
                    <strong className="text-foreground">2. Design</strong> — Your users build emails
                    using blocks: text, images, buttons, columns, social links, and more.
                  </p>
                  <p>
                    <strong className="text-foreground">3. Export</strong> — Get table-based,
                    inline-CSS HTML that works across all email clients. Output via postMessage or
                    REST API.
                  </p>
                  <p>
                    <strong className="text-foreground">4. Render</strong> — Use the render API to
                    substitute variables and send the final email.
                  </p>
                </CardContent>
              </Card>
              <p>
                Each organization gets its own isolated workspace with separate templates, media
                storage, and API keys. You manage everything from the dashboard.
              </p>
            </Section>

            <Section id="getting-started" title="Getting Started">
              <Subsection title="1. Create an account">
                <p>
                  Register at <InlineCode>{`${DOMAIN}/register`}</InlineCode> and create your first
                  organization from the dashboard.
                </p>
              </Subsection>
              <Subsection title="2. Get your API key">
                <p>
                  Go to <strong className="text-foreground">Dashboard → Email Builder</strong>,
                  select your organization, and click{' '}
                  <strong className="text-foreground">Copy API key</strong>. The key format is{' '}
                  <InlineCode>{'mc_{live|test}_{32hex}'}</InlineCode>.
                </p>
              </Subsection>
              <Subsection title="3. Embed the builder">
                <p>
                  Add the iframe to your page (see Embedding section below) or use the pre-filled
                  snippets from the Email Builder dashboard page.
                </p>
              </Subsection>
              <Subsection title="4. Listen for saves">
                <p>
                  The builder sends <InlineCode>MAILCRAFT_SAVE</InlineCode> events via postMessage
                  containing both the HTML output and the JSON template data.
                </p>
              </Subsection>
            </Section>

            <Section id="account-api" title="Account API">
              <p>
                Manage your account programmatically. These endpoints use your{' '}
                <strong className="text-foreground">site token</strong> (returned at login), not an
                API key. Base URL: <InlineCode>{`${DOMAIN}/api/v1/site`}</InlineCode>
              </p>

              <Subsection title="Authentication">
                <p>
                  Log in to get your site token, then pass it as a Token header in subsequent
                  requests.
                </p>
                <Code>{`# Log in (email or username)
POST ${DOMAIN}/api/v1/site/login
Content-Type: application/json

{ "identifier": "you@example.com", "password": "your-password" }

# Response: { "token": "abc123..." }

# Use the token for all account API calls
Authorization: Token abc123...`}</Code>
              </Subsection>

              <Subsection title="Provision an organization">
                <p>
                  Create a new organization and get a{' '}
                  <strong className="text-foreground">live API key</strong> in one call. The raw key
                  is returned only once — store it securely.
                </p>
                <Code>{`POST ${DOMAIN}/api/v1/site/provision
Authorization: Token <your_site_token>
Content-Type: application/json

{ "name": "My Client App" }

# Response (201):
{
  "organization": {
    "id": "uuid",
    "name": "My Client App",
    "plan": "free"
  },
  "api_key": {
    "raw": "mc_live_abc123...",
    "prefix": "mc_live_abc1",
    "environment": "live"
  }
}`}</Code>
                <p>
                  The new organization inherits the plan of your billing account. A test key is also
                  created automatically. Use the returned <InlineCode>api_key.raw</InlineCode> value
                  to embed the builder or call the REST API.
                  <strong className="text-foreground">
                    {' '}
                    Store the raw key securely — it is shown only once.
                  </strong>
                </p>
                <p>
                  This endpoint is <strong className="text-foreground">idempotent</strong>: if an
                  organization with the same name already exists for your account, it returns the
                  existing org with <InlineCode>api_key: null</InlineCode> (no new key is created).
                </p>
              </Subsection>

              <Subsection title="Other account endpoints">
                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-2.5 font-semibold text-foreground">Method</th>
                        <th className="px-4 py-2.5 font-semibold text-foreground">Endpoint</th>
                        <th className="px-4 py-2.5 font-semibold text-foreground">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-4 py-2.5 font-mono">POST</td>
                        <td className="px-4 py-2.5">
                          <InlineCode>/site/login</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">
                          Log in with email/username + password. Returns site token.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-mono">POST</td>
                        <td className="px-4 py-2.5">
                          <InlineCode>/site/register</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">Create account + first organization.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-mono">POST</td>
                        <td className="px-4 py-2.5">
                          <InlineCode>/site/logout</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">Revoke your site token.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-mono">GET</td>
                        <td className="px-4 py-2.5">
                          <InlineCode>/site/me</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">Get current user + primary organization.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-mono">POST</td>
                        <td className="px-4 py-2.5">
                          <InlineCode>/site/provision</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">Create org + live API key (see above).</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-mono">GET</td>
                        <td className="px-4 py-2.5">
                          <InlineCode>/site/organizations/</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">List all your organizations with API keys.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-mono">PUT</td>
                        <td className="px-4 py-2.5">
                          <InlineCode>{'/site/organizations/{id}/'}</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">
                          Update org settings (name, allowed origins, theme, etc.).
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Subsection>
            </Section>

            <Section id="embedding" title="Embedding the Builder">
              <Subsection title="Basic iframe">
                <p>
                  The simplest integration — works with any framework or plain HTML. For production,
                  use session tokens instead of API keys (see Security section).
                </p>
                <Code>{`<!-- Quick start (API key in URL — ok for development) -->
<iframe
  src="${DOMAIN}/builder/?apiKey=YOUR_API_KEY"
  width="100%"
  height="800"
  frameborder="0"
  allow="clipboard-write"
></iframe>

<!-- Recommended for production (session token — API key stays on your server) -->
<iframe
  src="${DOMAIN}/builder/?sessionToken=sess_abc123..."
  width="100%"
  height="800"
  frameborder="0"
  allow="clipboard-write"
></iframe>`}</Code>
              </Subsection>

              <Subsection title="Query parameters">
                <p>Customize the builder appearance via URL parameters:</p>
                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-2.5 font-semibold text-foreground">Parameter</th>
                        <th className="px-4 py-2.5 font-semibold text-foreground">Type</th>
                        <th className="px-4 py-2.5 font-semibold text-foreground">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>apiKey</InlineCode>
                        </td>
                        <td className="px-4 py-2.5 font-mono">string</td>
                        <td className="px-4 py-2.5">
                          Your organization API key. Required unless using sessionToken.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>sessionToken</InlineCode>
                        </td>
                        <td className="px-4 py-2.5 font-mono">string</td>
                        <td className="px-4 py-2.5">
                          Session token (recommended for production). Use instead of apiKey.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>variables</InlineCode>
                        </td>
                        <td className="px-4 py-2.5 font-mono">string</td>
                        <td className="px-4 py-2.5">
                          Comma-separated variable keys (e.g.{' '}
                          <InlineCode>first_name,email</InlineCode>) or a JSON array of variable
                          objects.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>showLogo</InlineCode>
                        </td>
                        <td className="px-4 py-2.5 font-mono">boolean</td>
                        <td className="px-4 py-2.5">
                          Show/hide the MailCraft logo. Default: true.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>showExportHtmlButton</InlineCode>
                        </td>
                        <td className="px-4 py-2.5 font-mono">boolean</td>
                        <td className="px-4 py-2.5">
                          Show/hide the Export HTML button. Default: true.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>themeMode</InlineCode>
                        </td>
                        <td className="px-4 py-2.5 font-mono">string</td>
                        <td className="px-4 py-2.5">Color mode: light, dark, or system.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>builderTheme</InlineCode>
                        </td>
                        <td className="px-4 py-2.5 font-mono">string</td>
                        <td className="px-4 py-2.5">
                          One of: light-breeze, light-paper, dark-slate, dark-cosmos.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>chromeColor</InlineCode>
                        </td>
                        <td className="px-4 py-2.5 font-mono">string</td>
                        <td className="px-4 py-2.5">
                          Custom hex color for the builder chrome/toolbar area.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>canvasColor</InlineCode>
                        </td>
                        <td className="px-4 py-2.5 font-mono">string</td>
                        <td className="px-4 py-2.5">
                          Custom hex color for the editor canvas background.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Subsection>

              <Subsection title="React example">
                <Code>{`import { useEffect, useRef } from 'react';

export function EmailBuilder({ sessionToken, onTemplateSaved }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (e.data?.source !== 'mailcraft') return;

      if (e.data.type === 'MAILCRAFT_TEMPLATE_SAVED') {
        onTemplateSaved({
          templateId: e.data.payload.templateId,
          templateName: e.data.payload.templateName,
        });
      }
    };
    window.addEventListener('message', handle);
    return () => window.removeEventListener('message', handle);
  }, [onTemplateSaved]);

  const requestSave = () => {
    iframeRef.current?.contentWindow?.postMessage(
      { source: 'mailcraft-host', type: 'MAILCRAFT_REQUEST_SAVE' },
      '${DOMAIN}'
    );
  };

  return (
    <>
      <iframe
        ref={iframeRef}
        src={\`${DOMAIN}/builder/?sessionToken=\${sessionToken}\`}
        style={{ width: '100%', height: '800px', border: 'none' }}
        allow="clipboard-write"
      />
      <button onClick={requestSave}>Save & Continue</button>
    </>
  );
}`}</Code>
              </Subsection>
            </Section>

            <Section id="postmessage" title="postMessage API">
              <p>
                The builder communicates with its parent window using{' '}
                <InlineCode>window.postMessage</InlineCode>. Messages from the builder use{' '}
                <InlineCode>{'source: "mailcraft"'}</InlineCode>. Messages to the builder must use{' '}
                <InlineCode>{'source: "mailcraft-host"'}</InlineCode>.
              </p>

              <Subsection title="Events from the builder (listen)">
                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-2.5 font-semibold text-foreground">Event</th>
                        <th className="px-4 py-2.5 font-semibold text-foreground">Payload</th>
                        <th className="px-4 py-2.5 font-semibold text-foreground">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>MAILCRAFT_READY</InlineCode>
                        </td>
                        <td className="px-4 py-2.5 font-mono">{'{}'}</td>
                        <td className="px-4 py-2.5">
                          Builder has loaded and is ready to receive commands.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>MAILCRAFT_SAVE</InlineCode>
                        </td>
                        <td className="px-4 py-2.5 font-mono">{'{ html, json }'}</td>
                        <td className="px-4 py-2.5">
                          User clicked Save. Contains rendered HTML and template JSON.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>MAILCRAFT_TEMPLATE_SAVED</InlineCode>
                        </td>
                        <td className="px-4 py-2.5 font-mono">
                          {'{ templateId, templateName }'}
                        </td>
                        <td className="px-4 py-2.5">
                          Template was persisted to the backend (new or updated).
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>MAILCRAFT_AUTO_SAVE</InlineCode>
                        </td>
                        <td className="px-4 py-2.5 font-mono">{'{ json }'}</td>
                        <td className="px-4 py-2.5">
                          Periodic auto-save with current template JSON (debounced).
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>MAILCRAFT_ERROR</InlineCode>
                        </td>
                        <td className="px-4 py-2.5 font-mono">{'{ code, message }'}</td>
                        <td className="px-4 py-2.5">
                          An error occurred (e.g., export failure).
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Subsection>

              <Subsection title="Commands to the builder (send)">
                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-2.5 font-semibold text-foreground">Command</th>
                        <th className="px-4 py-2.5 font-semibold text-foreground">Payload</th>
                        <th className="px-4 py-2.5 font-semibold text-foreground">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>MAILCRAFT_INIT</InlineCode>
                        </td>
                        <td className="px-4 py-2.5 font-mono">
                          {'{ apiKey, variables?, templateJson?, context? }'}
                        </td>
                        <td className="px-4 py-2.5">
                          Initialize with config, initial template, and theme overrides.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>MAILCRAFT_LOAD_TEMPLATE</InlineCode>
                        </td>
                        <td className="px-4 py-2.5 font-mono">{'{ json }'}</td>
                        <td className="px-4 py-2.5">Load a template JSON into the editor.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>MAILCRAFT_EXPORT</InlineCode>
                        </td>
                        <td className="px-4 py-2.5 font-mono">{'{}'}</td>
                        <td className="px-4 py-2.5">
                          Trigger an export. Result comes back as MAILCRAFT_SAVE.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>MAILCRAFT_REQUEST_SAVE</InlineCode>
                        </td>
                        <td className="px-4 py-2.5 font-mono">{'{}'}</td>
                        <td className="px-4 py-2.5">
                          Request the builder to save the current template.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <Code>{`// Example: send a command to the builder
const iframe = document.getElementById('mailcraft-iframe');
iframe.contentWindow.postMessage({
  source: 'mailcraft-host',
  type: 'MAILCRAFT_LOAD_TEMPLATE',
  payload: { json: savedTemplateJson }
}, '${DOMAIN}');`}</Code>
              </Subsection>
            </Section>

            <Section id="api-reference" title="REST API Reference">
              <p>
                All API endpoints require the <InlineCode>X-API-Key</InlineCode> header (or{' '}
                <InlineCode>X-Session-Token</InlineCode> once you have a session). Base URL:{' '}
                <InlineCode>{`${DOMAIN}/api/v1`}</InlineCode>
              </p>

              <Subsection title="Authentication">
                <Code>{`# Every request needs your API key
curl ${DOMAIN}/api/v1/templates \\
  -H "X-API-Key: mc_live_abc123..."`}</Code>
              </Subsection>

              <Subsection title="Templates CRUD">
                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-2.5 font-semibold text-foreground">Method</th>
                        <th className="px-4 py-2.5 font-semibold text-foreground">Endpoint</th>
                        <th className="px-4 py-2.5 font-semibold text-foreground">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-4 py-2.5 font-mono">GET</td>
                        <td className="px-4 py-2.5">
                          <InlineCode>/templates</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">List all templates (yours + gallery).</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-mono">POST</td>
                        <td className="px-4 py-2.5">
                          <InlineCode>/templates</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">
                          Create a template. Body: {'{ name, json_data, category?, tags? }'}.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-mono">GET</td>
                        <td className="px-4 py-2.5">
                          <InlineCode>{'/templates/{id}'}</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">Get a single template with full JSON data.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-mono">PUT</td>
                        <td className="px-4 py-2.5">
                          <InlineCode>{'/templates/{id}'}</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">Update a template.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-mono">DELETE</td>
                        <td className="px-4 py-2.5">
                          <InlineCode>{'/templates/{id}'}</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">Delete a template.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-mono">GET</td>
                        <td className="px-4 py-2.5">
                          <InlineCode>{'/templates/{id}/preview'}</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">
                          Get rendered HTML preview with default variable values.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Subsection>

              <Subsection title="Gallery">
                <Code>{`GET /api/v1/gallery
GET /api/v1/gallery?category=welcome`}</Code>
                <p>
                  Returns pre-built gallery templates. Premium templates are visible to all but only
                  usable on paid plans.
                </p>
              </Subsection>

              <Subsection title="Export HTML">
                <Code>{`POST /api/v1/export/html
Content-Type: application/json

{
  "json_data": { ... },       // Template JSON from the builder
  "variables_mode": "placeholders"  // or "defaults"
}`}</Code>
                <p>
                  Converts template JSON to email-compatible HTML (table layout, inline CSS, VML for
                  Outlook).
                </p>
              </Subsection>

              <Subsection title="Render with variables">
                <Code>{`POST /api/v1/render
Content-Type: application/json

{
  "template_id": "uuid-here",   // OR provide json_data directly
  "variables": {
    "user_name": "Jane",
    "unsubscribe_url": "https://example.com/unsub"
  }
}`}</Code>
                <p>
                  Substitutes variables into the template and returns rendered HTML. All used
                  variables must be provided (strict mode).
                </p>
              </Subsection>

              <Subsection title="Media">
                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-2.5 font-semibold text-foreground">Method</th>
                        <th className="px-4 py-2.5 font-semibold text-foreground">Endpoint</th>
                        <th className="px-4 py-2.5 font-semibold text-foreground">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-4 py-2.5 font-mono">GET</td>
                        <td className="px-4 py-2.5">
                          <InlineCode>/media</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">
                          List uploaded images. Supports ?q=search, ?sort=date|name|size,
                          ?order=asc|desc.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-mono">POST</td>
                        <td className="px-4 py-2.5">
                          <InlineCode>/upload/presign</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">
                          Get a presigned S3 URL for uploading. Body:{' '}
                          {'{ filename, content_type, file_size }'}.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Subsection>

              <Subsection title="Session">
                <p>
                  Create a session token server-side, then pass it to the iframe instead of your API
                  key. This keeps your API key secret.
                </p>
                <Code>{`# Create session from your backend (API key never reaches the browser)
POST /api/v1/auth/session
X-API-Key: mc_live_abc123...
Content-Type: application/json
{"origin": "https://your-domain.com"}

# Response:
# {
#   "token": "sess_abc123...",
#   "expires_at": "2026-03-24T20:00:00Z",
#   "config": { plan, variables, limits, widget_context... }
# }`}</Code>
              </Subsection>
            </Section>

            <Section id="templates" title="Templates">
              <Subsection title="Template JSON structure">
                <p>Every template follows this structure:</p>
                <Code>{`{
  "version": 1,
  "settings": {
    "backgroundColor": "#f4f4f4",
    "backgroundStyle": "none",
    "bodyBackgroundColor": "#ffffff",
    "bodyBorderRadius": 0
  },
  "header": { "blocks": [] },
  "body": {
    "blocks": [
      {
        "id": "unique-uuid",
        "type": "text",
        "data": { ... },
        "style": { ... }
      }
    ]
  },
  "footer": { "blocks": [] }
}`}</Code>
              </Subsection>

              <Subsection title="Block types">
                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-2.5 font-semibold text-foreground">Type</th>
                        <th className="px-4 py-2.5 font-semibold text-foreground">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>heading</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">Large title text (H1–H3).</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>text</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">
                          Rich text with formatting (bold, italic, links, colors).
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>image</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">
                          Single image with optional link, alt text, and alignment.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>button</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">
                          CTA button with customizable colors, border radius, and link.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>spacer</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">Adjustable vertical spacing.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>divider</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">Horizontal line separator.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>columns</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">
                          Multi-column layout. Each column can contain nested blocks.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>social</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">
                          Social media icon links (Facebook, Twitter, LinkedIn, etc.).
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>card</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">
                          Card with image, heading, body text, badge, and CTA button.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>list</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">
                          Ordered or unordered list with customizable items.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>profile</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">
                          Profile card with avatar, name, title, and bio.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>hero</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">
                          Full-width section with background image and text overlay.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">
                          <InlineCode>html</InlineCode>
                        </td>
                        <td className="px-4 py-2.5">Raw HTML code block for custom content.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Subsection>
            </Section>

            <Section id="variables" title="Variables">
              <p>
                Variables let your users insert dynamic placeholders like{' '}
                <InlineCode>{'{{user_name}}'}</InlineCode> into their templates. At render time, you
                provide the values and the API substitutes them.
              </p>

              <Subsection title="Defining available variables">
                <p>
                  Configure variables per organization in{' '}
                  <strong className="text-foreground">
                    Dashboard → Email Builder → Available variables
                  </strong>
                  .
                </p>
                <Code>{`{
  "key": "user_name",
  "label": "User Name",
  "type": "text",
  "defaultValue": "there"
}`}</Code>
              </Subsection>

              <Subsection title="Rendering with variables">
                <Code>{`POST /api/v1/render
{
  "template_id": "your-template-uuid",
  "variables": {
    "user_name": "Jane Doe",
    "company_name": "Acme Inc"
  }
}`}</Code>
              </Subsection>
            </Section>

            <Section id="media" title="Media & Uploads">
              <p>
                Images are uploaded to S3 via presigned URLs. Each organization has isolated
                storage.
              </p>
              <Subsection title="Upload flow">
                <Code>{`// 1. Request a presigned upload URL
POST /api/v1/upload/presign
{
  "filename": "hero-banner.jpg",
  "content_type": "image/jpeg",
  "file_size": 245000
}
// Returns: { upload_url, file_url, image_id }`}</Code>
              </Subsection>
            </Section>

            <Section id="plans" title="Plans & Limits">
              <p>
                See the{' '}
                <Link
                  to="/pricing"
                  className="font-medium text-foreground underline underline-offset-4 hover:text-marketing-accent"
                >
                  pricing page
                </Link>{' '}
                for up-to-date plan details, features, and limits.
              </p>
            </Section>

            <Section id="security" title="Security">
              <Subsection title="API key handling">
                <p>
                  API keys are hashed with SHA-256 before storage — the raw key is never stored in
                  the database. Treat API keys like passwords: never expose them in client-side
                  production code.
                </p>
              </Subsection>
              <Subsection title="Allowed origins">
                <p>
                  Configure allowed origins per organization in the dashboard to restrict which
                  domains can create sessions with your API key.
                </p>
              </Subsection>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
