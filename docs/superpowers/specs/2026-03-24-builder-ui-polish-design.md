# Builder UI Polish — Design Spec

**Date:** 2026-03-24
**Scope:** `frontend-email-builder/` only — no backend changes

## Overview

Four UI improvements to the MailCraft email builder:

1. Switch from hand-crafted inline SVGs to Lucide React icons
2. Fix nested block toolbar visibility inside column slots
3. Restyle Save/Export action buttons with soft accent fill
4. Add info tooltips to block toolbars

---

## 1. Lucide React Icons

### Dependency

Add `lucide-react` to `frontend-email-builder/package.json` dependencies.

### Files and Replacements

**BlockWrapper.tsx** — Replace `IconGrip`, `IconDuplicate`, `IconTrash`, `IconStar` with Lucide imports:

| Current | Lucide Icon | Size |
|---------|-------------|------|
| `IconGrip` (custom SVG) | `GripVertical` | 14 |
| `IconDuplicate` (custom SVG) | `Copy` | 14 |
| `IconTrash` (custom SVG) | `Trash2` | 14 |
| `IconStar` (custom SVG) | `Star` | 14 |

Remove the `iconProps` constant and all four icon component definitions. Note: `IconStar` is also used inside the `showSaveInput` preset save bar (line 125) — replace that usage with `<Star size={14} />` as well.

**BlockPalette.tsx** — Replace `BLOCK_ICONS` record and all inline SVGs:

| Block Type | Lucide Icon | Size |
|------------|-------------|------|
| `heading` | `Heading` | 20 |
| `text` | `AlignLeft` | 20 |
| `image` | `Image` | 20 |
| `button` | `RectangleHorizontal` | 20 |
| `spacer` | `MoveVertical` | 20 |
| `divider` | `Minus` | 20 |
| `columns` | `Columns2` | 20 |
| `social` | `Share2` | 20 |
| `hero` | `ImagePlay` | 20 |
| `html` | `Code2` | 20 |

Section icons:
- Template section: `Settings` (size 16)
- Blocks section: `LayoutGrid` (size 16)

Other inline SVGs:
- Chevron expand/collapse: `ChevronDown` (size 12)
- Plus icon (no presets): `Plus` (size 12)
- Preset delete X: `X` (size 10)

Remove `svgProps` and `svgPropsSmall` constants.

Also replace the independent inline SVG chevron in `CollapsibleSection` (lines 212–219) with `<ChevronDown size={14} />` to match.

**App.tsx toolbar** — Replace all inline SVGs next to button labels:

| Button | Lucide Icon | Size |
|--------|-------------|------|
| Templates | `LayoutGrid` | 16 |
| Media | `Image` | 16 |
| Preview | `Eye` | 16 |
| Code | `Code2` | 16 |
| Save | `Save` | 16 |
| Export | `Download` | 16 |

**ColumnsBlock.tsx NestedBlockWrapper** — Replace unicode chars with Lucide icons matching BlockWrapper:

| Current | Lucide Icon | Size |
|---------|-------------|------|
| `☰` (U+2630) | `GripVertical` | 14 |
| `⎘` (U+2398) | `Copy` | 14 |
| `✕` (U+2715) | `Trash2` | 14 |

---

## 2. Nested Block Toolbar Visibility

### Problem

Block toolbars are positioned `absolute; top: -40px` above their block. Inside column slots, the toolbar is clipped because column containers constrain overflow. The nested toolbar in `ColumnsBlock.tsx` also uses raw unstyled `<button>` elements instead of the `block-toolbar-btn` class.

### Solution

**App.css changes:**

- `.column-slot`: Add `overflow: visible`
- `.column-block-list`: Add `overflow: visible`
- `.column-slot`: Add `padding-top: 36px` so the first nested block's toolbar has room above it
- `.nested-block-wrapper .block-toolbar`: Set `z-index: 12`

**ColumnsBlock.tsx changes:**

- Refactor `NestedBlockWrapper` toolbar to use `block-toolbar-btn` classes matching `BlockWrapper`
- Use same Lucide icons as BlockWrapper (GripVertical, Copy, Trash2)
- Add the Info button (see section 4)
- Add `block-toolbar-sep` divider before danger button

