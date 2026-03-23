import type { HeadingBlock as HeadingBlockType } from '../../types/blocks';
import { highlightVariables } from '../../lib/variableUtils';

interface Props {
  block: HeadingBlockType;
}

export function HeadingBlock({ block }: Props) {
  const { level, text } = block.data;
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4';
  const style = block.style;

  return (
    <div
      className="heading-block-content"
      style={{
        padding: `${style.padding?.top ?? 10}px ${style.padding?.right ?? 20}px ${style.padding?.bottom ?? 10}px ${style.padding?.left ?? 20}px`,
        textAlign: style.alignment || 'left',
        backgroundColor: style.backgroundColor ?? 'transparent',
      }}
    >
      <Tag
        style={{
          margin: 0,
          color: style.color || '#0f172a',
          fontSize: `${style.fontSize || 28}px`,
          fontFamily: style.fontFamily || 'Arial, Helvetica, sans-serif',
          fontWeight: style.fontWeight || 700,
          lineHeight: 1.2,
          letterSpacing: style.letterSpacing ? `${style.letterSpacing}px` : undefined,
          textTransform: style.textTransform !== 'none' ? style.textTransform : undefined,
        }}
      >
        {highlightVariables(text || 'Your heading goes here')}
      </Tag>
    </div>
  );
}
