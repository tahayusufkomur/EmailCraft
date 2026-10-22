import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDndContext } from '@dnd-kit/core';
import { GripVertical, Copy, Trash2, Star, Info } from 'lucide-react';
import type { Block, BlockStyle } from '../../types/blocks';
import { useEditorStore } from '../../store/editorStore';
import { saveCustomPreset } from '../../lib/blockPresets';
import { BLOCK_DESCRIPTIONS } from '../../lib/blockDescriptions';
import { localGalleryUrl } from '../../lib/templates';

interface Props {
  block: Block;
  children: React.ReactNode;
}

// Same blocks as OWN_BORDER_TYPES in lib/htmlExporter.ts: they draw their own border/radius.
const OWN_BORDER_TYPES: Block['type'][] = ['card', 'profile', 'button', 'image'];

/** Canvas CSS for the frame style keys, matching frameHtml() in lib/htmlExporter.ts. */
export function frameCss(block: Block): React.CSSProperties {
  const s: BlockStyle = block.style;
  const css: React.CSSProperties = {};
  if (s.backgroundImage) {
    const img = `url(${localGalleryUrl(s.backgroundImage)})`;
    if (s.backgroundOverlay) {
      const h = s.backgroundOverlay.replace('#', '');
      const rgba = `rgba(${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}, ${s.backgroundOverlayOpacity ?? 0.4})`;
      css.backgroundImage = `linear-gradient(${rgba}, ${rgba}), ${img}`;
    } else {
      css.backgroundImage = img;
    }
    css.backgroundSize = 'cover';
    css.backgroundPosition = 'center';
  } else if (s.backgroundGradient) {
    css.background = s.backgroundGradient;
  }
  if (!OWN_BORDER_TYPES.includes(block.type)) {
    if (s.borderWidth && s.borderWidth > 0) {
      css.border = `${s.borderWidth}px ${s.borderStyle && s.borderStyle !== 'none' ? s.borderStyle : 'solid'} ${s.borderColor || '#000000'}`;
    }
    if (s.borderRadius) css.borderRadius = `${s.borderRadius}px`;
  }
  return css;
}

export function BlockWrapper({ block, children }: Props) {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const hoveredBlockId = useEditorStore((s) => s.hoveredBlockId);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const hoverBlock = useEditorStore((s) => s.hoverBlock);
  const deleteBlock = useEditorStore((s) => s.deleteBlock);
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock);
  const blocks = useEditorStore((s) => s.template.body.blocks);
  const isSelected = selectedBlockId === block.id;
  const isHovered = hoveredBlockId === block.id;
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [presetName, setPresetName] = useState('');

  const { active, over } = useDndContext();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const isDraggingFromPalette = active?.data.current?.fromPalette;
  const isOverThisBlock = over?.id === block.id;
  const isLastBlock = blocks.length > 0 && blocks[blocks.length - 1].id === block.id;
  const showInsertionIndicator = isDraggingFromPalette && isOverThisBlock && !isLastBlock;

  const style = {
    ...frameCss(block),
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectBlock(block.id);
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    e.stopPropagation();
    hoverBlock(block.id);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Only clear if we're still the hovered block
    if (hoveredBlockId === block.id) {
      hoverBlock(null);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteBlock(block.id);
  };

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      selectBlock(block.id);
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateBlock(block.id);
  };

  const handleSavePreset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPresetName('');
    setShowSaveInput(true);
  };

  const handleConfirmSave = (e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const name = presetName.trim();
    if (!name) return;
    saveCustomPreset(block, name);
    setShowSaveInput(false);
    setPresetName('');
  };

  const handleCancelSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSaveInput(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-block-id={block.id}
      tabIndex={0}
      className={`block-wrapper ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${showInsertionIndicator ? 'insertion-indicator' : ''}`}
      onClick={handleClick}
      onFocus={handleFocus}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
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
      {showSaveInput && (
        <div className="block-save-preset-bar" onClick={(e) => e.stopPropagation()}>
          <form onSubmit={handleConfirmSave} style={{ display: 'flex', gap: 6, alignItems: 'center', width: '100%' }}>
            <Star size={14} />
            <input
              type="text"
              placeholder="Preset name..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              autoFocus
              className="block-save-preset-input"
            />
            <button type="submit" className="block-save-preset-confirm" disabled={!presetName.trim()}>
              Save
            </button>
            <button type="button" className="block-save-preset-cancel" onClick={handleCancelSave}>
              Cancel
            </button>
          </form>
        </div>
      )}
      {children}
    </div>
  );
}
