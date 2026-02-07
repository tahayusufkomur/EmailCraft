# MailCraft — Email HTML Compatibility Guide

## Overview

Email HTML is fundamentally different from web HTML. Most email clients (especially Outlook, Gmail, and Yahoo) strip or ignore modern CSS and HTML features. The export engine must produce HTML that works across all major clients.

---

## Target Email Clients

| Client | Engine | Key Limitations |
|--------|--------|-----------------|
| Gmail (Web) | Custom renderer | Strips `<style>` in `<head>`, no media queries in some views |
| Gmail (Mobile) | WebKit | Better CSS support, supports media queries |
| Outlook 2019+ | Word rendering engine | No `border-radius`, no `background-image` CSS, uses VML |
| Outlook 365 (Web) | Custom renderer | Similar to Gmail Web |
| Apple Mail | WebKit | Best CSS support, most forgiving |
| Yahoo Mail | Custom renderer | Strips some CSS, prefixes class names |
| Outlook.com | Custom renderer | Strips `<style>` in some cases |
| Samsung Mail | WebKit | Generally good support |
| Thunderbird | Gecko | Good CSS support |

---

## Core HTML Rules

### 1. Table-Based Layout (Mandatory)

```html
<!-- ✅ CORRECT — table layout -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
       align="center" style="margin: 0 auto;">
  <tr>
    <td style="padding: 20px; font-family: Arial, sans-serif; font-size: 14px; color: #333333;">
      Content here
    </td>
  </tr>
</table>

<!-- ❌ WRONG — div layout -->
<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
  Content here
</div>
```

**Rules:**
- Use `<table>` for all layout structure
- `role="presentation"` on layout tables (accessibility)
- Explicit `width`, `cellpadding="0"`, `cellspacing="0"`, `border="0"`
- Never use `<div>` for layout (use only for minor wrappers if needed)
- No `display: flex`, `display: grid`, or `float`

### 2. Inline CSS (Mandatory)

```html
<!-- ✅ CORRECT — inline styles -->
<td style="font-family: Arial, Helvetica, sans-serif; font-size: 16px;
           line-height: 24px; color: #333333; padding: 10px 20px;">
  Hello World
</td>

<!-- ❌ WRONG — class-based styles -->
<td class="content-text">Hello World</td>
```

**Rules:**
- All CSS must be inline via `style` attribute
- No `<style>` blocks in `<head>` (Gmail strips them)
- Exception: media queries in `<style>` for responsive (progressive enhancement)

### 3. Supported CSS Properties

| Property | Support | Notes |
|----------|---------|-------|
| `font-family` | ✅ Universal | Web-safe fonts only |
| `font-size` | ✅ Universal | Use `px`, not `em`/`rem` |
| `color` | ✅ Universal | Hex values (`#333333`) |
| `background-color` | ✅ Universal | On `<td>`, not `<tr>` |
| `padding` | ✅ Universal | On `<td>` elements |
| `margin` | ⚠️ Partial | Avoid. Use padding or spacer cells |
| `border` | ✅ Universal | Shorthand works |
| `border-radius` | ⚠️ Partial | Ignored by Outlook desktop |
| `text-align` | ✅ Universal | Use `align` attribute as fallback |
| `line-height` | ✅ Universal | Use `px` values |
| `width` / `height` | ✅ Universal | Use both CSS and HTML attributes |
| `max-width` | ⚠️ Partial | Not supported in Outlook |
| `background-image` | ❌ Outlook | Use VML fallback |
| `box-shadow` | ❌ Most | Avoid entirely |
| `display: flex/grid` | ❌ Most | Never use |
| `position` | ❌ Most | Never use |

### 4. Web-Safe Fonts

```
Primary stacks (pick one per template):
- Arial, Helvetica, sans-serif
- Georgia, "Times New Roman", Times, serif
- "Trebuchet MS", Helvetica, sans-serif
- Verdana, Geneva, sans-serif
- "Courier New", Courier, monospace
```

Custom web fonts (Google Fonts etc.) work only in Apple Mail, iOS Mail, and some Android clients. Always include a web-safe fallback.

