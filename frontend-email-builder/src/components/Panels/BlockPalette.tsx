import { useState, useEffect, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
  Heading, AlignLeft, Image, RectangleHorizontal, MoveVertical,
  Minus, Columns2, Share2, ImagePlay, Code2, LayoutList,
  Settings, LayoutGrid, ChevronDown, Plus, X, List, UserCircle,
} from 'lucide-react';
import type { Block, BlockType } from '../../types/blocks';
import { createBlock } from '../../lib/blockFactory';
import { getPresetsForType, deleteCustomPreset } from '../../lib/blockPresets';
import { useEditorStore } from '../../store/editorStore';
import { GlobalSettings } from './GlobalSettings';

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
  card: <LayoutList size={20} />,
  list: <List size={20} />,
  profile: <UserCircle size={20} />,
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
  { type: 'card', label: 'Card' },
  { type: 'list', label: 'List' },
  { type: 'profile', label: 'Profile' },
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

function BlockTypeRow({ config, refreshKey }: { config: BlockTypeConfig; refreshKey: number }) {
  const [expanded, setExpanded] = useState(false);
  const addBlock = useEditorStore((s) => s.addBlock);
  // refreshKey triggers re-read of presets when custom presets change
  void refreshKey;
  const presets = getPresetsForType(config.type);
  const hasPresets = presets.length > 0;

  const handleAddDefault = (e: React.MouseEvent) => {
    e.stopPropagation();
    addBlock(createBlock(config.type));
  };

  const handleAddPreset = (block: Block) => {
    addBlock(block);
  };

  const handleDeletePreset = (e: React.MouseEvent, presetId: string) => {
    e.stopPropagation();
    deleteCustomPreset(presetId);
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
            <ChevronDown
              size={12}
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', opacity: 0.5 }}
            />
          ) : (
            <Plus size={12} style={{ opacity: 0.35 }} />
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
            <Plus size={14} style={{ opacity: 0.45 }} />
            <span>Empty {config.label}</span>
          </button>
          {presets.map((preset) => {
            const isCustom = preset.id.startsWith('custom-');
            return (
              <div key={preset.id} className="block-preset-row">
                <button
                  type="button"
                  className="block-preset-item"
                  onClick={() => handleAddPreset(preset.create())}
                  title={preset.preview}
                >
                  <span className="block-preset-preview">{preset.preview}</span>
                  <span className="block-preset-label">{preset.label}</span>
                </button>
                {isCustom && (
                  <button
                    type="button"
                    className="block-preset-delete"
                    onClick={(e) => handleDeletePreset(e, preset.id)}
                    title="Remove preset"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            );
          })}
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
        <ChevronDown
          size={14}
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
        />
      </button>
      {open && <div className="sidebar-section-content">{children}</div>}
    </div>
  );
}

export function BlockPalette() {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    window.addEventListener('mailcraft-presets-changed', refresh);
    return () => window.removeEventListener('mailcraft-presets-changed', refresh);
  }, [refresh]);

  return (
    <div className="sidebar">
      <CollapsibleSection
        title="Template"
        defaultOpen={false}
        icon={<Settings size={16} />}
      >
        <GlobalSettings />
      </CollapsibleSection>
      <CollapsibleSection
        title="Blocks"
        defaultOpen={true}
        icon={<LayoutGrid size={16} />}
      >
        <div className="block-type-list">
          {BLOCK_TYPES.map((config) => (
            <BlockTypeRow key={config.type} config={config} refreshKey={refreshKey} />
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
