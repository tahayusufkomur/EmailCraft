---
version: 1
slug: "backend-templates-api-templates"
primary_target: "backend/templates_api/templates"
related_targets: []
---

Scope: the 15 gallery templates in backend/templates_api/templates (builder gallery, dashboard Templates page, org "provided" copies, AI exemplars). Visitor mode: Persuade (each template is a brand's marketing or transactional email; the set is MailCraft's showcase).

Audience: developers judging what MailCraft can produce, and end users picking a starting point to rebrand. Job: open one, believe it is a real brand's email, and adapt it. Constraints: blocks only (no html blocks), 600px, survives Gmail (no web fonts, no head styles in some views, no SVG images) and Outlook desktop (no radius, VML backgrounds). Content is fictional but specific and correct; no MailCraft claims.

## Direction contract

THESIS: Fifteen brands, fifteen hands. Each template is the email one specific invented brand would really send, built from an artefact of that brand's own world (ledger pad, eye chart, sampler, transit diagram, VU meter, seed packet, trail blaze, lowbrow panel, forge floor, shipping label, rail ticket, thermal receipt, programme grid, provenance ribbon, CRT high-score screen). It refuses the category default the old set shipped: photo hero with centred headline and pill button, a row of icon cards, a dark CTA slab, an italic quote.

OWN-WORLD: No shared palette or type voice across the set. Each brand commits to its artefact's real colours at page scale (ledger green, duochrome red/green, indigo linen, transit line colour, meter ivory with red only past zero, packet tomato/leaf, blaze red/white, candy lacquer with black outline, forge black with heat orange, label stock, rail red, receipt white on counter grey, programme black/one accent, archival buff with one red ribbon, phosphor black with a 16-colour sprite palette). Square corners unless the artefact is round. Every design holds in its system-font fallback.

STORY: The reader recognises the brand's world in the first screen, understands the one thing the email is for, and finds the action inside the artefact (the ledger's total line, the eye chart's last line, the ticket's stub, the receipt's footer).

FIRST VIEWPORT: Per template, the first 600×700 shows brand mark, the artefact-led hook at display scale, and the primary action or the key fact (code, tracking number, seat, sale date) without scrolling. No full-bleed photo hero with overlaid centred copy as the opener.

FORM: Collection of brand worlds; the assigned direction (index 4 of the grounded list) is the Northline transit-diagram newsletter (gallery order is the gallery UI's, not set by this build); dealt challengers fused as brand worlds: VU meter bridge (Low Ohm), forge scale shower (Forge & Temper), provenance ribbon (Harrow & Vale), lowbrow gallery panel (Devil's Garage), CRT arcade pixel glow (Night Shift), sampler alphabet proof (Madder & Indigo). Seed key 46926272.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Memorable moment: the gallery grid itself, fifteen thumbnails that share nothing but quality.
Unresolved: Social/Lucide icons are SVG data URIs that Gmail and Outlook drop; templates avoid them (text links instead) until the engine serves raster icons.
