import type { ButtonBlock as ButtonBlockType } from '../../types/blocks';

interface Props {
  block: ButtonBlockType;
}

export function ButtonBlock({ block }: Props) {
  const { text } = block.data;
  const style = block.style;
  const paddingX = style.paddingX ?? 24;
  const paddingY = style.paddingY ?? 12;

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
          fontWeight: style.fontWeight || 600,
          letterSpacing: `${style.letterSpacing || 0}px`,
          textTransform: style.textTransform || 'none',
          borderStyle: style.borderStyle || 'solid',
          borderColor: style.borderColor || style.backgroundColor || '#007bff',
          borderWidth: `${style.borderWidth || 0}px`,
          padding: `${paddingY}px ${paddingX}px`,
          width: style.fullWidth ? '100%' : undefined,
          display: style.fullWidth ? 'block' : 'inline-block',
          textAlign: 'center',
        }}
      >
        {text || 'Click Here'}
      </span>
    </div>
  );
}
