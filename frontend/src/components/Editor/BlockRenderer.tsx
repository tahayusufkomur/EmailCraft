import type { Block } from '../../types/blocks';
import { TextBlock } from '../Blocks/TextBlock';
import { ImageBlock } from '../Blocks/ImageBlock';
import { ButtonBlock } from '../Blocks/ButtonBlock';
import { DividerBlock } from '../Blocks/DividerBlock';
import { ColumnsBlock } from '../Blocks/ColumnsBlock';
import { SocialBlock } from '../Blocks/SocialBlock';

interface Props {
  block: Block;
}

export function BlockRenderer({ block }: Props) {
  switch (block.type) {
    case 'text':
      return <TextBlock block={block} />;
    case 'image':
      return <ImageBlock block={block} />;
    case 'button':
      return <ButtonBlock block={block} />;
    case 'divider':
      return <DividerBlock block={block} />;
    case 'columns':
      return <ColumnsBlock block={block} />;
    case 'social':
      return <SocialBlock block={block} />;
    default:
      return <div>Unknown block type</div>;
  }
}
