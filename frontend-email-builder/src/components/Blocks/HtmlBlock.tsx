import type { HtmlBlock as HtmlBlockType } from '../../types/blocks';

interface Props {
  block: HtmlBlockType;
}

export function HtmlBlock({ block }: Props) {
  return (
    <div
      className="html-block-content"
      style={{
        padding: `${block.style.padding?.top ?? 10}px ${block.style.padding?.right ?? 20}px ${block.style.padding?.bottom ?? 10}px ${block.style.padding?.left ?? 20}px`,
        textAlign: block.style.alignment || 'left',
        backgroundColor: block.style.backgroundColor ?? 'transparent',
      }}
      dangerouslySetInnerHTML={{ __html: block.data.html }}
    />
  );
}
