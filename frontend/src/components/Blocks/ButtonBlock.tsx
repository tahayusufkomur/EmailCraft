import type { ButtonBlock as ButtonBlockType } from '../../types/blocks';

interface Props {
  block: ButtonBlockType;
}

export function ButtonBlock({ block }: Props) {
  const { text } = block.data;
  const style = block.style;

  return (
    <div
      className="button-block-content"
      style={{ textAlign: style.alignment || 'center' }}
    >
      <span
        className="button-block-preview"
        style={{
          backgroundColor: style.backgroundColor || '#007bff',
          color: style.color || '#ffffff',
          borderRadius: (style.borderRadius || 4) + 'px',
          fontSize: (style.fontSize || 16) + 'px',
          fontFamily: style.fontFamily || 'Arial, Helvetica, sans-serif',
          width: style.fullWidth ? '100%' : undefined,
          textAlign: 'center',
        }}
      >
        {text || 'Click Here'}
      </span>
    </div>
  );
}
