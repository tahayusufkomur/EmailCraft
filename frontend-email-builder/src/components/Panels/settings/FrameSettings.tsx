import type { BlockStyle } from '../../../types/blocks';
import { SliderInput } from './SliderInput';
import { ImageUrlPicker } from './ImageUrlPicker';

interface Props {
  style: BlockStyle;
  onChange: (patch: Partial<BlockStyle>) => void;
  /** false for block types that draw their own border/radius (card, profile, button, image) */
  showBorder?: boolean;
}

export function FrameSettings({ style, onChange, showBorder = true }: Props) {
  const overlay = style.backgroundOverlay || '';
  const borderStyle = style.borderStyle && style.borderStyle !== 'none' ? style.borderStyle : 'solid';

  return (
    <div className="panel-section">
      <div className="panel-section-title">Frame</div>
      <ImageUrlPicker
        value={style.backgroundImage || ''}
        onChange={(url) => onChange({ backgroundImage: url || null })}
        label="Background Image URL"
        showPreview={false}
      />
      <div className="form-group">
        <label>Overlay Color</label>
        <div className="color-input-row">
          <input
            type="color"
            value={overlay || '#000000'}
            onChange={(e) => onChange({ backgroundOverlay: e.target.value })}
          />
          <input
            type="text"
            value={overlay}
            placeholder="none"
            onChange={(e) => onChange({ backgroundOverlay: e.target.value || null })}
          />
        </div>
      </div>
      <SliderInput
        label="Overlay Opacity"
        value={style.backgroundOverlayOpacity ?? 0.4}
        min={0}
        max={1}
        step={0.05}
        unit=""
        onChange={(v) => onChange({ backgroundOverlayOpacity: v })}
      />
      {showBorder && (
        <>
          <SliderInput label="Border Width" value={style.borderWidth || 0} min={0} max={20} onChange={(v) => onChange({ borderWidth: v })} />
          <div className="form-group">
            <label>Border Color</label>
            <div className="color-input-row">
              <input type="color" value={style.borderColor || '#e2e8f0'} onChange={(e) => onChange({ borderColor: e.target.value })} />
              <input type="text" value={style.borderColor || '#e2e8f0'} onChange={(e) => onChange({ borderColor: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Border Style</label>
            <select
              value={borderStyle}
              onChange={(e) => onChange({ borderStyle: e.target.value as 'solid' | 'dashed' | 'dotted' })}
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
          <SliderInput label="Border Radius" value={style.borderRadius || 0} min={0} max={64} onChange={(v) => onChange({ borderRadius: v })} />
        </>
      )}
    </div>
  );
}
