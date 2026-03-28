import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Copy, Trash2, Info } from 'lucide-react';
import type { Block, ColumnsBlock as ColumnsBlockType } from '../../types/blocks';
import { useEditorStore } from '../../store/editorStore';
import { BlockRenderer } from '../Editor/BlockRenderer';
import { BLOCK_DESCRIPTIONS } from '../../lib/blockDescriptions';

interface Props {
  block: ColumnsBlockType;
}

interface NestedBlockWrapperProps {
  block: Block;
  parentBlockId: string;
  columnId: string;
}

function NestedBlockWrapper({ block, parentBlockId, columnId }: NestedBlockWrapperProps) {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const hoveredBlockId = useEditorStore((s) => s.hoveredBlockId);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const hoverBlock = useEditorStore((s) => s.hoverBlock);
  const deleteBlock = useEditorStore((s) => s.deleteBlock);
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock);
  const isSelected = selectedBlockId === block.id;
  const isHovered = hoveredBlockId === block.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    data: {
      type: 'nested-block',
      parentBlockId,
      columnId,
      block,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`block-wrapper nested-block-wrapper ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        selectBlock(block.id);
      }}
      onMouseEnter={(e) => {
        e.stopPropagation();
        hoverBlock(block.id);
      }}
      onMouseLeave={(e) => {
        e.stopPropagation();
        if (hoveredBlockId === block.id) hoverBlock(null);
      }}
    >
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
      <BlockRenderer block={block} />
    </div>
  );
}

function ColumnSlot({
  parentBlockId,
  columnId,
  columnBlocks,
  columnIndex,
  ratio,
}: {
  parentBlockId: string;
  columnId: string;
  columnBlocks: Block[];
  columnIndex: number;
  ratio: number;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-drop-${parentBlockId}-${columnId}`,
    data: {
      dropType: 'column',
      parentBlockId,
      columnId,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`column-slot ${isOver ? 'column-slot-over' : ''}`}
      style={{ flex: `${ratio} 1 0` }}
    >
      {columnBlocks.length === 0 ? (
        <div className="column-slot-empty">
          <div>Column {columnIndex + 1}</div>
          <div className="column-slot-hint">Drag blocks from the left panel into this column</div>
        </div>
      ) : (
        <SortableContext
          items={columnBlocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="column-block-list">
            {columnBlocks.map((childBlock) => (
              <NestedBlockWrapper
                key={childBlock.id}
                block={childBlock}
                parentBlockId={parentBlockId}
                columnId={columnId}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}

export function ColumnsBlock({ block }: Props) {
  const { columns } = block.data;
  const gap = block.style.gap || 10;
  const equalRatio = Math.floor(100 / Math.max(columns.length, 1));

  return (
    <div
      className={`columns-block-content ${block.style.stackOnMobile === false ? '' : 'columns-stack-mobile'}`}
      style={{ gap: `${gap}px` }}
    >
      {columns.map((col, i) => (
        <ColumnSlot
          key={col.id || i}
          parentBlockId={block.id}
          columnId={col.id}
          columnBlocks={col.blocks}
          columnIndex={i}
          ratio={block.data.columnRatio[i] || equalRatio}
        />
      ))}
    </div>
  );
}
