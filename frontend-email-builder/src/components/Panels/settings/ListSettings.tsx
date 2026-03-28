import { useState, useMemo } from 'react';
import type { ListBlock, ListItem } from '../../../types/blocks';
import { useEditorStore } from '../../../store/editorStore';
import { SliderInput } from './SliderInput';
import { AlignmentPicker } from './AlignmentPicker';
import { SpacingControl } from './SpacingControl';
import { FONT_OPTIONS } from '../../../lib/fonts';
import { ALL_ICON_NAMES, iconLabel, lucideSvgString } from '../../../lib/lucideIcons';

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
            <ListItemIconPicker item={item} onUpdate={(u) => updateItem(index, u)} />
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

function ListItemIconPicker({ item, onUpdate }: { item: ListItem; onUpdate: (u: Partial<ListItem>) => void }) {
  const mode = item.iconMode || 'text';
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const names = q ? ALL_ICON_NAMES.filter((n) => n.includes(q) || iconLabel(n).toLowerCase().includes(q)) : ALL_ICON_NAMES;
    return names.slice(0, 60);
  }, [search]);

  return (
    <div className="form-group" style={{ marginBottom: 6 }}>
      <label style={{ fontSize: 11 }}>Icon</label>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        <button type="button" className={`btn btn-sm ${mode === 'lucide' ? 'btn-primary' : ''}`} onClick={() => onUpdate({ iconMode: 'lucide', iconName: item.iconName || 'check' })} style={{ fontSize: 10, padding: '2px 8px' }}>Icon</button>
        <button type="button" className={`btn btn-sm ${mode === 'text' ? 'btn-primary' : ''}`} onClick={() => onUpdate({ iconMode: 'text' })} style={{ fontSize: 10, padding: '2px 8px' }}>Text</button>
      </div>
      {mode === 'lucide' ? (
        <>
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            style={{ padding: '4px 8px', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: 4, background: 'var(--panel-bg, #fff)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}
          >
            <span dangerouslySetInnerHTML={{ __html: lucideSvgString(item.iconName || 'check', 14, '#333') }} />
            {item.iconName || 'check'}
          </button>
          {showPicker && (
            <div style={{ marginTop: 4, border: '1px solid var(--border-color, #e2e8f0)', borderRadius: 6, padding: 6, background: 'var(--panel-bg, #fff)' }}>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." style={{ fontSize: 11, marginBottom: 4, width: '100%' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3, maxHeight: 120, overflowY: 'auto' }}>
                {filtered.map((name) => (
                  <button
                    key={name}
                    type="button"
                    title={iconLabel(name)}
                    onClick={() => { onUpdate({ iconMode: 'lucide', iconName: name }); setShowPicker(false); }}
                    style={{
                      padding: 4, border: item.iconName === name ? '2px solid #6366f1' : '1px solid var(--border-color, #e2e8f0)',
                      borderRadius: 4, background: 'var(--panel-bg, #fff)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    dangerouslySetInnerHTML={{ __html: lucideSvgString(name, 14, item.iconName === name ? '#6366f1' : '#64748b') }}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <input type="text" value={item.icon} onChange={(e) => onUpdate({ icon: e.target.value })} style={{ width: 50, fontSize: 16, textAlign: 'center' }} />
      )}
    </div>
  );
}
