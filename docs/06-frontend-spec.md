# MailCraft — Frontend Component Specification

## Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | React 18+ with TypeScript |
| Build tool | Vite |
| State management | Zustand (lightweight, no boilerplate) |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Rich text | Tiptap (ProseMirror-based, extensible) |
| Styling | CSS Modules or Tailwind CSS |
| HTTP client | Native fetch (no axios overhead) |

---

## Project Structure

```
src/
├── index.tsx                    # Entry point, renders <App />
├── App.tsx                      # Layout: sidebar + canvas + panel
│
├── components/
│   ├── Editor/
│   │   ├── Canvas.tsx           # Main editing area, renders block list
│   │   ├── BlockRenderer.tsx    # Routes block type → component
│   │   ├── BlockWrapper.tsx     # Selection, hover controls, DnD handle
│   │   └── DropZone.tsx         # Visual drop indicator between blocks
│   │
│   ├── Blocks/
│   │   ├── TextBlock.tsx        # Rich text with Tiptap
│   │   ├── ImageBlock.tsx       # Image with upload
│   │   ├── ButtonBlock.tsx      # CTA button
│   │   ├── DividerBlock.tsx     # Horizontal rule / spacer
│   │   ├── ColumnsBlock.tsx     # Multi-column layout
│   │   ├── SocialBlock.tsx      # Social media icons
│   │   └── HeaderFooterBlock.tsx# Fixed header/footer sections
│   │
│   ├── Panels/
│   │   ├── BlockPalette.tsx     # Left sidebar — draggable block types
│   │   ├── StylePanel.tsx       # Right panel — selected block settings
│   │   ├── GlobalSettings.tsx   # Template-level settings (bg, font, width)
│   │   └── VariableInserter.tsx # Variable picker dropdown/chip
│   │
│   ├── Preview/
│   │   ├── PreviewToggle.tsx    # Desktop / Mobile / Variable toggle
│   │   ├── DesktopPreview.tsx   # 600px iframe preview
│   │   └── MobilePreview.tsx    # 320px iframe preview
│   │
│   ├── Gallery/
│   │   ├── TemplateGallery.tsx  # Grid of prebuilt templates
│   │   └── TemplateCard.tsx     # Thumbnail + name + "Use" button
│   │
│   └── UI/
│       ├── ColorPicker.tsx      # Hex input + preset swatches
│       ├── SpacingControl.tsx   # Padding/margin inputs (4 sides)
│       ├── AlignmentPicker.tsx  # Left / Center / Right buttons
│       ├── FontPicker.tsx       # Web-safe font dropdown
│       ├── UploadButton.tsx     # S3 presigned upload trigger
│       └── LoadingSpinner.tsx
│
├── store/
│   ├── editorStore.ts           # Zustand: blocks, selection, history
│   └── configStore.ts           # Zustand: API config, variables, plan
│
├── lib/
│   ├── htmlExporter.ts          # JSON → email-compatible HTML
│   ├── variableEngine.ts        # Variable insertion + preview rendering
│   ├── emailCompat.ts           # Inline CSS, table conversion utils
│   ├── api.ts                   # API client (fetch wrapper with auth)
│   └── postMessage.ts           # iframe ↔ host communication bridge
│
├── hooks/
│   ├── useEditor.ts             # Editor actions (add, update, delete, move)
│   ├── useImageUpload.ts        # S3 presigned upload flow
│   ├── useAutoSave.ts           # Debounced auto-save (30s)
│   └── useDragDrop.ts           # DnD setup and event handlers
│
└── types/
    ├── blocks.ts                # Block type definitions
    ├── editor.ts                # Editor state types
    └── api.ts                   # API request/response types
```

---

## Core Type Definitions

```typescript
// types/blocks.ts

type BlockType = 'text' | 'image' | 'button' | 'divider' | 'columns' | 'social' | 'header' | 'footer';

interface BaseBlock {
  id: string;
  type: BlockType;
  style: BlockStyle;
}

interface BlockStyle {
  padding?: Spacing;
  margin?: Spacing;
  backgroundColor?: string | null;
  alignment?: 'left' | 'center' | 'right';
}

interface Spacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// --- Block Data Types ---

interface TextBlock extends BaseBlock {
  type: 'text';
  data: {
    html: string;               // Rich text HTML content
    variables: string[];        // List of variable keys used
  };
}

interface ImageBlock extends BaseBlock {
  type: 'image';
  data: {
    src: string;
    alt: string;
    link?: string;
    width: number;              // px
    height?: number;            // px, auto-calculated
  };
}

interface ButtonBlock extends BaseBlock {
  type: 'button';
  data: {
    text: string;
    url: string;
  };
  style: BlockStyle & {
    color: string;              // Text color
    backgroundColor: string;   // Button background
    borderRadius: number;
    fullWidth: boolean;
    fontSize: number;
    fontFamily: string;
  };
}

interface DividerBlock extends BaseBlock {
  type: 'divider';
  data: {};
  style: BlockStyle & {
    lineStyle: 'solid' | 'dashed' | 'dotted';
    lineColor: string;
    lineThickness: number;
    spacing: number;            // Vertical space above and below
  };
}

interface ColumnsBlock extends BaseBlock {
  type: 'columns';
  data: {
    columnCount: 2 | 3;
    columnRatio: number[];      // e.g. [50, 50] or [33, 33, 34]
    columns: Column[];
  };
  style: BlockStyle & {
    gap: number;
    stackOnMobile: boolean;
  };
}

interface Column {
  blocks: Block[];              // Nested blocks within this column
}

interface SocialBlock extends BaseBlock {
  type: 'social';
  data: {
    platforms: SocialPlatform[];
  };
  style: BlockStyle & {
    iconSize: number;
    iconStyle: 'colored' | 'monochrome';
    layout: 'horizontal' | 'vertical';
    spacing: number;
  };
}

interface SocialPlatform {
  type: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok';
  url: string;
}

type Block = TextBlock | ImageBlock | ButtonBlock | DividerBlock
           | ColumnsBlock | SocialBlock;

// --- Template ---

interface TemplateSettings {
  backgroundColor: string;
  contentWidth: number;         // Default 600
  defaultFont: string;
  defaultFontSize: number;
  defaultColor: string;
}

interface Template {
  version: number;
  settings: TemplateSettings;
  header: { blocks: Block[] };
  body: { blocks: Block[] };
  footer: { blocks: Block[] };
}
```

