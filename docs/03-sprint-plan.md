# MailCraft — 1-Week Sprint Plan

## Sprint Goal

Deliver a working MVP: an embeddable email template builder with drag-and-drop editing, 7 block types, variable support, template gallery, and email-compatible HTML export.

---

## Day 1: Project Setup & Backend Foundation

### Morning — Backend

- [ ] Initialize Django project with DRF
- [ ] Configure PostgreSQL connection
- [ ] Create models: `Organization`, `ApiKey`, `Template`, `UploadedImage`
- [ ] Run initial migrations
- [ ] Implement API key authentication middleware
- [ ] Implement origin whitelist middleware
- [ ] Create tenant context middleware (attach `org` to every request)

### Afternoon — Frontend + S3

- [ ] Initialize React + TypeScript project (Vite)
- [ ] Configure build pipeline (dev + production)
- [ ] Set up S3 bucket with proper policies (private, CORS for presigned uploads)
- [ ] Implement presigned URL endpoint (`POST /api/upload/presign`)
- [ ] Create basic project structure (components/, lib/, hooks/, types/)
- [ ] Build editor layout skeleton: 3-panel layout (left sidebar, center canvas, right panel)

### Day 1 Deliverable
Backend running with auth middleware, database models created. Frontend skeleton renders 3-panel layout.

---

## Day 2: Block System Foundation

### Morning — Type System & State

- [ ] Define TypeScript types for all 7 block types (`blocks.ts`)
- [ ] Implement editor state management (`useEditor` hook with `useReducer` or Zustand)
- [ ] Block CRUD operations: add, update, delete, reorder
- [ ] Implement `BlockRenderer.tsx` — routes block type to correct component

### Afternoon — Core Blocks (Part 1)

- [ ] **TextBlock** — rich text editing (bold, italic, link, color, font size) using Tiptap/Slate
- [ ] **ImageBlock** — S3 upload integration, alt text, link wrapping, width control
- [ ] **ButtonBlock** — text, URL, background color, border-radius, alignment
- [ ] **DividerBlock** — line style (solid/dashed/dotted), thickness, spacing
- [ ] Wire up right panel: selecting a block shows its settings in the style panel

### Day 2 Deliverable
Can add Text, Image, Button, Divider blocks. Selecting a block shows editable properties in the right panel.

---

## Day 3: Advanced Blocks & Drag-and-Drop

### Morning — Remaining Blocks

- [ ] **ColumnsBlock** — 2 or 3 column layout, each column accepts nested blocks
- [ ] **SocialBlock** — platform picker (Facebook, Twitter/X, Instagram, LinkedIn, YouTube), URL per icon, icon size
- [ ] **HeaderFooterBlock** — predefined sections, shared across template, always top/bottom

### Afternoon — Drag & Drop

- [ ] Integrate `@dnd-kit/core` + `@dnd-kit/sortable`
- [ ] Drag from block palette (left panel) → drop onto canvas
- [ ] Reorder blocks within canvas via drag
- [ ] Drag blocks into column slots (nested DnD)
- [ ] Visual indicators: drop zones, insertion lines, hover highlights
- [ ] Block duplication (copy button on hover)
- [ ] Block deletion (trash button on hover)

### Day 3 Deliverable
All 7 block types working. Full drag-and-drop: add from palette, reorder, nest in columns.

---

## Day 4: Variable System & Style Panel

### Morning — Variables

- [ ] Implement `VariableInserter` component (dropdown/chip picker in text blocks)
- [ ] Variables passed via init config are available as insertable tokens
- [ ] Variables render as styled chips in the editor: `[First Name]`
- [ ] Variables output as `{{first_name}}` in HTML export
- [ ] Variable preview mode: toggle to see default values rendered

### Afternoon — Style Panel Polish

- [ ] Global template settings: background color, content width, default font
- [ ] Per-block settings refinement:
  - Text: font family, size, color, line height, alignment, padding
  - Image: width (px or %), alignment, border, border-radius, padding
  - Button: font, padding, border, full-width toggle
  - Columns: column gap, vertical alignment, mobile stacking behavior
  - Social: icon style (colored/monochrome), layout (horizontal/vertical), spacing
- [ ] Color picker component (hex input + preset palette)
- [ ] Spacing controls (padding/margin per block)

### Day 4 Deliverable
Variables insertable and visible in editor. Style panel allows granular control of every block type.

---

## Day 5: HTML Export Engine & Preview

### Morning — Email HTML Export

