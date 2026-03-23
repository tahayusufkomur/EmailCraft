# Brevo Email Template Analysis & MailCraft Design System Gap Report

## Reference Material
- 48 template thumbnails stored in `docs/brevo-ref/`
- 17 categories: Anniversary, Announcement, Blog Post, Confirmation, Feedback, Greetings, New Product, Notification, Onboarding, Progress, Re-engagement, Release, Reminder, Sale, Special Offer, Thank You, Welcome

---

## Patterns Observed Across All Brevo Templates

### 1. Section-Level Background Colors (CRITICAL GAP)
Every Brevo template uses **distinct background colors per section**, not just per-block. Examples:
- **Welcome3**: White header, beige/cream hero area, dark navy footer
- **Confirmation**: Purple branded header, white content card, gray address section, white line items
- **Sale2**: Dark navy hero, white product grid, navy product cards
- **Re-engagement**: Full-bleed photo header, white content, dark navy article grid

**Our gap**: We only have `backgroundColor` on `BlockStyle` (per-block) and global `bodyBackgroundColor`. We can't make a footer section dark navy and body white without hacking each block's background individually. Sections (header/body/footer) need their own background color.

### 2. Full-Bleed / Edge-to-Edge Images (CRITICAL GAP)
Many templates use images that span the **full width of the email** (edge-to-edge, no padding):
- Welcome3: Hero image with text overlay concept
- Re-engagement: Full-bleed landscape photo as header
- Sale2: Full-width dark navy hero banner
- New Products4: Full-width fashion hero
- Blog Post5: Full-width pastel content area

**Our gap**: Images always have padding from the block wrapper. There's no way to make an image truly full-bleed (0 padding AND flush to email edges). The `padding` default on images prevents this layout.

### 3. Rounded Images / Circular Avatars (HIGH IMPACT GAP)
Multiple templates use **circular profile images** and **rounded image corners**:
- Welcome1 (Soul Stretch): 4 circular coach headshots in a row
- Blog Post5: Circular author photo
- Onboarding2: Rounded illustration corners

**Our gap**: `ImageBlock` has no `borderRadius` property. This is one of the most visually impactful missing features. Circular avatars (border-radius: 50%) are a staple of modern email design.

### 4. Outlined / Ghost Buttons (HIGH IMPACT GAP)
Many templates use **outline-style buttons** (transparent bg, colored border):
- Welcome3: "MANAGE MY ACCOUNT" — rounded outline on cream background
- Special Offer15: "Take the deal" — white outline on dark background
- Sale2: "SHOP NOW", "EXPLORE" — white/light outline buttons
- Re-engagement: "PLAN A NEW TRIP" — rounded outline
- Confirmation: "Continue shopping" — teal/cyan outline ghost button

**Our gap**: `ButtonBlock` has `borderStyle`, `borderColor`, `borderWidth` but no concept of a "ghost/outline" variant where `backgroundColor` is transparent. We'd need to support `backgroundColor: 'transparent'` or add a `variant: 'filled' | 'outline'` property.

### 5. Text Over Images / Hero Banners (HIGH IMPACT GAP)
Several templates place **text directly on top of images**:
- Re-engagement: "Hey Mr. Smith, It's been a long time" over a sunset landscape
- Sale2: "SPECIAL CYBER MONDAY NEWS" over dark navy
- New Products4: "YOU DESERVE THE BEST" overlaid on photo
- Special Offer15: "BLACK FRIDAY SPECIAL" with countdown timer over dark bg

**Our gap**: No text-over-image capability. This requires either:
- A "hero" block type (image background + text + button overlay)
- Or the ability to set a background image on sections/blocks

This is the single most visually distinctive pattern in professional email templates.