---

## Editor State (Zustand Store)

```typescript
// store/editorStore.ts

interface EditorState {
  template: Template;
  selectedBlockId: string | null;
  isDirty: boolean;

  // Actions
  addBlock: (block: Block, index?: number, columnId?: string) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  selectBlock: (id: string | null) => void;
  duplicateBlock: (id: string) => void;
  updateSettings: (settings: Partial<TemplateSettings>) => void;
  loadTemplate: (template: Template) => void;
  resetTemplate: () => void;

  // Computed
  getSelectedBlock: () => Block | null;
  getBlockById: (id: string) => Block | null;
  toJSON: () => object;
}
```

---

## Component Specifications

### Canvas.tsx

The main editing area. Renders blocks vertically with drop zones between them.

**Responsibilities:**
- Render blocks in order using `BlockRenderer`
- Wrap each block in `BlockWrapper` (selection, hover controls, DnD)
- Show `DropZone` between blocks for drag targets
- Handle click-away to deselect current block
- Show empty state when no blocks: "Drag blocks here to start"

### BlockWrapper.tsx

Wraps every block with interaction controls.

**Features:**
- Click to select (blue border highlight)
- Hover to show floating toolbar: drag handle, duplicate, delete
- DnD sortable wrapper from @dnd-kit
- Keyboard: Delete key removes selected block

### BlockPalette.tsx (Left Panel)

Grid or list of draggable block type cards.

**Layout:**
```
┌─────────────┐
│ 📝 Text     │
│ 🖼️ Image    │
│ 🔘 Button   │
│ ── Divider  │
│ ▢▢ Columns  │
│ 🔗 Social   │
│ ▤ Header    │
│ ▥ Footer    │
└─────────────┘
```

Each card is a drag source. Dragging to canvas creates a new block with default data.

### StylePanel.tsx (Right Panel)

Context-sensitive settings for the selected block. Shows `GlobalSettings` when no block is selected.

**Renders different controls per block type:**
- Text: font family, size, color, line height, alignment
- Image: source preview, alt text, link, width slider, alignment
- Button: text, URL, colors, border-radius, padding, full-width toggle
- Divider: style, color, thickness, spacing
- Columns: count (2/3), ratio slider, gap, mobile stacking toggle
- Social: platform list (add/remove), URLs, icon size, style, layout

### VariableInserter.tsx

Dropdown component embedded in the text editor toolbar. Lists available variables from init config.

**Behavior:**
- Click variable → inserts `{{variable_key}}` at cursor position in Tiptap
- In editor: renders as styled chip `[First Name]`
- In HTML export: outputs as `{{first_name}}`

### Preview Components

- **PreviewToggle**: Toolbar with Desktop / Mobile / Variable buttons
- **DesktopPreview**: Renders HTML export in a 600px-wide iframe (sandboxed)
- **MobilePreview**: Same but 320px wide
- Variable toggle: switch between `{{name}}` and default value rendering

---

## Drag & Drop Flow

```
1. User starts dragging from BlockPalette
   → DnD context creates a "phantom" block with the target type

2. User drags over Canvas
   → DropZone indicators appear between existing blocks
   → Columns show internal drop zones for nested placement

3. User drops
   → If dropped on Canvas: addBlock(newBlock, dropIndex)
   → If dropped in Column: addBlock(newBlock, dropIndex, columnId)
   → If reordering: moveBlock(fromIndex, toIndex)
```

**@dnd-kit config:**
- `DndContext` wraps the entire editor
- `SortableContext` for block list reordering
- `useDroppable` on DropZone and Column slots
- `useDraggable` on BlockPalette items
- `useSortable` on BlockWrapper

---

## Auto-Save Flow

```typescript
// hooks/useAutoSave.ts
function useAutoSave() {
  const { template, isDirty } = useEditorStore();

  useEffect(() => {
    if (!isDirty) return;

    const timer = setTimeout(async () => {
      await api.saveTemplate(template);
      sendToParent("MAILCRAFT_AUTO_SAVE", { json: template });
      markClean();
    }, 30_000); // 30 second debounce

    return () => clearTimeout(timer);
  }, [template, isDirty]);
}
```

---

## Image Upload Flow

```typescript
// hooks/useImageUpload.ts
async function uploadImage(file: File): Promise<string> {
  // 1. Client-side validation
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Invalid file type");
  if (file.size > config.maxUploadSize) throw new Error("File too large");

  // 2. Get presigned URL
  const { upload_url, file_url } = await api.getPresignedUrl({
    filename: file.name,
    content_type: file.type,
    file_size: file.size,
  });

  // 3. Upload to S3
  await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  // 4. Return the CDN URL for use in the template
  return file_url;
}
```
