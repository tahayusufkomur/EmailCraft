import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  const isSelected = selectedBlockId === block.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

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
      className={`block-wrapper ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      <div className="block-toolbar">
        <button {...attributes} {...listeners} title="Drag to reorder">
          &#x2630;
        </button>
        <button onClick={handleDuplicate} title="Duplicate">
          &#x2398;
        </button>
        <button onClick={handleDelete} className="danger" title="Delete">
          &#x2715;
        </button>
      </div>
      {children}
    </div>
  );
}
