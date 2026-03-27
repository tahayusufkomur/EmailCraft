import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const DOMAIN = 'https://emailcraft.contentor.app';

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
    <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 text-xs leading-relaxed dark:bg-muted/30">
      <code className="font-mono">{children}</code>
    </pre>
  );
}

function InlineCode({ children }: { children: string }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{children}</code>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="mb-4 font-heading text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

export function DocsPage() {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Documentation</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight">MailCraft Docs</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Everything you need to embed, configure, and use the email builder in your product.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[200px_1fr]" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Sidebar nav */}
        <nav className="hidden space-y-1 overflow-y-auto md:block">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setActiveSection(s.id)}
              className={`block rounded-md px-3 py-2 text-sm transition hover:bg-muted hover:text-foreground ${
                activeSection === s.id ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground'
              }`}
            >
              {s.label}
            </a>
          ))}
        </nav>

        {/* Content */}
        <div className="space-y-12 overflow-y-auto pr-2">
          <Section id="overview" title="Overview">
            <p>
              MailCraft is an embeddable email template builder. Your users design email templates
              via a drag-and-drop editor, and your application receives production-ready, email-client-compatible HTML.
            </p>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">How it works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p><strong className="text-foreground">1. Embed</strong> — Load the builder in an iframe on your site with your API key.</p>
                <p><strong className="text-foreground">2. Design</strong> — Your users build emails using blocks: text, images, buttons, columns, social links, and more.</p>
                <p><strong className="text-foreground">3. Export</strong> — Get table-based, inline-CSS HTML that works across all email clients. Output via postMessage or REST API.</p>
                <p><strong className="text-foreground">4. Render</strong> — Use the render API to substitute variables and send the final email.</p>
              </CardContent>
            </Card>
            <p>
              Each organization gets its own isolated workspace with separate templates, media storage, and API keys.
              You manage everything from the dashboard.
            </p>
          </Section>

          <Section id="getting-started" title="Getting Started">
            <Subsection title="1. Create an account">
              <p>Register at <InlineCode>{`${DOMAIN}/register`}</InlineCode> and create your first organization from the dashboard.</p>
            </Subsection>
            <Subsection title="2. Get your API key">
              <p>
                Go to <strong className="text-foreground">Dashboard → Email Builder</strong>, select your organization,
                and click <strong className="text-foreground">Copy API key</strong>. The key format is <InlineCode>{'mc_{live|test}_{32hex}'}</InlineCode>.
              </p>
            </Subsection>
            <Subsection title="3. Embed the builder">
              <p>Add the iframe to your page (see Embedding section below) or use the pre-filled snippets from the Email Builder dashboard page.</p>
            </Subsection>
            <Subsection title="4. Listen for saves">
              <p>The builder sends <InlineCode>MAILCRAFT_SAVE</InlineCode> events via postMessage containing both the HTML output and the JSON template data.</p>
            </Subsection>
          </Section>

          <Section id="account-api" title="Account API">
            <p>
              Manage your account programmatically. These endpoints use your <strong className="text-foreground">site token</strong> (returned at login), not an API key.
              Base URL: <InlineCode>{`${DOMAIN}/api/v1/site`}</InlineCode>
            </p>

            <Subsection title="Authentication">
              <p>Log in to get your site token, then pass it as a Bearer token in subsequent requests.</p>
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
                Create a new organization and get a <strong className="text-foreground">live API key</strong> in one call.
                The raw key is returned only once — store it securely.
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
                The new organization inherits the plan of your billing account.
                A test key is also created automatically.
                Use the returned <InlineCode>api_key.raw</InlineCode> value to embed the builder or call the REST API.
                <strong className="text-foreground"> Store the raw key securely — it is shown only once.</strong>
              </p>
              <p>
                This endpoint is <strong className="text-foreground">idempotent</strong>: if an organization with the same name already exists for your account,
                it returns the existing org with <InlineCode>api_key: null</InlineCode> (no new key is created).
                This prevents duplicate organizations and API keys from concurrent calls.
              </p>
            </Subsection>

            <Subsection title="Other account endpoints">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 pr-4 font-semibold text-foreground">Method</th>
                      <th className="py-2 pr-4 font-semibold text-foreground">Endpoint</th>
                      <th className="py-2 font-semibold text-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr><td className="py-2 pr-4">POST</td><td className="py-2 pr-4"><InlineCode>/site/login</InlineCode></td><td className="py-2">Log in with email/username + password. Returns site token.</td></tr>
                    <tr><td className="py-2 pr-4">POST</td><td className="py-2 pr-4"><InlineCode>/site/register</InlineCode></td><td className="py-2">Create account + first organization.</td></tr>
                    <tr><td className="py-2 pr-4">POST</td><td className="py-2 pr-4"><InlineCode>/site/logout</InlineCode></td><td className="py-2">Revoke your site token.</td></tr>
                    <tr><td className="py-2 pr-4">GET</td><td className="py-2 pr-4"><InlineCode>/site/me</InlineCode></td><td className="py-2">Get current user + primary organization.</td></tr>
                    <tr><td className="py-2 pr-4">POST</td><td className="py-2 pr-4"><InlineCode>/site/provision</InlineCode></td><td className="py-2">Create org + live API key (see above).</td></tr>
                    <tr><td className="py-2 pr-4">GET</td><td className="py-2 pr-4"><InlineCode>/site/organizations/</InlineCode></td><td className="py-2">List all your organizations with API keys.</td></tr>
                    <tr><td className="py-2 pr-4">PUT</td><td className="py-2 pr-4"><InlineCode>{'/site/organizations/{id}/'}</InlineCode></td><td className="py-2">Update org settings (name, allowed origins, theme, etc.).</td></tr>
                  </tbody>
                </table>
              </div>
            </Subsection>
          </Section>

          <Section id="embedding" title="Embedding the Builder">
            <Subsection title="Basic iframe">
              <p>The simplest integration — works with any framework or plain HTML. For production, use session tokens instead of API keys (see Security section).</p>
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
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 pr-4 font-semibold text-foreground">Parameter</th>
                      <th className="py-2 pr-4 font-semibold text-foreground">Type</th>
                      <th className="py-2 font-semibold text-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr><td className="py-2 pr-4"><InlineCode>apiKey</InlineCode></td><td className="py-2 pr-4">string</td><td className="py-2">Your organization API key. Required unless using sessionToken.</td></tr>
                    <tr><td className="py-2 pr-4"><InlineCode>sessionToken</InlineCode></td><td className="py-2 pr-4">string</td><td className="py-2">Session token (recommended for production). Use instead of apiKey.</td></tr>
                    <tr><td className="py-2 pr-4"><InlineCode>showLogo</InlineCode></td><td className="py-2 pr-4">boolean</td><td className="py-2">Show/hide the MailCraft logo. Default: true.</td></tr>
                    <tr><td className="py-2 pr-4"><InlineCode>showExportHtmlButton</InlineCode></td><td className="py-2 pr-4">boolean</td><td className="py-2">Show/hide the Export HTML button. Default: true.</td></tr>
                    <tr><td className="py-2 pr-4"><InlineCode>themeMode</InlineCode></td><td className="py-2 pr-4">string</td><td className="py-2">Color mode: light, dark, or system.</td></tr>
                    <tr><td className="py-2 pr-4"><InlineCode>builderTheme</InlineCode></td><td className="py-2 pr-4">string</td><td className="py-2">One of: light-breeze, light-paper, dark-slate, dark-cosmos.</td></tr>
                    <tr><td className="py-2 pr-4"><InlineCode>chromeColor</InlineCode></td><td className="py-2 pr-4">string</td><td className="py-2">Custom hex color for the builder chrome/toolbar area.</td></tr>
                    <tr><td className="py-2 pr-4"><InlineCode>canvasColor</InlineCode></td><td className="py-2 pr-4">string</td><td className="py-2">Custom hex color for the editor canvas background.</td></tr>
                  </tbody>
                </table>
              </div>
            </Subsection>

            <Subsection title="React example">
              <Code>{`import { useEffect, useRef, useState } from 'react';

export function EmailBuilder({ sessionToken, onTemplateSaved }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (e.data?.source !== 'mailcraft') return;

      if (e.data.type === 'MAILCRAFT_TEMPLATE_SAVED') {
        // Template was saved to backend — you now have the ID
        onTemplateSaved({
          templateId: e.data.payload.templateId,
          templateName: e.data.payload.templateName,
        });
      }
    };
    window.addEventListener('message', handle);
    return () => window.removeEventListener('message', handle);
  }, [onTemplateSaved]);

  // Programmatically trigger a save (e.g., before sending an email)
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
              The builder communicates with its parent window using <InlineCode>window.postMessage</InlineCode>.
              Messages from the builder use <InlineCode>{'source: "mailcraft"'}</InlineCode>.
              Messages to the builder must use <InlineCode>{'source: "mailcraft-host"'}</InlineCode>.
            </p>

            <Subsection title="Events from the builder (listen)">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 pr-4 font-semibold text-foreground">Event</th>
                      <th className="py-2 pr-4 font-semibold text-foreground">Payload</th>
                      <th className="py-2 font-semibold text-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr><td className="py-2 pr-4"><InlineCode>MAILCRAFT_READY</InlineCode></td><td className="py-2 pr-4">{'{}'}</td><td className="py-2">Builder has loaded and is ready to receive commands.</td></tr>
                    <tr><td className="py-2 pr-4"><InlineCode>MAILCRAFT_SAVE</InlineCode></td><td className="py-2 pr-4">{'{ html, json }'}</td><td className="py-2">User clicked Save. Contains rendered HTML and template JSON.</td></tr>
                    <tr><td className="py-2 pr-4"><InlineCode>MAILCRAFT_TEMPLATE_SAVED</InlineCode></td><td className="py-2 pr-4">{'{ templateId, templateName }'}</td><td className="py-2">Template was persisted to the backend (new or updated). Use this to get the template ID for the render API.</td></tr>
                    <tr><td className="py-2 pr-4"><InlineCode>MAILCRAFT_AUTO_SAVE</InlineCode></td><td className="py-2 pr-4">{'{ json }'}</td><td className="py-2">Periodic auto-save with current template JSON (debounced).</td></tr>
                    <tr><td className="py-2 pr-4"><InlineCode>MAILCRAFT_ERROR</InlineCode></td><td className="py-2 pr-4">{'{ code, message }'}</td><td className="py-2">An error occurred (e.g., export failure).</td></tr>
                  </tbody>
                </table>
              </div>
            </Subsection>

            <Subsection title="Commands to the builder (send)">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 pr-4 font-semibold text-foreground">Command</th>
                      <th className="py-2 pr-4 font-semibold text-foreground">Payload</th>
                      <th className="py-2 font-semibold text-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr><td className="py-2 pr-4"><InlineCode>MAILCRAFT_INIT</InlineCode></td><td className="py-2 pr-4">{'{ apiKey, variables?, templateJson?, context? }'}</td><td className="py-2">Initialize with config. Can pass an initial template and theme overrides.</td></tr>
                    <tr><td className="py-2 pr-4"><InlineCode>MAILCRAFT_LOAD_TEMPLATE</InlineCode></td><td className="py-2 pr-4">{'{ json }'}</td><td className="py-2">Load a template JSON into the editor.</td></tr>
                    <tr><td className="py-2 pr-4"><InlineCode>MAILCRAFT_EXPORT</InlineCode></td><td className="py-2 pr-4">{'{}'}</td><td className="py-2">Trigger an export. Result comes back as MAILCRAFT_SAVE.</td></tr>
                    <tr><td className="py-2 pr-4"><InlineCode>MAILCRAFT_REQUEST_SAVE</InlineCode></td><td className="py-2 pr-4">{'{}'}</td><td className="py-2">Request the builder to save the current template. Result comes back as MAILCRAFT_TEMPLATE_SAVED.</td></tr>
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
            <p>All API endpoints require the <InlineCode>X-API-Key</InlineCode> header (except session creation). Base URL: <InlineCode>{`${DOMAIN}/api/v1`}</InlineCode></p>

            <Subsection title="Authentication">
              <Code>{`# Every request needs your API key
curl ${DOMAIN}/api/v1/templates \\
  -H "X-API-Key: mc_live_abc123..."`}</Code>
            </Subsection>

            <Subsection title="Templates CRUD">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 pr-4 font-semibold text-foreground">Method</th>
                      <th className="py-2 pr-4 font-semibold text-foreground">Endpoint</th>
                      <th className="py-2 font-semibold text-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr><td className="py-2 pr-4">GET</td><td className="py-2 pr-4"><InlineCode>/templates</InlineCode></td><td className="py-2">List all templates (yours + gallery).</td></tr>
                    <tr><td className="py-2 pr-4">POST</td><td className="py-2 pr-4"><InlineCode>/templates</InlineCode></td><td className="py-2">Create a template. Body: {'{ name, json_data, category?, tags? }'}.</td></tr>
                    <tr><td className="py-2 pr-4">GET</td><td className="py-2 pr-4"><InlineCode>{'/templates/{id}'}</InlineCode></td><td className="py-2">Get a single template with full JSON data.</td></tr>
                    <tr><td className="py-2 pr-4">PUT</td><td className="py-2 pr-4"><InlineCode>{'/templates/{id}'}</InlineCode></td><td className="py-2">Update a template.</td></tr>
                    <tr><td className="py-2 pr-4">DELETE</td><td className="py-2 pr-4"><InlineCode>{'/templates/{id}'}</InlineCode></td><td className="py-2">Delete a template.</td></tr>
                    <tr><td className="py-2 pr-4">GET</td><td className="py-2 pr-4"><InlineCode>{'/templates/{id}/preview'}</InlineCode></td><td className="py-2">Get rendered HTML preview with default variable values. Does not count against render quota.</td></tr>
                  </tbody>
                </table>
              </div>
            </Subsection>

            <Subsection title="Gallery">
              <Code>{`GET /api/v1/gallery
GET /api/v1/gallery?category=welcome`}</Code>
              <p>Returns pre-built gallery templates. Premium templates are visible to all but only usable on paid plans.</p>
            </Subsection>

            <Subsection title="Export HTML">
              <Code>{`POST /api/v1/export/html
Content-Type: application/json

{
  "json_data": { ... },       // Template JSON from the builder
  "variables_mode": "placeholders"  // or "defaults"
}`}</Code>
              <p>Converts template JSON to email-compatible HTML (table layout, inline CSS, VML for Outlook).</p>
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
              <p>Substitutes variables into the template and returns rendered HTML. All used variables must be provided (strict mode).</p>
            </Subsection>

            <Subsection title="Media">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 pr-4 font-semibold text-foreground">Method</th>
                      <th className="py-2 pr-4 font-semibold text-foreground">Endpoint</th>
                      <th className="py-2 font-semibold text-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr><td className="py-2 pr-4">GET</td><td className="py-2 pr-4"><InlineCode>/media</InlineCode></td><td className="py-2">List uploaded images. Supports ?q=search, ?sort=date|name|size, ?order=asc|desc.</td></tr>
                    <tr><td className="py-2 pr-4">POST</td><td className="py-2 pr-4"><InlineCode>/upload/presign</InlineCode></td><td className="py-2">Get a presigned S3 URL for uploading. Body: {'{ filename, content_type, file_size }'}.</td></tr>
                  </tbody>
                </table>
              </div>
            </Subsection>

            <Subsection title="Session">
              <p>Create a session token server-side, then pass it to the iframe instead of your API key. This keeps your API key secret.</p>
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
# }

# Then embed the builder with the session token:
# <iframe src="${DOMAIN}/builder/?sessionToken=sess_abc123..." ...>`}</Code>
              <p>Session tokens expire after 4 hours. All API endpoints accept <InlineCode>X-Session-Token</InlineCode> as an alternative to <InlineCode>X-API-Key</InlineCode>.</p>
              <p>To refresh config with an existing session token:</p>
              <Code>{`POST /api/v1/auth/session
X-Session-Token: sess_abc123...
Content-Type: application/json
{"origin": "https://your-domain.com"}
# Returns config without creating a new token`}</Code>
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
        "type": "text",         // heading, text, image, button, spacer,
                                // divider, columns, social, hero, html
        "data": { ... },        // Block-specific content
        "style": { ... }        // Block-specific styling
      }
    ]
  },
  "footer": { "blocks": [] }
}`}</Code>
            </Subsection>

            <Subsection title="Block types">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 pr-4 font-semibold text-foreground">Type</th>
                      <th className="py-2 font-semibold text-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr><td className="py-2 pr-4"><InlineCode>heading</InlineCode></td><td className="py-2">Large title text (H1–H3).</td></tr>
                    <tr><td className="py-2 pr-4"><InlineCode>text</InlineCode></td><td className="py-2">Rich text with formatting (bold, italic, links, colors).</td></tr>
                    <tr><td className="py-2 pr-4"><InlineCode>image</InlineCode></td><td className="py-2">Single image with optional link, alt text, and alignment.</td></tr>
                    <tr><td className="py-2 pr-4"><InlineCode>button</InlineCode></td><td className="py-2">CTA button with customizable colors, border radius, and link.</td></tr>
                    <tr><td className="py-2 pr-4"><InlineCode>spacer</InlineCode></td><td className="py-2">Adjustable vertical spacing.</td></tr>
                    <tr><td className="py-2 pr-4"><InlineCode>divider</InlineCode></td><td className="py-2">Horizontal line separator.</td></tr>
                    <tr><td className="py-2 pr-4"><InlineCode>columns</InlineCode></td><td className="py-2">Multi-column layout. Each column can contain nested blocks.</td></tr>
                    <tr><td className="py-2 pr-4"><InlineCode>social</InlineCode></td><td className="py-2">Social media icon links (Facebook, Twitter, LinkedIn, etc.).</td></tr>
                    <tr><td className="py-2 pr-4"><InlineCode>hero</InlineCode></td><td className="py-2">Full-width section with background image and text overlay.</td></tr>
                    <tr><td className="py-2 pr-4"><InlineCode>html</InlineCode></td><td className="py-2">Raw HTML code block for custom content.</td></tr>
                  </tbody>
                </table>
              </div>
            </Subsection>

            <Subsection title="Gallery templates">
              <p>
                Gallery templates are pre-built by MailCraft and available to all organizations. Some are marked as <strong className="text-foreground">premium</strong> and
                require a paid plan to use. Free users can preview them but cannot load them into the editor.
              </p>
            </Subsection>
          </Section>

          <Section id="variables" title="Variables">
            <p>
              Variables let your users insert dynamic placeholders like <InlineCode>{'{{user_name}}'}</InlineCode> into
              their templates. At render time, you provide the values and the API substitutes them.
            </p>

            <Subsection title="Defining available variables">
              <p>
                Configure variables per organization in <strong className="text-foreground">Dashboard → Email Builder → Available variables</strong>.
                Each variable has a key, label, type (text or URL), and optional default value.
              </p>
              <Code>{`// Variables appear in the builder's variable dropdown
{
  "key": "user_name",
  "label": "User Name",
  "type": "text",
  "defaultValue": "there"
}`}</Code>
            </Subsection>

            <Subsection title="Inserting variables in the builder">
              <p>
                Click the <strong className="text-foreground">{'{{ }} Variables'}</strong> button in the top toolbar to insert a variable
                at the cursor position in any focused field — rich text editors, heading inputs, button text, URLs, or any other text field.
                The dropdown shows all variables configured for the organization.
              </p>
            </Subsection>

            <Subsection title="Variable key rules">
              <p>
                Keys must match <InlineCode>{'[A-Za-z_][A-Za-z0-9_]*'}</InlineCode> — letters, digits, and underscores only,
                starting with a letter or underscore. Examples: <InlineCode>user_name</InlineCode>, <InlineCode>company_logo_url</InlineCode>.
              </p>
              <p>
                Whitespace inside braces is tolerated: <InlineCode>{'{{ user_name }}'}</InlineCode> and <InlineCode>{'{{user_name}}'}</InlineCode> are
                both valid and treated identically. Variables are substituted <strong className="text-foreground">recursively in every string field</strong> of the
                template JSON, regardless of block type.
              </p>
            </Subsection>

            <Subsection title="Rendering with variables">
              <Code>{`POST /api/v1/render
{
  "template_id": "your-template-uuid",
  "variables": {
    "user_name": "Jane Doe",
    "company_name": "Acme Inc"
  }
}
// Missing variables → 400 error with list of missing keys
// Variable values are HTML-escaped to prevent injection`}</Code>
            </Subsection>

            <Subsection title="Configuring variables via API">
              <p>
                Set available variables for an organization by updating its settings.
                These appear in the builder's variable dropdown for users of that organization.
              </p>
              <Code>{`PATCH /api/v1/site/organizations/{id}/
Authorization: Token <site_token>
Content-Type: application/json

{
  "available_variables": [
    { "key": "Name", "label": "Student Name", "defaultValue": "Student", "type": "text" },
    { "key": "unsubscribe_url", "label": "Unsubscribe Link", "type": "url" }
  ]
}`}</Code>
            </Subsection>
          </Section>

          <Section id="media" title="Media & Uploads">
            <p>Images are uploaded to S3 via presigned URLs. Each organization has isolated storage.</p>

            <Subsection title="Upload flow">
              <Code>{`// 1. Request a presigned upload URL
POST /api/v1/upload/presign
{
  "filename": "hero-banner.jpg",
  "content_type": "image/jpeg",
  "file_size": 245000
}
// Returns: { upload_url, file_url, image_id }

// 2. Upload the file directly to S3
PUT {upload_url}
Content-Type: image/jpeg
[binary file data]

// 3. Use file_url in your templates`}</Code>
            </Subsection>

            <Subsection title="Supported formats">
              <p>JPEG, PNG, GIF, WebP, and SVG. Max file size depends on your plan.</p>
            </Subsection>

            <Subsection title="Thumbnails">
              <p>
                After uploading an original image, you can upload a thumbnail by setting <InlineCode>{'kind: "thumbnail"'}</InlineCode> and
                providing the <InlineCode>image_id</InlineCode> from the original upload.
              </p>
            </Subsection>
          </Section>

          <Section id="plans" title="Plans & Limits">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 pr-4 font-semibold text-foreground">Feature</th>
                    <th className="py-2 pr-4 font-semibold text-foreground">Free</th>
                    <th className="py-2 pr-4 font-semibold text-foreground">Starter</th>
                    <th className="py-2 pr-4 font-semibold text-foreground">Pro</th>
                    <th className="py-2 font-semibold text-foreground">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr><td className="py-2 pr-4">Gallery templates</td><td className="py-2 pr-4">Free only</td><td className="py-2 pr-4">All</td><td className="py-2 pr-4">All</td><td className="py-2">All</td></tr>
                  <tr><td className="py-2 pr-4">Monthly renders</td><td className="py-2 pr-4">1,000</td><td className="py-2 pr-4">10,000</td><td className="py-2 pr-4">100,000</td><td className="py-2">Unlimited</td></tr>
                  <tr><td className="py-2 pr-4">Storage</td><td className="py-2 pr-4">1 GB</td><td className="py-2 pr-4">5 GB</td><td className="py-2 pr-4">25 GB</td><td className="py-2">100 GB</td></tr>
                  <tr><td className="py-2 pr-4">Max upload size</td><td className="py-2 pr-4">5 MB</td><td className="py-2 pr-4">10 MB</td><td className="py-2 pr-4">25 MB</td><td className="py-2">50 MB</td></tr>
                  <tr><td className="py-2 pr-4">Builder themes</td><td className="py-2 pr-4">All</td><td className="py-2 pr-4">All</td><td className="py-2 pr-4">All</td><td className="py-2">All + custom</td></tr>
                  <tr><td className="py-2 pr-4">Hide MailCraft logo</td><td className="py-2 pr-4">No</td><td className="py-2 pr-4">Yes</td><td className="py-2 pr-4">Yes</td><td className="py-2">Yes</td></tr>
                </tbody>
              </table>
            </div>
            <p>
              Plan limits are enforced server-side. When a limit is reached (e.g., render count or storage), the API returns
              a <InlineCode>402</InlineCode> or <InlineCode>413</InlineCode> error with a descriptive message.
            </p>
          </Section>

          <Section id="security" title="Security">
            <Subsection title="API key handling">
              <p>
                API keys are hashed with SHA-256 before storage — the raw key is never stored in the database.
                The key format <InlineCode>{'mc_{live|test}_{32hex}'}</InlineCode> indicates environment.
                Treat API keys like passwords: never expose them in client-side code.
              </p>
            </Subsection>

            <Subsection title="Secure embedding with session tokens (recommended)">
              <p>
                Instead of putting your API key in the iframe URL (where any user can inspect it),
                create a session token on your backend and pass only the token to the browser.
              </p>
              <Code>{`// Your backend (Node.js example)
app.get('/api/email-builder-session', async (req, res) => {
  const response = await fetch('${DOMAIN}/api/v1/auth/session', {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.MAILCRAFT_API_KEY,  // secret, never sent to browser
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ origin: 'https://your-domain.com' }),
  });
  const { token } = await response.json();
  res.json({ sessionToken: token });
});

// Your frontend
const { sessionToken } = await fetch('/api/email-builder-session').then(r => r.json());
const iframe = document.createElement('iframe');
iframe.src = \`${DOMAIN}/builder/?sessionToken=\${sessionToken}\`;
// API key never appears in the browser`}</Code>
              <p>
                Session tokens expire after 4 hours and are scoped to the same organization as the API key that created them.
                All API endpoints accept <InlineCode>X-Session-Token</InlineCode> header as an alternative to <InlineCode>X-API-Key</InlineCode>.
              </p>
            </Subsection>

            <Subsection title="Multi-tenancy">
              <p>
                All data is isolated per organization. Every database query is scoped through <InlineCode>TenantManager.for_org(org)</InlineCode>.
                An API key from one organization cannot access another organization's templates, media, or settings.
              </p>
            </Subsection>

            <Subsection title="Allowed origins">
              <p>
                Configure allowed origins per organization in the dashboard to restrict which domains can create sessions
                with your API key. The session endpoint validates the <InlineCode>Origin</InlineCode> header against your whitelist.
              </p>
            </Subsection>

            <Subsection title="iframe security">
              <p>
                The builder iframe uses <InlineCode>allow="clipboard-write"</InlineCode> for copy functionality.
                postMessage communication is filtered by <InlineCode>source</InlineCode> field to prevent cross-origin message spoofing.
                Always set a specific <InlineCode>targetOrigin</InlineCode> in production instead of <InlineCode>*</InlineCode>.
              </p>
            </Subsection>
          </Section>
        </div>
      </div>
    </div>
  );
}
