export type BlockType = 'text' | 'image' | 'button' | 'divider' | 'columns' | 'social' | 'heading' | 'spacer' | 'html' | 'hero' | 'card';
export type TemplateBackgroundStyle =
  | 'none'
  | 'aurora'
  | 'sunset-glow'
  | 'mint-weave'
  | 'midnight-grid'
  | 'paper-rings';
export type TemplateBodyBackgroundStyle =
  | 'solid'
  | 'mesh-blue'
  | 'aurora-soft'
  | 'sunset-paper'
  | 'carbon-grid'
  | 'opal-rings';

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
  backgroundGradient?: string | null;
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
  style: BlockStyle & {
    borderRadius?: number;
    fullWidth?: boolean;
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
    borderStyle?: 'solid' | 'dashed' | 'dotted';
    borderColor?: string;
    borderWidth?: number;
    fontWeight?: number;
    letterSpacing?: number;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    paddingX?: number;
    paddingY?: number;
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
  backgroundColor?: string | null;
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

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  data: {
    text: string;
    level: 1 | 2 | 3 | 4;
  };
  style: BlockStyle & {
    color: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: number;
    letterSpacing?: number;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  };
}

export interface SpacerBlock extends BaseBlock {
  type: 'spacer';
  data: Record<string, never>;
  style: BlockStyle & {
    height: number;
  };
}

export interface HtmlBlock extends BaseBlock {
  type: 'html';
  data: {
    html: string;
  };
}

export interface HeroBlock extends BaseBlock {
  type: 'hero';
  data: {
    backgroundImage: string;
    heading: string;
    subheading: string;
    buttonText: string;
    buttonUrl: string;
  };
  style: BlockStyle & {
    height: number;
    overlayColor: string;
    overlayOpacity: number;
    headingColor: string;
    headingFontSize: number;
    headingFontFamily: string;
    subheadingColor: string;
    buttonBackgroundColor: string;
    buttonTextColor: string;
    buttonBorderRadius: number;
    contentAlignment: 'left' | 'center' | 'right';
    verticalAlignment: 'top' | 'center' | 'bottom';
  };
}

export interface CardBlock extends BaseBlock {
  type: 'card';
  data: {
    showIcon: boolean;
    iconMode: 'emoji' | 'image';
    iconEmoji: string;
    iconImageSrc: string;
    iconImageAlt: string;
    showBadge: boolean;
    badgeText: string;
    heading: string;
    body: string;
    showButton: boolean;
    buttonText: string;
    buttonUrl: string;
  };
  style: BlockStyle & {
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
    borderStyle: 'solid' | 'dashed' | 'dotted' | 'none';
    iconSize: number;
    iconBackgroundColor: string;
    iconBorderRadius: number;
    badgeBackgroundColor: string;
    badgeTextColor: string;
    headingColor: string;
    headingFontSize: number;
    headingFontFamily: string;
    headingFontWeight: number;
    bodyColor: string;
    bodyFontSize: number;
    bodyFontFamily: string;
    buttonBackgroundColor: string;
    buttonTextColor: string;
    buttonBorderRadius: number;
    buttonFontSize: number;
    buttonFontFamily: string;
    buttonFontWeight: number;
    buttonPaddingX: number;
    buttonPaddingY: number;
    buttonFullWidth: boolean;
    buttonBorderStyle: 'solid' | 'dashed' | 'dotted';
    buttonBorderColor: string;
    buttonBorderWidth: number;
    contentAlignment: 'left' | 'center' | 'right';
  };
}

export type Block =
  | TextBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | ColumnsBlock
  | SocialBlock
  | HeadingBlock
  | SpacerBlock
  | HtmlBlock
  | HeroBlock
  | CardBlock;

export interface TemplateSettings {
  backgroundColor: string;
  backgroundStyle?: TemplateBackgroundStyle;
  bodyBackgroundStyle?: TemplateBodyBackgroundStyle;
  bodyBackgroundColor?: string;
  contentWidth: number;
  bodyBorderRadius?: number;
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
