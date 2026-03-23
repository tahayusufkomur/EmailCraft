import type { HeroBlock } from '../../../types/blocks';
import { useEditorStore } from '../../../store/editorStore';
import { AlignmentPicker } from './AlignmentPicker';
import { FONT_OPTIONS } from '../../../lib/fonts';

interface Props {
  block: HeroBlock;
}

export function HeroSettings({ block }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const updateData = (data: Partial<HeroBlock['data']>) => {
    updateBlock(block.id, { data: { ...block.data, ...data } } as Partial<HeroBlock>);
  };

  const updateStyle = (style: Partial<HeroBlock['style']>) => {
    updateBlock(block.id, { style: { ...block.style, ...style } });
  };

  return (
    <div>
      <div className="panel-section">
        <div className="panel-section-title">Hero Content</div>
        <div className="form-group">
          <label>Background Image URL</label>
          <input type="url" value={block.data.backgroundImage} onChange={(e) => updateData({ backgroundImage: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Heading</label>
          <input type="text" value={block.data.heading} onChange={(e) => updateData({ heading: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Subheading</label>
          <input type="text" value={block.data.subheading} onChange={(e) => updateData({ subheading: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Button Text</label>
          <input type="text" value={block.data.buttonText} onChange={(e) => updateData({ buttonText: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Button URL</label>
          <input type="url" value={block.data.buttonUrl} onChange={(e) => updateData({ buttonUrl: e.target.value })} />
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-title">Layout</div>
        <div className="form-group">
          <label>Height (px)</label>
          <input type="number" min={200} max={800} value={block.style.height || 400} onChange={(e) => updateStyle({ height: Number(e.target.value) })} />
        </div>
        <div className="form-group">
          <label>Content Alignment</label>
          <AlignmentPicker value={block.style.contentAlignment || 'center'} onChange={(v) => updateStyle({ contentAlignment: v as 'left' | 'center' | 'right' })} />
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-title">Overlay</div>
        <div className="form-group">
          <label>Overlay Color</label>
          <div className="color-input-row">
            <input type="color" value={block.style.overlayColor || '#000000'} onChange={(e) => updateStyle({ overlayColor: e.target.value })} />
            <input type="text" value={block.style.overlayColor || '#000000'} onChange={(e) => updateStyle({ overlayColor: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Overlay Opacity ({Math.round((block.style.overlayOpacity ?? 0.4) * 100)}%)</label>
          <input type="range" min={0} max={1} step={0.05} value={block.style.overlayOpacity ?? 0.4} onChange={(e) => updateStyle({ overlayOpacity: Number(e.target.value) })} />
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-title">Typography</div>
        <div className="form-group">
          <label>Heading Font</label>
          <select value={block.style.headingFontFamily || 'Arial, Helvetica, sans-serif'} onChange={(e) => updateStyle({ headingFontFamily: e.target.value })}>
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}{f.isGoogle ? ' ✦' : ''}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Heading Size (px)</label>
          <input type="number" min={16} max={72} value={block.style.headingFontSize || 36} onChange={(e) => updateStyle({ headingFontSize: Number(e.target.value) })} />
        </div>
        <div className="form-group">
          <label>Heading Color</label>
          <div className="color-input-row">
            <input type="color" value={block.style.headingColor || '#ffffff'} onChange={(e) => updateStyle({ headingColor: e.target.value })} />
            <input type="text" value={block.style.headingColor || '#ffffff'} onChange={(e) => updateStyle({ headingColor: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Subheading Color</label>
          <div className="color-input-row">
            <input type="color" value={(block.style.subheadingColor || '#ffffffcc').substring(0, 7)} onChange={(e) => updateStyle({ subheadingColor: e.target.value })} />
            <input type="text" value={block.style.subheadingColor || '#ffffffcc'} onChange={(e) => updateStyle({ subheadingColor: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-title">Button Style</div>
        <div className="form-group">
          <label>Button Background</label>
          <div className="color-input-row">
            <input type="color" value={block.style.buttonBackgroundColor || '#ffffff'} onChange={(e) => updateStyle({ buttonBackgroundColor: e.target.value })} />
            <input type="text" value={block.style.buttonBackgroundColor || '#ffffff'} onChange={(e) => updateStyle({ buttonBackgroundColor: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Button Text Color</label>
          <div className="color-input-row">
            <input type="color" value={block.style.buttonTextColor || '#000000'} onChange={(e) => updateStyle({ buttonTextColor: e.target.value })} />
            <input type="text" value={block.style.buttonTextColor || '#000000'} onChange={(e) => updateStyle({ buttonTextColor: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Button Border Radius</label>
          <input type="number" min={0} max={50} value={block.style.buttonBorderRadius || 50} onChange={(e) => updateStyle({ buttonBorderRadius: Number(e.target.value) })} />
        </div>
      </div>
    </div>
  );
}
