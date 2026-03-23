import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDndContext } from '@dnd-kit/core';
import type { Block } from '../../types/blocks';
import { useEditorStore } from '../../store/editorStore';
import { saveCustomPreset } from '../../lib/blockPresets';

const iconProps = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const IconGrip = () => (
  <svg {...iconProps}><circle cx="9" cy="5" r="1" fill="currentColor" stroke="none" /><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="9" cy="19" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="5" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="19" r="1" fill="currentColor" stroke="none" /></svg>
);
const IconDuplicate = () => (
  <svg {...iconProps}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
);
const IconTrash = () => (
  <svg {...iconProps}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
);
const IconStar = () => (
  <svg {...iconProps}><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
);

interface Props {
  block: Block;
  children: React.ReactNode;
}

export function BlockWrapper({ block, children }: Props) {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const deleteBlock = useEditorStore((s) => s.deleteBlock);
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock);
  const blocks = useEditorStore((s) => s.template.body.blocks);
  const isSelected = selectedBlockId === block.id;
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
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectBlock(block.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteBlock(block.id);
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
      className={`block-wrapper ${isSelected ? 'selected' : ''} ${showInsertionIndicator ? 'insertion-indicator' : ''}`}
      onClick={handleClick}
    >
      <div className="block-toolbar">
        <button className="block-toolbar-btn drag-handle" {...attributes} {...listeners} title="Drag to reorder">
          <IconGrip />
          <span>Move</span>
        </button>
        <button className="block-toolbar-btn" onClick={handleDuplicate} title="Duplicate block">
          <IconDuplicate />
          <span>Duplicate</span>
        </button>
        <button className="block-toolbar-btn save-preset" onClick={handleSavePreset} title="Save as preset">
          <IconStar />
          <span>Save</span>
        </button>
        <div className="block-toolbar-sep" />
        <button className="block-toolbar-btn danger" onClick={handleDelete} title="Delete block">
          <IconTrash />
        </button>
      </div>
      {showSaveInput && (
        <div className="block-save-preset-bar" onClick={(e) => e.stopPropagation()}>
          <form onSubmit={handleConfirmSave} style={{ display: 'flex', gap: 6, alignItems: 'center', width: '100%' }}>
            <IconStar />
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
