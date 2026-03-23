import type { Block } from '../../types/blocks';
import { TextBlock } from '../Blocks/TextBlock';
import { ImageBlock } from '../Blocks/ImageBlock';
import { ButtonBlock } from '../Blocks/ButtonBlock';
import { DividerBlock } from '../Blocks/DividerBlock';
import { ColumnsBlock } from '../Blocks/ColumnsBlock';
import { SocialBlock } from '../Blocks/SocialBlock';
import { HeadingBlock } from '../Blocks/HeadingBlock';
import { SpacerBlock } from '../Blocks/SpacerBlock';
import { HtmlBlock } from '../Blocks/HtmlBlock';
import { HeroBlock } from '../Blocks/HeroBlock';

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
    case 'heading':
      return <HeadingBlock block={block} />;
    case 'spacer':
      return <SpacerBlock block={block} />;
    case 'html':
      return <HtmlBlock block={block} />;
    case 'hero':
      return <HeroBlock block={block} />;
    default:
      return <div>Unknown block type</div>;
  }
}