- [ ] Build `htmlExporter.ts` — converts JSON block tree → email-compatible HTML
- [ ] Table-based layout (no div/flexbox)
- [ ] Inline all CSS (no `<style>` tags)
- [ ] Max width: 600px centered
- [ ] Web-safe fonts only (Arial, Helvetica, Georgia, Times New Roman)
- [ ] Image tags with explicit `width` and `height` attributes
- [ ] VML fallbacks for Outlook (background colors, buttons)
- [ ] `target="_blank"` on all links
- [ ] Variables remain as `{{variable_name}}` in output

### Afternoon — Preview & Server Export

- [ ] Desktop preview (600px rendered view)
- [ ] Mobile preview (320px width simulation)
- [ ] Variable preview toggle (show `{{name}}` vs show default values)
- [ ] Implement `POST /api/export/html` endpoint (server-side rendering)
- [ ] Server validates JSON structure before rendering
- [ ] Server sanitizes all text content (XSS prevention)
- [ ] Return `{ html, json }` response

### Day 5 Deliverable
Full HTML export working. Preview shows desktop and mobile. Export produces email-client-ready HTML.

---

## Day 6: Template Gallery & CRUD API

### Morning — Backend APIs

- [ ] `GET /api/templates` — list org's templates (paginated)
- [ ] `POST /api/templates` — save new template
- [ ] `PUT /api/templates/:id` — update template
- [ ] `DELETE /api/templates/:id` — delete template
- [ ] `GET /api/gallery` — list prebuilt templates (global, read-only)
- [ ] Auto-save endpoint (draft save, debounced)

### Afternoon — Gallery UI & Templates

- [ ] Create 5-10 prebuilt templates as JSON:
  - Welcome email
  - Newsletter
  - Promotional / sale
  - Event invitation
  - Order confirmation
  - Password reset
- [ ] Template gallery UI (grid with thumbnails)
- [ ] Click to load template into editor
- [ ] "Save as template" flow
- [ ] Template name + thumbnail generation (HTML → image snapshot or placeholder)

### Day 6 Deliverable
Template CRUD fully working. Gallery shows prebuilt templates, user can load, edit, and save.

---

## Day 7: iframe Embed, SDK & Polish

### Morning — Embed System

- [ ] Build `mailcraft-loader.js` — lightweight script (~5KB) that developers include:
  ```javascript
  // Developer includes this on their page:
  // <script src="https://cdn.mailcraft.io/loader.js"></script>
  
  MailCraft.init({
    apiKey: "mc_live_xxx",
    container: "#email-builder",
    variables: [...],
    onSave: (output) => { ... },
    onError: (error) => { ... }
  });
  ```
- [ ] Loader: validates config → calls `/api/auth/session` → creates iframe → sets up postMessage bridge
- [ ] Session token flow: backend returns short-lived token, iframe uses it for all API calls
- [ ] `MailCraft.destroy()` — cleanup method
- [ ] `MailCraft.loadTemplate(json)` — programmatic template loading

### Afternoon — Testing & Polish

- [ ] Test iframe embed on a sample host page
- [ ] Test origin whitelist (blocked domain should fail)
- [ ] Test API key validation (invalid key should fail)
- [ ] Email HTML output spot-check (Gmail, Outlook web, Apple Mail)
- [ ] Fix critical UI bugs
- [ ] Responsive editor layout (minimum viable for tablet)
- [ ] Error states: loading spinner, network errors, invalid key message
- [ ] Create minimal landing page with code examples
- [ ] Write basic README / quickstart docs

### Day 7 Deliverable
Fully working embedded widget. Developer can integrate with a script tag + `MailCraft.init()`. Email output tested on major clients.

---

## Definition of Done (MVP)

- [ ] Developer can embed editor via `<script>` + `MailCraft.init()`
- [ ] API key + origin validation working
- [ ] All 7 block types functional with drag-and-drop
- [ ] Variables can be inserted and appear in HTML output
- [ ] HTML export produces email-client-compatible output
- [ ] Desktop and mobile preview working
- [ ] Template save/load/delete working
- [ ] Gallery with 5+ prebuilt templates
- [ ] Image upload to S3 working
- [ ] Basic error handling and loading states

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Columns + nested DnD too complex | High | Simplify to 2-col only, no nesting beyond 1 level |
| Email HTML rendering bugs | Medium | Use MJML as fallback rendering engine if custom is too slow |
| Rich text editor integration slow | Medium | Start with basic contenteditable, upgrade to Tiptap if time allows |
| S3 CORS issues | Low | Pre-configure CORS policy on Day 1, test upload immediately |
| Outlook VML fallbacks complex | Medium | Limit to background colors only in MVP, skip rounded buttons |
