import type { ColumnsBlock as ColumnsBlockType } from '../../types/blocks';
import { BlockRenderer } from '../Editor/BlockRenderer';

interface Props {
  block: ColumnsBlockType;
}

export function ColumnsBlock({ block }: Props) {
  const { columns } = block.data;
  const gap = block.style.gap || 10;

  return (
    <div className="columns-block-content" style={{ gap: `${gap}px` }}>
      {columns.map((col, i) => (
        <div key={col.id || i} className="column-slot">
          {col.blocks.length === 0 ? (
            <div className="column-slot-empty">
              Column {i + 1}
            </div>
          ) : (
            col.blocks.map((childBlock) => (
              <BlockRenderer key={childBlock.id} block={childBlock} />
            ))
          )}
        </div>
      ))}
    </div>
  );
}
