import type { SpacerBlock as SpacerBlockType } from '../../types/blocks';

interface Props {
  block: SpacerBlockType;
}

export function SpacerBlock({ block }: Props) {
  return (
    <div
      className="spacer-block-content"
      style={{
        height: `${Math.max(0, block.style.height || 0)}px`,
        backgroundColor: block.style.backgroundColor ?? 'transparent',
      }}
      aria-label="Spacer block"
    />
  );
}
