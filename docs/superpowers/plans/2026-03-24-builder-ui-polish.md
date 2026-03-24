# Builder UI Polish Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the email builder UI with consistent Lucide icons, visible nested block toolbars, theme-aware action buttons, and info tooltips on blocks.

**Architecture:** All changes are in `frontend-email-builder/`. Add `lucide-react` dependency, then update 5 files (BlockWrapper, BlockPalette, App, ColumnsBlock, App.css) plus create 1 new file (blockDescriptions.ts). No backend changes.

**Tech Stack:** React, TypeScript, Lucide React, CSS

**Spec:** `docs/superpowers/specs/2026-03-24-builder-ui-polish-design.md`

---

## Chunk 1: Foundation — Dependency + Shared Module

### Task 1: Install lucide-react

**Files:**
- Modify: `frontend-email-builder/package.json`

- [ ] **Step 1: Install lucide-react**

```bash
cd frontend-email-builder && npm install lucide-react
```

- [ ] **Step 2: Verify installation**

```bash
cd frontend-email-builder && node -e "require('lucide-react')" && echo OK
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add frontend-email-builder/package.json frontend-email-builder/package-lock.json
git commit -m "chore: add lucide-react dependency to email builder"
```

---

### Task 2: Create blockDescriptions.ts

**Files:**
- Create: `frontend-email-builder/src/lib/blockDescriptions.ts`

- [ ] **Step 1: Create the file**

```typescript
import type { BlockType } from '../types/blocks';

export const BLOCK_DESCRIPTIONS: Record<BlockType, string> = {
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

- [ ] **Step 2: Type-check**

```bash
cd frontend-email-builder && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend-email-builder/src/lib/blockDescriptions.ts
git commit -m "feat: add block descriptions constant for info tooltips"
```

---

## Chunk 2: BlockWrapper — Lucide Icons + Info Tooltip

### Task 3: Replace BlockWrapper icons with Lucide + add Info button

**Files:**
- Modify: `frontend-email-builder/src/components/Editor/BlockWrapper.tsx`

- [ ] **Step 1: Replace imports and remove custom SVG icons**

Remove lines 9–22 (the `iconProps` constant and all four `Icon*` components). Add Lucide imports at the top:

```typescript
import { GripVertical, Copy, Trash2, Star, Info } from 'lucide-react';
import { BLOCK_DESCRIPTIONS } from '../../lib/blockDescriptions';
```

- [ ] **Step 2: Replace icon usage in toolbar (lines 104–121)**

Replace the toolbar JSX with:

```tsx
<div className="block-toolbar">
  <button className="block-toolbar-btn drag-handle" {...attributes} {...listeners} title="Drag to reorder">
    <GripVertical size={14} />
    <span>Move</span>
  </button>
  <button className="block-toolbar-btn" onClick={handleDuplicate} title="Duplicate block">
    <Copy size={14} />
    <span>Duplicate</span>
  </button>
  <button className="block-toolbar-btn save-preset" onClick={handleSavePreset} title="Save as preset">
    <Star size={14} />
    <span>Save</span>
  </button>
  <button className="block-toolbar-btn block-toolbar-info" data-tooltip={BLOCK_DESCRIPTIONS[block.type]} title={BLOCK_DESCRIPTIONS[block.type]}>
    <Info size={14} />
  </button>
  <div className="block-toolbar-sep" />
  <button className="block-toolbar-btn danger" onClick={handleDelete} title="Delete block">
    <Trash2 size={14} />
  </button>
</div>
```

- [ ] **Step 3: Replace IconStar in the preset save bar (line 125)**

Change `<IconStar />` to `<Star size={14} />` inside the `showSaveInput` form.

- [ ] **Step 4: Type-check**

```bash
cd frontend-email-builder && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add frontend-email-builder/src/components/Editor/BlockWrapper.tsx
git commit -m "feat: replace BlockWrapper SVG icons with Lucide, add info tooltip button"
```

---

## Chunk 3: BlockPalette — Lucide Icons

### Task 4: Replace BlockPalette icons with Lucide

**Files:**
- Modify: `frontend-email-builder/src/components/Panels/BlockPalette.tsx`

- [ ] **Step 1: Replace imports**

Remove lines 9–10 (`svgProps`, `svgPropsSmall` constants). Add Lucide imports:

```typescript
import {
  Heading, AlignLeft, Image, RectangleHorizontal, MoveVertical,
  Minus, Columns2, Share2, ImagePlay, Code2,
  Settings, LayoutGrid, ChevronDown, Plus, X,
} from 'lucide-react';
```

- [ ] **Step 2: Replace BLOCK_ICONS record (lines 12–63)**

Replace the entire `BLOCK_ICONS` record with:

```typescript
const BLOCK_ICONS: Record<BlockType, React.ReactNode> = {
  heading: <Heading size={20} />,
  text: <AlignLeft size={20} />,
  image: <Image size={20} />,
  button: <RectangleHorizontal size={20} />,
  spacer: <MoveVertical size={20} />,
  divider: <Minus size={20} />,
  columns: <Columns2 size={20} />,
  social: <Share2 size={20} />,
  hero: <ImagePlay size={20} />,
  html: <Code2 size={20} />,
};
```

- [ ] **Step 3: Replace chevron in BlockTypeRow (lines 134–145)**

Replace the two SVG branches (has presets chevron and no-presets plus) with:

```tsx
{hasPresets ? (
  <ChevronDown
    size={12}
    style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', opacity: 0.5 }}
  />
) : (
  <Plus size={12} style={{ opacity: 0.35 }} />
)}
```

- [ ] **Step 4: Replace "Empty" preset plus icon (lines 155–157)**

Replace the SVG with:

```tsx
<Plus size={14} style={{ opacity: 0.45 }} />
```

- [ ] **Step 5: Replace preset delete X icon (lines 180–182)**

Replace the SVG with:

```tsx
<X size={10} />
```

- [ ] **Step 6: Replace CollapsibleSection chevron (lines 212–218)**

Replace the inline SVG with:

```tsx
<ChevronDown
  size={14}
  style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