### 6. Consistent Footer Pattern (MEDIUM GAP)
Almost every Brevo template has a **structured footer** with:
- Dark background (navy #2d3748 or dark gray)
- 2-column layout: Company info (left) + Legal links (right)
- Social icons row
- "Find us" or "Follow us" label
- Unsubscribe / Privacy / Imprint links

**Our gap**: Our templates don't enforce this structure. A "footer section background color" in template settings would help. Also, having a few footer presets would improve every template instantly.

### 7. Decorative Elements & Visual Separators (MEDIUM GAP)
Brevo templates use creative visual separators beyond simple line dividers:
- Dot patterns (Welcome1: colored dot row between sections)
- Small decorative shapes (Blog Post5: diamond shapes, colored squares)
- Colored accent bars (Confirmation: thin colored stripe at section transitions)
- Illustrations between content areas

**Our gap**: Our divider block only does horizontal lines. We could enhance it with a `variant` option (line, dots, spacer-with-accent) but this is lower priority.

### 8. Column Background Colors (MEDIUM GAP)
Several templates color **individual columns differently**:
- Special Offer15: Left column tan, right column white (alternating)
- Anniversary: Side-by-side colored reward cards (teal, yellow, red)
- Confirmation: Gray address section with 2 columns on gray bg

**Our gap**: `Column` interface has no `backgroundColor`. Columns are just containers for blocks. Adding `backgroundColor` to each column would enable card-like layouts.

### 9. Letter Spacing & Text Transform on Headings (LOW-MEDIUM GAP)
Very common pattern across Brevo templates:
- Small uppercase labels: "MANAGE MY ACCOUNT", "SHOP NOW", "EXPLORE"
- Wide letter-spacing on brand names and subheads
- Mixed case within same heading (e.g., "the**Space.**")

**Our gap**: `HeadingBlock` has no `letterSpacing` or `textTransform`. `ButtonBlock` already has both — just need to extend to headings.

### 10. Body/Content Border Radius (LOW-MEDIUM GAP)
Some templates round the content area corners where it sits against the outer background:
- Confirmation: Content card has rounded corners against purple background
- Welcome3: Beige card area has subtle rounding

**Our gap**: `TemplateSettings` has no `bodyBorderRadius`. Adding 8-16px would modernize every template.

---

## Priority-Ranked Design System Changes

### P0 — Critical (blocks looking "professional")
| Change | Where | Impact |
|--------|-------|--------|
| Section background colors | `TemplateSettings` + export engine | Every template looks richer |
| Image border radius | `ImageBlock.style` + export engine | Enables circular avatars, rounded photos |
| Full-bleed image support | `ImageBlock.style.fullWidth` flag | Hero banners, edge-to-edge images |

### P1 — High Impact
| Change | Where | Impact |
|--------|-------|--------|
| Ghost/outline button variant | `ButtonBlock.style` | The most common button style in Brevo |
| Heading letterSpacing + textTransform | `HeadingBlock.style` | Uppercase subheads, brand typography |
| Body border radius | `TemplateSettings.bodyBorderRadius` | Content card effect on every template |
| Column background colors | `Column` interface | Card grids, alternating sections |

### P2 — Medium Impact
| Change | Where | Impact |
|--------|-------|--------|
| Footer section background | `TemplateSettings.footerBackgroundColor` | Consistent dark footer pattern |
| Header section background | `TemplateSettings.headerBackgroundColor` | Branded header areas |
| Image as section/block background | New capability | Text-over-image heroes (complex) |

### P3 — Nice to Have
| Change | Where | Impact |
|--------|-------|--------|
| Divider variants (dots, etc.) | `DividerBlock.style.variant` | Visual variety |
| 4-column grid in columns | `ColumnsBlock.data.columnCount: 4` | Avatar rows, small grids |

---

## Implementation Order Recommendation

**Phase 1 — Quick wins (types + settings panels + export engine):**
1. Image `borderRadius`
2. Heading `letterSpacing` + `textTransform`
3. Body `borderRadius` in TemplateSettings
4. Section background colors (header/footer)

**Phase 2 — Layout improvements:**
5. Column `backgroundColor`
6. Full-bleed image flag
7. Ghost/outline button support

**Phase 3 — Advanced:**
8. Hero block (text-over-image) or section background images
9. 4-column support
10. Divider variants

---

## Categories We Should Add
Based on Brevo's taxonomy, our 5 categories (welcome, newsletter, promotional, transactional, event) are missing:
- **Feedback** (survey, review request)
- **Onboarding** (step-by-step setup)
- **Re-engagement** (win-back, we miss you)
- **Announcement** (company news, updates)
- **Notification** (activity alerts, status updates)

These would give us 10 categories and match industry expectations.