---

## 3. Action Button Restyle

### Problem

Save and Export use the default solid primary button style (blue), which feels heavy and doesn't adapt to the builder theme.

### Solution

**App.css — New `.toolbar-action-btn` class:**

Add a new `--accent-border` CSS variable to each theme preset (alongside the existing `--accent-soft`):
- light-breeze: `--accent-border: rgba(56, 189, 248, 0.2)`
- light-paper: `--accent-border: rgba(180, 83, 9, 0.2)`
- dark-slate: `--accent-border: rgba(56, 189, 248, 0.25)`
- dark-cosmos: `--accent-border: rgba(244, 114, 182, 0.25)`

```css
.toolbar-action-btn {
  background: var(--accent-soft);
  color: var(--accent-color);
  border: 1px solid var(--accent-border);
}

.toolbar-action-btn:hover {
  background: var(--accent-border);
  color: var(--accent-hover);
}
```

Note: Avoids `rgba(from var(...))` relative color syntax which lacks Firefox support.

This uses theme-aware CSS variables already defined per theme preset:
- light-breeze: sky blue accent
- light-paper: amber accent
- dark-slate: sky blue accent
- dark-cosmos: pink accent

**App.tsx changes:**

- Save button: `<Button variant="ghost" size="sm" className="toolbar-action-btn">`
- Export button: `<Button variant="ghost" size="sm" className="toolbar-action-btn">`

---

## 4. Info Tooltips on Block Toolbar

### Block Descriptions

A `Record<BlockType, string>` constant defined in `src/lib/blockDescriptions.ts` (shared by both `BlockWrapper` and `ColumnsBlock` to avoid coupling them):

```typescript
const BLOCK_DESCRIPTIONS: Record<BlockType, string> = {
  heading: 'Large title text for section headers',
  text: 'Rich text content with formatting options',
  image: 'Single image with optional link and alt text',
  button: 'Call-to-action button with customizable style',
  spacer: 'Adjustable vertical spacing between blocks',
  divider: 'Horizontal line separator',
  columns: 'Multi-column layout — drag blocks into each column',
  social: 'Social media icon links',
  hero: 'Full-width hero section with background image and overlay',
  html: 'Raw HTML code block for custom content',
};
```

### Toolbar Button

**BlockWrapper.tsx** — Add an Info button between Save preset and the separator:

```tsx
<button className="block-toolbar-btn block-toolbar-info" data-tooltip={BLOCK_DESCRIPTIONS[block.type]}>
  <Info size={14} />
</button>
```

**ColumnsBlock.tsx** — Same info button in `NestedBlockWrapper`, positioned before the `block-toolbar-sep` divider (which will be added as part of section 2's toolbar unification).

### CSS Tooltip

**App.css — Pure CSS tooltip using `data-tooltip` attribute:**

```css
.block-toolbar-info {
  position: relative;
}

.block-toolbar-info:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: #0f172a;
  color: rgba(255, 255, 255, 0.9);
  font-size: 11px;
  font-weight: 400;
  padding: 6px 10px;
  border-radius: 6px;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  pointer-events: none;
  z-index: 20;
}
```

Tooltip appears below the toolbar on hover, matching the dark toolbar aesthetic.

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `package.json` | Add `lucide-react` dependency |
| `src/App.tsx` | Replace toolbar SVGs with Lucide, restyle Save/Export buttons |
| `src/App.css` | Add `.toolbar-action-btn`, fix column overflow, add tooltip CSS |
| `src/components/Editor/BlockWrapper.tsx` | Replace icon SVGs with Lucide, add Info button with tooltip |
| `src/components/Panels/BlockPalette.tsx` | Replace all SVGs with Lucide icons |
| `src/components/Blocks/ColumnsBlock.tsx` | Unify nested toolbar with BlockWrapper style, add Lucide icons + Info button |

New file:
| `src/lib/blockDescriptions.ts` | `BLOCK_DESCRIPTIONS` constant shared by BlockWrapper and ColumnsBlock |