/>
```

- [ ] **Step 7: Replace section icons in BlockPalette (lines 240–243 and 252–254)**

Template section icon: replace inline SVG with `<Settings size={16} />`

Blocks section icon: replace inline SVG with `<LayoutGrid size={16} />`

- [ ] **Step 8: Type-check**

```bash
cd frontend-email-builder && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 9: Commit**

```bash
git add frontend-email-builder/src/components/Panels/BlockPalette.tsx
git commit -m "feat: replace BlockPalette SVG icons with Lucide"
```

---

## Chunk 4: App.tsx — Toolbar Icons + Action Button Restyle

### Task 5: Replace App.tsx toolbar icons and restyle action buttons

**Files:**
- Modify: `frontend-email-builder/src/App.tsx`

- [ ] **Step 1: Add Lucide imports**

Add to the existing imports at the top of App.tsx:

```typescript
import { LayoutGrid, Image, Eye, Code2, Save, Download } from 'lucide-react';
```

- [ ] **Step 2: Replace toolbar button SVGs (lines 557–583)**

Replace each `<Button>` that contains an inline `<svg>` with the Lucide equivalent. The full replacement for lines 557–584:

```tsx
<Button variant="ghost" size="sm" onClick={() => setShowGallery(true)}>
  <LayoutGrid size={16} />
  Templates
</Button>
<Button variant="ghost" size="sm" onClick={() => setShowMedia(true)}>
  <Image size={16} />
  Media
</Button>
<div className="toolbar-separator" />
<Button variant="ghost" size="sm" onClick={() => setShowPreview(true)}>
  <Eye size={16} />
  Preview
</Button>
<Button variant={showCode ? 'default' : 'ghost'} size="sm" onClick={() => setShowCode((v) => !v)}>
  <Code2 size={16} />
  Code
</Button>
<div className="toolbar-separator" />
<Button variant="ghost" size="sm" className="toolbar-action-btn" onClick={() => void handleSave()} disabled={isSaving}>
  <Save size={16} />
  {isSaving ? 'Saving...' : 'Save'}
</Button>
{showExportHtmlButton && (
  <Button variant="ghost" size="sm" className="toolbar-action-btn" onClick={() => void handleExport()} disabled={isExporting}>
    <Download size={16} />
    {isExporting ? 'Exporting...' : 'Export'}
  </Button>
)}
```

- [ ] **Step 3: Type-check**

```bash
cd frontend-email-builder && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add frontend-email-builder/src/App.tsx
git commit -m "feat: replace App toolbar SVGs with Lucide, restyle Save/Export buttons"
```

---

## Chunk 5: ColumnsBlock — Unified Nested Toolbar

### Task 6: Refactor NestedBlockWrapper toolbar

**Files:**
- Modify: `frontend-email-builder/src/components/Blocks/ColumnsBlock.tsx`

- [ ] **Step 1: Add Lucide imports and block descriptions**

Add at top of file:

```typescript
import { GripVertical, Copy, Trash2, Info } from 'lucide-react';
import { BLOCK_DESCRIPTIONS } from '../../lib/blockDescriptions';
```

- [ ] **Step 2: Replace NestedBlockWrapper toolbar (lines 58–81)**

Replace the toolbar div and its contents with:

```tsx
<div className="block-toolbar">
  <button className="block-toolbar-btn drag-handle" {...attributes} {...listeners} title="Drag to reorder">
    <GripVertical size={14} />
    <span>Move</span>
  </button>
  <button
    className="block-toolbar-btn"
    onClick={(e) => {
      e.stopPropagation();
      duplicateBlock(block.id);
    }}
    title="Duplicate block"
  >
    <Copy size={14} />
    <span>Duplicate</span>
  </button>
  <button className="block-toolbar-btn block-toolbar-info" data-tooltip={BLOCK_DESCRIPTIONS[block.type]} title={BLOCK_DESCRIPTIONS[block.type]}>
    <Info size={14} />
  </button>
  <div className="block-toolbar-sep" />
  <button
    className="block-toolbar-btn danger"
    onClick={(e) => {
      e.stopPropagation();
      deleteBlock(block.id);
    }}
    title="Delete block"
  >
    <Trash2 size={14} />
  </button>
</div>
```

