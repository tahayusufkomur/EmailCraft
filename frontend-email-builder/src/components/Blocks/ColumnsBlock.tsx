import { useDroppable } from '@dnd-kit/core';
import type { Block, ColumnsBlock as ColumnsBlockType } from '../../types/blocks';
import { useEditorStore } from '../../store/editorStore';
import { BlockRenderer } from '../Editor/BlockRenderer';

interface Props {
  block: ColumnsBlockType;
}

function NestedBlockWrapper({ block }: { block: Block }) {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const deleteBlock = useEditorStore((s) => s.deleteBlock);
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock);
  const isSelected = selectedBlockId === block.id;

  return (
    <div
      className={`block-wrapper nested-block-wrapper ${isSelected ? 'selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        selectBlock(block.id);
      }}
    >
      <div className="block-toolbar">
        <button
          onClick={(e) => {
            e.stopPropagation();
            duplicateBlock(block.id);
          }}
          title="Duplicate"
        >
          &#x2398;
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteBlock(block.id);
          }}
          className="danger"
          title="Delete"
        >
          &#x2715;
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
        <div className="column-block-list">
          {columnBlocks.map((childBlock) => (
            <NestedBlockWrapper key={childBlock.id} block={childBlock} />
          ))}
        </div>
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
