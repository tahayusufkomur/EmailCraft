import type { DividerBlock as DividerBlockType } from '../../types/blocks';

interface Props {
  block: DividerBlockType;
}

export function DividerBlock({ block }: Props) {
  const style = block.style;

  return (
    <div
      className="divider-block-content"
      style={{ padding: `${style.spacing || 20}px 0` }}
    >
      <hr
        style={{
          borderTopColor: style.lineColor || '#cccccc',
          borderTopWidth: (style.lineThickness || 1) + 'px',
          borderTopStyle: style.lineStyle || 'solid',
        }}
      />
    </div>
  );
}