- [ ] **Step 3: Type-check**

```bash
cd frontend-email-builder && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add frontend-email-builder/src/components/Blocks/ColumnsBlock.tsx
git commit -m "feat: unify nested block toolbar with Lucide icons, add info tooltip"
```

---

## Chunk 6: CSS — Action Button Styles, Column Overflow Fix, Tooltip

### Task 7: Add --accent-border variables to each theme preset

**Files:**
- Modify: `frontend-email-builder/src/App.css`

- [ ] **Step 1: Add --accent-border to light-breeze (after line 44)**

In `.app-shell.theme-preset-light-breeze`, after `--accent-soft: rgba(56, 189, 248, 0.12);` add:

```css
  --accent-border: rgba(56, 189, 248, 0.2);
```

- [ ] **Step 2: Add --accent-border to light-paper (after line 60)**

In `.app-shell.theme-preset-light-paper`, after `--accent-soft: rgba(180, 83, 9, 0.12);` add:

```css
  --accent-border: rgba(180, 83, 9, 0.2);
```

- [ ] **Step 3: Add --accent-border to dark-slate (after line 74)**

In `.app-shell.theme-dark.theme-preset-dark-slate`, after `--accent-soft: rgba(56, 189, 248, 0.2);` add:

```css
  --accent-border: rgba(56, 189, 248, 0.25);
```

- [ ] **Step 4: Add --accent-border to dark-cosmos (after line 88)**

In `.app-shell.theme-dark.theme-preset-dark-cosmos`, after `--accent-soft: rgba(244, 114, 182, 0.2);` add:

```css
  --accent-border: rgba(244, 114, 182, 0.25);
```

- [ ] **Step 5: Commit**

```bash
git add frontend-email-builder/src/App.css
git commit -m "feat: add --accent-border CSS variable to all theme presets"
```

---

### Task 8: Add .toolbar-action-btn styles

**Files:**
- Modify: `frontend-email-builder/src/App.css`

- [ ] **Step 1: Add toolbar-action-btn class**

After the `.toolbar-actions .toolbar-separator` rule (around line 139), add:

```css
.toolbar-action-btn {
  background: var(--accent-soft) !important;
  color: var(--accent-color) !important;
  border: 1px solid var(--accent-border) !important;
}

.toolbar-action-btn:hover {
  background: var(--accent-border) !important;
  color: var(--accent-hover) !important;
}
```

Note: `!important` overrides the ghost variant base styles from the Button component.

- [ ] **Step 2: Commit**

```bash
git add frontend-email-builder/src/App.css
git commit -m "feat: add toolbar-action-btn styles for Save/Export buttons"
```

---

### Task 9: Fix nested block toolbar visibility

**Files:**
- Modify: `frontend-email-builder/src/App.css`

- [ ] **Step 1: Update .column-slot (around line 1265)**

Change:

```css
.column-slot {
  flex: 1 1 0;
  min-height: 60px;
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.6);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
```

To:

```css
.column-slot {
  flex: 1 1 0;
  min-height: 60px;
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  padding: 36px 8px 8px;
  background: rgba(255, 255, 255, 0.6);
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: visible;
}
```

- [ ] **Step 2: Update .column-block-list (around line 1297)**

Change:

```css
.column-block-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
```

To:

```css
.column-block-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: visible;
}
```

- [ ] **Step 3: Add nested toolbar z-index rule**

After the `.nested-block-wrapper:last-child` rule (around line 588), add:

```css
.nested-block-wrapper .block-toolbar {
  z-index: 12;
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend-email-builder/src/App.css
git commit -m "fix: make nested block toolbars visible inside column slots"
```

---

### Task 10: Add tooltip CSS

**Files:**
- Modify: `frontend-email-builder/src/App.css`

- [ ] **Step 1: Add tooltip styles**

After the `.block-toolbar-sep` rule (around line 655), add:

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

- [ ] **Step 2: Commit**

```bash
git add frontend-email-builder/src/App.css
git commit -m "feat: add CSS tooltip for block info buttons"
```

---

## Chunk 7: Final Verification

### Task 11: Full type-check and build verification

- [ ] **Step 1: Type-check the email builder**

```bash
cd frontend-email-builder && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 2: Build the email builder**

```bash
cd frontend-email-builder && npm run build
```

Expected: successful build with no errors

- [ ] **Step 3: Run the full project test suite**

```bash
make test
```

Expected: all tests pass

- [ ] **Step 4: Final commit if any fixes were needed**

Only if previous steps required fixes:
```bash
git add -A && git commit -m "fix: address type-check/build issues from UI polish"
```