---

## Block-to-HTML Conversion

### Text Block

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding: 10px 20px; font-family: Arial, Helvetica, sans-serif;
               font-size: 14px; line-height: 22px; color: #333333;">
      <p style="margin: 0 0 10px 0;">Hello <strong>{{first_name}}</strong>,</p>
      <p style="margin: 0;">Welcome to our newsletter.</p>
    </td>
  </tr>
</table>
```

**Notes:**
- Reset `<p>` margins explicitly (clients apply defaults)
- `<strong>` and `<em>` are safe
- Links: `<a href="..." style="color: #007bff; text-decoration: underline;" target="_blank">`

### Image Block

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding: 0;" align="center">
      <a href="https://example.com" target="_blank" style="text-decoration: none;">
        <img src="https://assets.mailcraft.io/uploads/org_123/hero.png"
             alt="Hero banner"
             width="600" height="300"
             style="display: block; max-width: 100%; height: auto; border: 0;"
        />
      </a>
    </td>
  </tr>
</table>
```

**Rules:**
- Always set `width` and `height` HTML attributes (Outlook needs them)
- `style="display: block"` removes phantom spacing below images
- `border: 0` removes blue border on linked images
- `max-width: 100%; height: auto;` for responsive (clients that support it)
- Always include `alt` text

### Button Block

Buttons in email are notoriously tricky. Two approaches:

**Approach A: Padding-based (simpler, no border-radius in Outlook)**

```html
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
  <tr>
    <td style="border-radius: 4px; background-color: #007bff;" align="center">
      <a href="https://example.com" target="_blank"
         style="display: inline-block; padding: 12px 24px; font-family: Arial, sans-serif;
                font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 4px;">
        Shop Now
      </a>
    </td>
  </tr>
</table>
```

**Approach B: VML button (full Outlook support with border-radius)**

```html
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
  <tr>
    <td align="center">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml"
                   xmlns:w="urn:schemas-microsoft-com:office:word"
                   href="https://example.com"
                   style="height:44px;v-text-anchor:middle;width:200px;"
                   arcsize="9%" fillcolor="#007bff" strokecolor="#007bff">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:Arial;font-size:16px;">Shop Now</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="https://example.com" target="_blank"
         style="display: inline-block; padding: 12px 24px; background-color: #007bff;
                color: #ffffff; font-family: Arial, sans-serif; font-size: 16px;
                text-decoration: none; border-radius: 4px;">
        Shop Now
      </a>
      <!--<![endif]-->
    </td>
  </tr>
</table>
```

### Divider Block

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding: 20px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-top: 1px solid #cccccc; font-size: 0; line-height: 0;" height="1">
            &nbsp;
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

**Spacer variant (no line):**
```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="font-size: 0; line-height: 0;" height="20">&nbsp;</td>
  </tr>
</table>
```

### Columns Block (2-Column)

```html
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center">
  <tr>
    <td>
      <!--[if mso]>
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="290" valign="top">
      <![endif]-->
      <div style="display: inline-block; width: 100%; max-width: 290px; vertical-align: top;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 0 10px;">
              <!-- Column 1 blocks here -->
            </td>
          </tr>
        </table>
      </div>
      <!--[if mso]>
          </td>
          <td width="290" valign="top">
      <![endif]-->
      <div style="display: inline-block; width: 100%; max-width: 290px; vertical-align: top;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 0 10px;">
              <!-- Column 2 blocks here -->
            </td>
          </tr>
        </table>
      </div>
      <!--[if mso]>
          </td>
        </tr>
      </table>
      <![endif]-->
    </td>
  </tr>
</table>
```

**Key technique:** `display: inline-block` with `max-width` creates columns that stack on mobile. MSO conditional comments provide fixed-width table cells for Outlook.

### Social Block

