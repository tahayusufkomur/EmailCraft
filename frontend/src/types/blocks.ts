export type BlockType = 'text' | 'image' | 'button' | 'divider' | 'columns' | 'social';

export interface Spacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface BlockStyle {
  padding?: Spacing;
  margin?: Spacing;
  backgroundColor?: string | null;
  alignment?: 'left' | 'center' | 'right';
}

export interface BaseBlock {
  id: string;
  type: BlockType;
  style: BlockStyle;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  data: {
    html: string;
    variables: string[];
  };
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  data: {
    src: string;
    alt: string;
    link?: string;
    width: number;
    height?: number;
  };
}

export interface ButtonBlock extends BaseBlock {
  type: 'button';
  data: {
    text: string;
    url: string;
  };
  style: BlockStyle & {
    color: string;
    backgroundColor: string;
    borderRadius: number;
    fullWidth: boolean;
    fontSize: number;
    fontFamily: string;
  };
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
  data: Record<string, never>;
  style: BlockStyle & {
    lineStyle: 'solid' | 'dashed' | 'dotted';
    lineColor: string;
    lineThickness: number;
    spacing: number;
  };
}

export interface ColumnsBlock extends BaseBlock {
  type: 'columns';
  data: {
    columnCount: 2 | 3;
    columnRatio: number[];
    columns: Column[];
  };
  style: BlockStyle & {
    gap: number;
    stackOnMobile: boolean;
  };
}

export interface Column {
  id: string;
  blocks: Block[];
}

export interface SocialPlatform {
  type: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok';
  url: string;
}

export interface SocialBlock extends BaseBlock {
  type: 'social';
  data: {
    platforms: SocialPlatform[];
  };
  style: BlockStyle & {
    iconSize: number;
    iconStyle: 'colored' | 'monochrome';
    layout: 'horizontal' | 'vertical';
    spacing: number;
  };
}

export type Block = TextBlock | ImageBlock | ButtonBlock | DividerBlock | ColumnsBlock | SocialBlock;

export interface TemplateSettings {
  backgroundColor: string;
  contentWidth: number;
  defaultFont: string;
  defaultFontSize: number;
  defaultColor: string;
}

export interface EmailTemplate {
  version: number;
  settings: TemplateSettings;
  header: { blocks: Block[] };
  body: { blocks: Block[] };
  footer: { blocks: Block[] };
}
