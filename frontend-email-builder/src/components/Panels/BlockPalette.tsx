import { useDraggable } from '@dnd-kit/core';
import type { BlockType } from '../../types/blocks';
import { createBlock } from '../../lib/blockFactory';
import { useEditorStore } from '../../store/editorStore';

interface PaletteItemConfig {
  type: BlockType;
  label: string;
  icon: string;
}

const BLOCK_TYPES: PaletteItemConfig[] = [
  { type: 'heading', label: 'Heading', icon: 'H' },
  { type: 'text', label: 'Text', icon: 'T' },
  { type: 'image', label: 'Image', icon: '\u{1F5BC}' },
  { type: 'button', label: 'Button', icon: '\u{25A3}' },
  { type: 'spacer', label: 'Spacer', icon: '\u21F5' },
  { type: 'divider', label: 'Divider', icon: '\u2500' },
  { type: 'columns', label: 'Columns', icon: '\u{25EB}' },
  { type: 'social', label: 'Social', icon: '\u{1F310}' },
  { type: 'hero', label: 'Hero', icon: '\u{1F3DE}' },
  { type: 'html', label: 'HTML', icon: '</>' },
];

function DraggablePaletteItem({ config }: { config: PaletteItemConfig }) {
  const addBlock = useEditorStore((s) => s.addBlock);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${config.type}`,
    data: { fromPalette: true, blockType: config.type },
  });

  const handleClick = () => {
    const block = createBlock(config.type);
    addBlock(block);
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="palette-item"
      data-block-type={config.type}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      onClick={handleClick}
    >
      <span className="palette-item-icon">{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
}

export function BlockPalette() {
  return (
    <div className="sidebar">
      <div className="sidebar-header">Blocks</div>
      <div className="palette-grid">
        {BLOCK_TYPES.map((config) => (
          <DraggablePaletteItem key={config.type} config={config} />
        ))}
      </div>
    </div>
  );
}
