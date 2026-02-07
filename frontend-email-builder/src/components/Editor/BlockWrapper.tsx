import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDndContext } from '@dnd-kit/core';
import type { Block } from '../../types/blocks';
import { useEditorStore } from '../../store/editorStore';

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

  const { active, over } = useDndContext();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver: isSortableOver,
  } = useSortable({ id: block.id });

  // Check if dragging from palette and hovering over this block
  const isDraggingFromPalette = active?.data.current?.fromPalette;
  const isOverThisBlock = over?.id === block.id;
  const isLastBlock = blocks.length > 0 && blocks[blocks.length - 1].id === block.id;

  // Don't show insertion indicator on last block (bottom drop zone handles it)
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`block-wrapper ${isSelected ? 'selected' : ''} ${showInsertionIndicator ? 'insertion-indicator' : ''}`}
      onClick={handleClick}
    >
      <div className="block-toolbar">
        <button {...attributes} {...listeners} title="Drag to reorder">
          &#x2630;
        </button>
        <button onClick={handleDuplicate} title="Duplicate">
          &#x2398;
        </button>
        <button onClick={handleDelete} className="danger" title="Duplicate">
          &#x2715;
        </button>
      </div>
      {children}
    </div>
  );
}