```html
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
  <tr>
    <td style="padding: 0 5px;">
      <a href="https://facebook.com/example" target="_blank">
        <img src="https://assets.mailcraft.io/icons/facebook-32.png"
             alt="Facebook" width="32" height="32"
             style="display: block; border: 0;" />
      </a>
    </td>
    <td style="padding: 0 5px;">
      <a href="https://x.com/example" target="_blank">
        <img src="https://assets.mailcraft.io/icons/twitter-32.png"
             alt="Twitter" width="32" height="32"
             style="display: block; border: 0;" />
      </a>
    </td>
    <td style="padding: 0 5px;">
      <a href="https://instagram.com/example" target="_blank">
        <img src="https://assets.mailcraft.io/icons/instagram-32.png"
             alt="Instagram" width="32" height="32"
             style="display: block; border: 0;" />
      </a>
    </td>
  </tr>
</table>
```

**Notes:**
- Social icons are hosted images (not font icons — email clients don't support icon fonts)
- Provide both colored and monochrome icon sets on CDN
- Pre-sized at common dimensions: 24px, 32px, 48px

---

## Full Email HTML Skeleton

```html
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>{{email_subject}}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles — progressive enhancement only */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }

    /* Responsive — only works in clients that support <style> */
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; }
      .mobile-padding { padding-left: 16px !important; padding-right: 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">

  <!-- Preheader text (hidden, shows in inbox preview) -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    {{preheader_text}}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;...
  </div>

  <!-- Full-width background wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px 0;">

        <!-- Constrained content area -->
        <table role="presentation" class="email-container" width="600" cellpadding="0"
               cellspacing="0" border="0" align="center"
               style="margin: 0 auto; background-color: #ffffff;">

          <!-- HEADER BLOCKS GO HERE -->

          <!-- BODY BLOCKS GO HERE -->

          <!-- FOOTER BLOCKS GO HERE -->

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
```

---

## Outlook-Specific Considerations

### Conditional Comments

```html
<!--[if mso]> Outlook only <![endif]-->
<!--[if !mso]><!--> Non-Outlook <!--<![endif]-->
```

### VML Background Colors

For background colors on `<td>` with content, Outlook sometimes needs VML:

```html
<td style="background-color: #007bff;">
  <!--[if mso]>
  <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false"
          style="width:600px; height:200px;">
    <v:fill type="tile" color="#007bff"/>
    <v:textbox inset="0,0,0,0" style="mso-fit-shape-to-text:true;">
  <![endif]-->
  <div style="padding: 20px;">
    Content here
  </div>
  <!--[if mso]>
    </v:textbox>
  </v:rect>
  <![endif]-->
</td>
```

### DPI Setting

Outlook renders at 96 DPI. Include this in the head:
```html
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings>
  <o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
```

---

## Dark Mode Considerations

Some email clients (Apple Mail, Outlook.com, Gmail app) apply dark mode transformations:

- Light backgrounds → dark backgrounds
- Dark text → light text
- Images may get inverted

**Mitigation:**
- Use `color-scheme: light dark;` and `supported-color-schemes: light dark;` in `<meta>`
- Add `[data-ogsc]` and `[data-ogsb]` overrides for Outlook.com dark mode
- For logos on transparent backgrounds: add a thin white border or use non-transparent PNGs

---

## Testing Checklist

Before releasing a gallery template or major export engine change:

- [ ] Gmail Web (Chrome)
- [ ] Gmail App (iOS + Android)
- [ ] Outlook Desktop (Windows, latest)
- [ ] Outlook 365 Web
- [ ] Apple Mail (macOS)
- [ ] iOS Mail
- [ ] Yahoo Mail (Web)
- [ ] Dark mode: Apple Mail, Gmail App, Outlook.com
- [ ] Mobile responsiveness: columns stack, images scale, text readable
- [ ] Variable placeholders render correctly: `{{first_name}}`
- [ ] All links clickable with `target="_blank"`
- [ ] Images load from CDN URLs
- [ ] Alt text visible when images blocked
- [ ] Preheader text shows in inbox preview

**Tools:**
- Litmus or Email on Acid for automated cross-client testing
- `htmlemailcheck.com` for free basic checks
- Manual spot-checks in personal accounts for final verification
