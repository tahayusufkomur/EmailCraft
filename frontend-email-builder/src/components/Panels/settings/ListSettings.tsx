import type { ListBlock, ListItem } from '../../../types/blocks';
import { useEditorStore } from '../../../store/editorStore';
import { SliderInput } from './SliderInput';
import { AlignmentPicker } from './AlignmentPicker';
import { SpacingControl } from './SpacingControl';
import { FONT_OPTIONS } from '../../../lib/fonts';

interface Props {
  block: ListBlock;
}

export function ListSettings({ block }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const { data, style } = block;

  const updateStyle = (updates: Partial<ListBlock['style']>) => {
    updateBlock(block.id, { style: { ...style, ...updates } } as Partial<ListBlock>);
  };

  const updateItem = (index: number, updates: Partial<ListItem>) => {
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], ...updates };
    updateBlock(block.id, { data: { ...data, items: newItems } } as Partial<ListBlock>);
  };

  const addItem = () => {
    const newItems = [...data.items, { id: crypto.randomUUID(), icon: '•', text: 'New item', subtitle: '' }];
    updateBlock(block.id, { data: { ...data, items: newItems } } as Partial<ListBlock>);
  };

  const removeItem = (index: number) => {
    if (data.items.length <= 1) return;
    const newItems = data.items.filter((_, i) => i !== index);
    updateBlock(block.id, { data: { ...data, items: newItems } } as Partial<ListBlock>);
  };

  return (
    <div>
      {/* Items */}
      <div className="panel-section">
        <div className="panel-section-title">List Items</div>
        {data.items.map((item, index) => (
          <div key={item.id} style={{ marginBottom: 12, padding: 8, border: '1px solid var(--border-color, #e2e8f0)', borderRadius: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary, #64748b)' }}>#{index + 1}</span>
              <div style={{ flex: 1 }} />
              {data.items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#ef4444', padding: '0 4px' }}
                >
                  ×
                </button>
              )}
            </div>
            <div className="form-group" style={{ marginBottom: 6 }}>
              <label style={{ fontSize: 11 }}>Icon</label>
              <input
                type="text"
                value={item.icon}
                onChange={(e) => updateItem(index, { icon: e.target.value })}
                style={{ width: 50, fontSize: 16, textAlign: 'center' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 6 }}>
              <label style={{ fontSize: 11 }}>Text</label>
              <input
                type="text"
                value={item.text}
                onChange={(e) => updateItem(index, { text: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 11 }}>Subtitle</label>
              <input
                type="text"
                value={item.subtitle}
                onChange={(e) => updateItem(index, { subtitle: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-sm" onClick={addItem} style={{ width: '100%' }}>
          + Add Item
        </button>
      </div>

      {/* Style */}
      <div className="panel-section">
        <div className="panel-section-title">Style</div>
        <div className="form-group">
          <label>Layout</label>
          <div style={{ display: 'flex', gap: 4 }}>
            <button type="button" className={`btn btn-sm ${style.layout === 'vertical' ? 'btn-primary' : ''}`} onClick={() => updateStyle({ layout: 'vertical' })}>
              Vertical
            </button>
            <button type="button" className={`btn btn-sm ${style.layout === 'horizontal' ? 'btn-primary' : ''}`} onClick={() => updateStyle({ layout: 'horizontal' })}>
              Horizontal
            </button>
          </div>
        </div>
        <SliderInput label="Spacing" value={style.spacing} min={4} max={32} onChange={(v) => updateStyle({ spacing: v })} />
        <SliderInput label="Icon Size" value={style.iconSize} min={12} max={40} onChange={(v) => updateStyle({ iconSize: v })} />
        <div className="form-group">
          <label>Icon Color</label>
          <div className="color-input-row">
            <input type="color" value={style.iconColor || '#4f46e5'} onChange={(e) => updateStyle({ iconColor: e.target.value })} />
            <input type="text" value={style.iconColor || '#4f46e5'} onChange={(e) => updateStyle({ iconColor: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Text Color</label>
          <div className="color-input-row">
            <input type="color" value={style.textColor || '#0f172a'} onChange={(e) => updateStyle({ textColor: e.target.value })} />
            <input type="text" value={style.textColor || '#0f172a'} onChange={(e) => updateStyle({ textColor: e.target.value })} />
          </div>
        </div>
        <SliderInput label="Text Size" value={style.textFontSize} min={10} max={24} onChange={(v) => updateStyle({ textFontSize: v })} />
        <div className="form-group">
          <label>Font</label>
          <select value={style.textFontFamily} onChange={(e) => updateStyle({ textFontFamily: e.target.value })}>
            {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <SliderInput label="Font Weight" value={style.textFontWeight} min={300} max={900} step={100} onChange={(v) => updateStyle({ textFontWeight: v })} />
        <div className="form-group">
          <label>Subtitle Color</label>
          <div className="color-input-row">
            <input type="color" value={style.subtitleColor || '#64748b'} onChange={(e) => updateStyle({ subtitleColor: e.target.value })} />
            <input type="text" value={style.subtitleColor || '#64748b'} onChange={(e) => updateStyle({ subtitleColor: e.target.value })} />
          </div>
        </div>
        <SliderInput label="Subtitle Size" value={style.subtitleFontSize} min={10} max={20} onChange={(v) => updateStyle({ subtitleFontSize: v })} />
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
        <AlignmentPicker value={style.contentAlignment || 'left'} onChange={(v) => updateStyle({ contentAlignment: v })} />
        <SpacingControl value={style.padding || { top: 16, right: 24, bottom: 16, left: 24 }} onChange={(v) => updateStyle({ padding: v })} />
      </div>
    </div>
  );
}
