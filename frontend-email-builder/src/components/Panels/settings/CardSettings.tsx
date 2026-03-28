import type { CardBlock } from '../../../types/blocks';
import { useEditorStore } from '../../../store/editorStore';
import { SliderInput } from './SliderInput';
import { AlignmentPicker } from './AlignmentPicker';
import { SpacingControl } from './SpacingControl';
import { FONT_OPTIONS } from '../../../lib/fonts';

interface Props {
  block: CardBlock;
}

export function CardSettings({ block }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const { data, style } = block;

  const updateData = (updates: Partial<CardBlock['data']>) => {
    updateBlock(block.id, { data: { ...data, ...updates } } as Partial<CardBlock>);
  };
  const updateStyle = (updates: Partial<CardBlock['style']>) => {
    updateBlock(block.id, { style: { ...style, ...updates } } as Partial<CardBlock>);
  };

  return (
    <div>
      {/* Icon */}
      <div className="panel-section">
        <div className="panel-section-title">Icon</div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={data.showIcon}
              onChange={(e) => updateData({ showIcon: e.target.checked })}
            />{' '}
            Show Icon
          </label>
        </div>
        {data.showIcon && (
          <>
            <div className="form-group">
              <label>Mode</label>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  className={`btn btn-sm ${data.iconMode === 'emoji' ? 'btn-primary' : ''}`}
                  onClick={() => updateData({ iconMode: 'emoji' })}
                >
                  Emoji
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${data.iconMode === 'image' ? 'btn-primary' : ''}`}
                  onClick={() => updateData({ iconMode: 'image' })}
                >
                  Image
                </button>
              </div>
            </div>
            {data.iconMode === 'emoji' ? (
              <div className="form-group">
                <label>Emoji</label>
                <input
                  type="text"
                  value={data.iconEmoji}
                  onChange={(e) => updateData({ iconEmoji: e.target.value })}
                  style={{ width: 60, fontSize: 20, textAlign: 'center' }}
                />
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label>Image URL</label>
                  <input
                    type="text"
                    value={data.iconImageSrc}
                    onChange={(e) => updateData({ iconImageSrc: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="form-group">
                  <label>Alt Text</label>
                  <input
                    type="text"
                    value={data.iconImageAlt}
                    onChange={(e) => updateData({ iconImageAlt: e.target.value })}
                  />
                </div>
              </>
            )}
            <SliderInput label="Size" value={style.iconSize} min={24} max={96} onChange={(v) => updateStyle({ iconSize: v })} />
            <SliderInput label="Border Radius %" value={style.iconBorderRadius} min={0} max={50} onChange={(v) => updateStyle({ iconBorderRadius: v })} />
            {data.iconMode === 'emoji' && (
              <div className="form-group">
                <label>Background</label>
                <div className="color-input-row">
                  <input type="color" value={style.iconBackgroundColor || '#eef2ff'} onChange={(e) => updateStyle({ iconBackgroundColor: e.target.value })} />
                  <input type="text" value={style.iconBackgroundColor || '#eef2ff'} onChange={(e) => updateStyle({ iconBackgroundColor: e.target.value })} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Badge */}
      <div className="panel-section">
        <div className="panel-section-title">Badge</div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={data.showBadge}
              onChange={(e) => updateData({ showBadge: e.target.checked })}
            />{' '}
            Show Badge
          </label>
        </div>
        {data.showBadge && (
          <>
            <div className="form-group">
              <label>Text</label>
              <input type="text" value={data.badgeText} onChange={(e) => updateData({ badgeText: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Background</label>
              <div className="color-input-row">
                <input type="color" value={style.badgeBackgroundColor || '#eef2ff'} onChange={(e) => updateStyle({ badgeBackgroundColor: e.target.value })} />
                <input type="text" value={style.badgeBackgroundColor || '#eef2ff'} onChange={(e) => updateStyle({ badgeBackgroundColor: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Text Color</label>
              <div className="color-input-row">
                <input type="color" value={style.badgeTextColor || '#4338ca'} onChange={(e) => updateStyle({ badgeTextColor: e.target.value })} />
                <input type="text" value={style.badgeTextColor || '#4338ca'} onChange={(e) => updateStyle({ badgeTextColor: e.target.value })} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Heading */}
      <div className="panel-section">
        <div className="panel-section-title">Heading</div>
        <div className="form-group">
          <label>Text</label>
          <input type="text" value={data.heading} onChange={(e) => updateData({ heading: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Color</label>
          <div className="color-input-row">
            <input type="color" value={style.headingColor || '#0f172a'} onChange={(e) => updateStyle({ headingColor: e.target.value })} />
            <input type="text" value={style.headingColor || '#0f172a'} onChange={(e) => updateStyle({ headingColor: e.target.value })} />
          </div>
        </div>
        <SliderInput label="Font Size" value={style.headingFontSize} min={12} max={48} onChange={(v) => updateStyle({ headingFontSize: v })} />
        <div className="form-group">
          <label>Font</label>
          <select value={style.headingFontFamily} onChange={(e) => updateStyle({ headingFontFamily: e.target.value })}>
            {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <SliderInput label="Font Weight" value={style.headingFontWeight} min={300} max={900} step={100} onChange={(v) => updateStyle({ headingFontWeight: v })} />
      </div>

      {/* Body */}
      <div className="panel-section">
        <div className="panel-section-title">Body Text</div>
        <div className="form-group">
          <label>Text</label>
          <textarea
            value={data.body}
            onChange={(e) => updateData({ body: e.target.value })}
            rows={3}
          />
        </div>
        <div className="form-group">
          <label>Color</label>
          <div className="color-input-row">
            <input type="color" value={style.bodyColor || '#475569'} onChange={(e) => updateStyle({ bodyColor: e.target.value })} />
            <input type="text" value={style.bodyColor || '#475569'} onChange={(e) => updateStyle({ bodyColor: e.target.value })} />
          </div>
        </div>
        <SliderInput label="Font Size" value={style.bodyFontSize} min={10} max={24} onChange={(v) => updateStyle({ bodyFontSize: v })} />
        <div className="form-group">
          <label>Font</label>
          <select value={style.bodyFontFamily} onChange={(e) => updateStyle({ bodyFontFamily: e.target.value })}>
            {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      </div>

      {/* Button */}
      <div className="panel-section">
        <div className="panel-section-title">Button</div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={data.showButton}
              onChange={(e) => updateData({ showButton: e.target.checked })}
            />{' '}
            Show Button
          </label>
        </div>
        {data.showButton && (
          <>
            <div className="form-group">
              <label>Text</label>
              <input type="text" value={data.buttonText} onChange={(e) => updateData({ buttonText: e.target.value })} />
            </div>
            <div className="form-group">
              <label>URL</label>
              <input type="text" value={data.buttonUrl} onChange={(e) => updateData({ buttonUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div className="form-group">
              <label>Background</label>
              <div className="color-input-row">
                <input type="color" value={style.buttonBackgroundColor || '#4f46e5'} onChange={(e) => updateStyle({ buttonBackgroundColor: e.target.value })} />
                <input type="text" value={style.buttonBackgroundColor || '#4f46e5'} onChange={(e) => updateStyle({ buttonBackgroundColor: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Text Color</label>
              <div className="color-input-row">
                <input type="color" value={style.buttonTextColor || '#ffffff'} onChange={(e) => updateStyle({ buttonTextColor: e.target.value })} />
                <input type="text" value={style.buttonTextColor || '#ffffff'} onChange={(e) => updateStyle({ buttonTextColor: e.target.value })} />
              </div>
            </div>
            <SliderInput label="Border Radius" value={style.buttonBorderRadius} min={0} max={50} onChange={(v) => updateStyle({ buttonBorderRadius: v })} />
            <SliderInput label="Font Size" value={style.buttonFontSize} min={10} max={24} onChange={(v) => updateStyle({ buttonFontSize: v })} />
            <div className="form-group">
              <label>Font</label>
              <select value={style.buttonFontFamily} onChange={(e) => updateStyle({ buttonFontFamily: e.target.value })}>
                {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <SliderInput label="Font Weight" value={style.buttonFontWeight} min={300} max={900} step={100} onChange={(v) => updateStyle({ buttonFontWeight: v })} />
            <SliderInput label="Horizontal Padding" value={style.buttonPaddingX} min={8} max={48} onChange={(v) => updateStyle({ buttonPaddingX: v })} />
            <SliderInput label="Vertical Padding" value={style.buttonPaddingY} min={4} max={24} onChange={(v) => updateStyle({ buttonPaddingY: v })} />
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={style.buttonFullWidth}
                  onChange={(e) => updateStyle({ buttonFullWidth: e.target.checked })}
                />{' '}
                Full Width
              </label>
            </div>
          </>
        )}
      </div>

      {/* Container */}
      <div className="panel-section">
        <div className="panel-section-title">Container</div>
        <div className="form-group">
          <label>Background</label>
          <div className="color-input-row">
            <input type="color" value={style.backgroundColor || '#ffffff'} onChange={(e) => updateStyle({ backgroundColor: e.target.value })} />
            <input type="text" value={style.backgroundColor || '#ffffff'} onChange={(e) => updateStyle({ backgroundColor: e.target.value })} />
          </div>
        </div>
        <SliderInput label="Border Radius" value={style.borderRadius} min={0} max={32} onChange={(v) => updateStyle({ borderRadius: v })} />
        <SliderInput label="Border Width" value={style.borderWidth} min={0} max={4} onChange={(v) => updateStyle({ borderWidth: v })} />
        {style.borderWidth > 0 && (
          <>
            <div className="form-group">
              <label>Border Color</label>
              <div className="color-input-row">
                <input type="color" value={style.borderColor || '#e2e8f0'} onChange={(e) => updateStyle({ borderColor: e.target.value })} />
                <input type="text" value={style.borderColor || '#e2e8f0'} onChange={(e) => updateStyle({ borderColor: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Border Style</label>
              <select value={style.borderStyle} onChange={(e) => updateStyle({ borderStyle: e.target.value as 'solid' | 'dashed' | 'dotted' | 'none' })}>
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
                <option value="none">None</option>
              </select>
            </div>
          </>
        )}
        <AlignmentPicker value={style.contentAlignment || 'center'} onChange={(v) => updateStyle({ contentAlignment: v })} />
        <SpacingControl value={style.padding || { top: 24, right: 24, bottom: 24, left: 24 }} onChange={(v) => updateStyle({ padding: v })} />
      </div>
    </div>
  );
}
