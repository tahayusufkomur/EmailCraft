import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Block, BlockType } from '../../types/blocks';
import { createBlock } from '../../lib/blockFactory';
import { getPresetsForType } from '../../lib/blockPresets';
import { useEditorStore } from '../../store/editorStore';
import { GlobalSettings } from './GlobalSettings';

const svgProps = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const svgPropsSmall = { ...svgProps, width: 16, height: 16 };

const BLOCK_ICONS: Record<BlockType, React.ReactNode> = {
  heading: (
    <svg {...svgProps}>
      <path d="M4 5v14" /><path d="M20 5v14" /><path d="M4 12h16" />
    </svg>
  ),
  text: (
    <svg {...svgProps}>
      <path d="M4 6h16" /><path d="M4 10h16" /><path d="M4 14h12" /><path d="M4 18h8" />
    </svg>
  ),
  image: (
    <svg {...svgProps}>
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none" /><path d="m21 15-4.5-4.5L9 18" />
    </svg>
  ),
  button: (
    <svg {...svgProps}>
      <rect x="2" y="7" width="20" height="10" rx="5" /><path d="M8 12h8" />
    </svg>
  ),
  spacer: (
    <svg {...svgProps}>
      <path d="M12 5v14" /><path d="m8 8 4-3 4 3" /><path d="m8 16 4 3 4-3" />
    </svg>
  ),
  divider: (
    <svg {...svgProps}>
      <path d="M3 12h18" /><path d="M3 6h18" opacity=".3" /><path d="M3 18h18" opacity=".3" />
    </svg>
  ),
  columns: (
    <svg {...svgProps}>
      <rect x="3" y="3" width="7" height="18" rx="1.5" /><rect x="14" y="3" width="7" height="18" rx="1.5" />
    </svg>
  ),
  social: (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="3" /><circle cx="4.5" cy="7" r="2" /><circle cx="19.5" cy="7" r="2" /><path d="M9.2 10.4 6.3 8.5" /><path d="m14.8 10.4 2.9-1.9" />
    </svg>
  ),
  hero: (
    <svg {...svgProps}>
      <rect x="2" y="3" width="20" height="18" rx="2" /><path d="m2 15 5.5-4.5L14 16" /><path d="m14 14 3-2.5L22 16" /><path d="M6 19h12" opacity=".5" />
    </svg>
  ),
  html: (
    <svg {...svgProps}>
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /><line x1="14.5" y1="4" x2="9.5" y2="20" opacity=".5" />
    </svg>
  ),
};

interface BlockTypeConfig {
  type: BlockType;
  label: string;
}

const BLOCK_TYPES: BlockTypeConfig[] = [
  { type: 'heading', label: 'Heading' },
  { type: 'text', label: 'Text' },
  { type: 'image', label: 'Image' },
  { type: 'button', label: 'Button' },
  { type: 'spacer', label: 'Spacer' },
  { type: 'divider', label: 'Divider' },
  { type: 'columns', label: 'Columns' },
  { type: 'social', label: 'Social' },
  { type: 'hero', label: 'Hero' },
  { type: 'html', label: 'HTML' },
];

function DraggableBlockItem({ blockType, children, id }: {
  blockType: BlockType;
  children: React.ReactNode;
  id: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { fromPalette: true, blockType },
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={{ opacity: isDragging ? 0.4 : 1 }}>
      {children}
    </div>
  );
}

function BlockTypeRow({ config }: { config: BlockTypeConfig }) {
  const [expanded, setExpanded] = useState(false);
  const addBlock = useEditorStore((s) => s.addBlock);
  const presets = getPresetsForType(config.type);
  const hasPresets = presets.length > 0;

  const handleAddDefault = (e: React.MouseEvent) => {
    e.stopPropagation();
    addBlock(createBlock(config.type));
  };

  const handleAddPreset = (block: Block) => {
    addBlock(block);
  };

  return (
    <div className="block-type-row">
      <DraggableBlockItem blockType={config.type} id={`palette-${config.type}`}>
        <button
          type="button"
          className={`block-type-header ${expanded ? 'expanded' : ''}`}
          onClick={() => hasPresets ? setExpanded((v) => !v) : handleAddDefault({ stopPropagation: () => {} } as React.MouseEvent)}
        >
          <span className="block-type-header-left">
            <span className="block-type-icon">{BLOCK_ICONS[config.type]}</span>
            <span className="block-type-label">{config.label}</span>
          </span>
          {hasPresets ? (
            <svg
              {...svgPropsSmall} width="12" height="12"
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', opacity: 0.5 }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          ) : (
            <svg {...svgPropsSmall} width="12" height="12" style={{ opacity: 0.35 }}>
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}
        </button>
      </DraggableBlockItem>
      {expanded && hasPresets && (
        <div className="block-presets">
          <button
            type="button"
            className="block-preset-item block-preset-empty"
            onClick={handleAddDefault}
          >
            <svg {...svgPropsSmall} width="14" height="14" style={{ opacity: 0.45 }}>
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Empty {config.label}</span>
          </button>
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="block-preset-item"
              onClick={() => handleAddPreset(preset.create())}
              title={preset.preview}
            >
              <span className="block-preset-preview">{preset.preview}</span>
              <span className="block-preset-label">{preset.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CollapsibleSection({ title, icon, defaultOpen, children }: {
  title: string;
  icon: React.ReactNode;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="sidebar-section">
      <button
        className="sidebar-section-toggle"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span className="sidebar-section-left">
          {icon}
          <span>{title}</span>
        </span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="sidebar-section-content">{children}</div>}
    </div>
  );
}

export function BlockPalette() {
  return (
    <div className="sidebar">
      <CollapsibleSection
        title="Template"
        defaultOpen={false}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        }
      >
        <GlobalSettings />
      </CollapsibleSection>
      <CollapsibleSection
        title="Blocks"
        defaultOpen={true}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        }
      >
        <div className="block-type-list">
          {BLOCK_TYPES.map((config) => (
            <BlockTypeRow key={config.type} config={config} />
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
