# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Developers and SaaS teams** who embed MailCraft in their own product (iframe + `MailCraft.init()` loader + postMessage bridge) or render templates through the REST API. They evaluate MailCraft on the quality of what the editor can produce.
- **Their end users** (marketers, shop owners, studio and event organisers working inside the host app) who open the drag-and-drop editor, pick a gallery template, and swap in their own brand, copy and images.

## Product Purpose

MailCraft is an embeddable email template builder. End users design emails visually; the output is email-client-compatible HTML (table layout, inline CSS, VML fallbacks) plus re-editable block JSON. MailCraft builds and renders templates; it does not send email. Success means a host app can offer a studio-grade email editor without building one, and the HTML it exports renders correctly in real inboxes.

## Positioning

A drop-in editor, a render API and an AI generator that share one block model. AI output is MailCraft block JSON validated against a schema, never free HTML, and AI imagery comes from pix4less and is copied into the org's own storage so templates never hold signed URLs.

## Operating Context

- Gallery templates appear in the builder's gallery modal, on the dashboard Templates page, and are cloned into every organisation as "provided" templates (premium ones locked on the free plan).
- Two random gallery templates from the requested category are sent to the AI generator as exemplars, so gallery quality directly sets AI output quality.
- Exported emails are read in Gmail (web strips `<head>` styles in some views and ignores web fonts), Outlook desktop (Word engine: no border-radius, no CSS background images), Apple Mail / iOS (best support), Yahoo, Outlook.com and Samsung Mail.

## Capabilities and Constraints

- Block types: text, heading, image, button, divider, spacer, columns (1–3 columns, ratio, per-column background/padding/radius/background image), social, hero, card, list, profile, html. Gallery and AI templates must not use `html` blocks.
- Categories: welcome, newsletter, promotional, transactional, event. Templates carry `is_premium` and tags.
- Merge variables use `{{key}}`; the render API is strict and rejects a render when any used variable is missing.
- Content width 600px; table-based layout; inline CSS; web fonts only load in Apple Mail, iOS Mail and some Android clients, so every design must hold in its system-font fallback.
- Social and Lucide icons are rendered as SVG data URIs, which Gmail and Outlook do not display.

## Brand Commitments

- Product name MailCraft; live at https://mailcraft.contentor.app.
- Gallery templates represent invented brands across a broad range of industries; each one is a distinct, believable brand with its own visual identity.

## Evidence on Hand

- No customer names, testimonials, usage numbers or press are on hand. Do not fabricate any for MailCraft itself.
- Gallery brands, products, prices and people are fictional demonstration content and must read as plausible, internally consistent and correct for their category.

## Product Principles

1. A template is judged in the worst inbox, not the browser preview: it must survive Gmail and Outlook with system fonts and no rounded corners.
2. Every gallery template is a believable email a real brand would send, with specific, correct content for its job.
3. Templates are starting points: built from editable blocks, with structure an end user can restyle without breaking it.
4. Variety is the showcase: no two templates share a layout formula, palette or type voice.
5. Assets are owned and durable: no hotlinked, expiring or text-garbled images.

## Accessibility & Inclusion

Email baseline: body text at least 15px, 4.5:1 contrast for text, meaningful alt text on every content image, real text instead of text baked into images, descriptive link and button labels, `role="presentation"` on layout tables.
