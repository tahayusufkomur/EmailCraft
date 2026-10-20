import type { ColumnsBlock, Column } from '../../../types/blocks';
import { useEditorStore } from '../../../store/editorStore';
import { SliderInput } from './SliderInput';
import { SpacingControl } from './SpacingControl';
import { ImageUrlPicker } from './ImageUrlPicker';

interface Props {
  block: ColumnsBlock;
}

export function ColumnsSettings({ block }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const setColumnCount = (count: 1 | 2 | 3) => {
    const columns = block.data.columns.slice(0, count);
    while (columns.length < count) columns.push({ id: crypto.randomUUID(), blocks: [] });
    const ratio = count === 1 ? [100] : count === 2 ? [50, 50] : [33, 34, 33];
    updateBlock(block.id, {
      data: { ...block.data, columnCount: count, columnRatio: ratio, columns },
    } as Partial<ColumnsBlock>);
  };

  const updateColumn = (index: number, patch: Partial<Column>) => {
    const columns = block.data.columns.map((c, i) => (i === index ? { ...c, ...patch } : c));
    updateBlock(block.id, { data: { ...block.data, columns } } as Partial<ColumnsBlock>);
  };

  const updateStyle = (style: Partial<ColumnsBlock['style']>) => {
    updateBlock(block.id, { style: { ...block.style, ...style } });
  };

  return (
    <div>
      <div className="panel-section">
        <div className="panel-section-title">Column Layout</div>
        <div className="form-group">
          <label>Number of Columns</label>
          <div className="alignment-picker">
            <button
              className={block.data.columnCount === 1 ? 'active' : ''}
              onClick={() => setColumnCount(1)}
            >
              1 Column
            </button>
            <button
              className={block.data.columnCount === 2 ? 'active' : ''}
              onClick={() => setColumnCount(2)}
            >
              2 Columns
            </button>
            <button
              className={block.data.columnCount === 3 ? 'active' : ''}
              onClick={() => setColumnCount(3)}
            >
              3 Columns
            </button>
          </div>
        </div>
        <SliderInput label="Column Gap" value={block.style.gap ?? 10} min={0} max={40} onChange={(v) => updateStyle({ gap: v })} />
        <SliderInput label="Min Height" value={block.style.minHeight || 0} min={0} max={800} onChange={(v) => updateStyle({ minHeight: v })} />
        <div className="form-group">
          <label>Vertical Alignment</label>
          <select
            value={block.style.verticalAlignment || 'top'}
            onChange={(e) => updateStyle({ verticalAlignment: e.target.value as 'top' | 'center' | 'bottom' })}
          >
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
        <div className="toggle-row">
          <label>Stack on Mobile</label>
          <input
            type="checkbox"
            checked={block.style.stackOnMobile !== false}
            onChange={(e) => updateStyle({ stackOnMobile: e.target.checked })}
          />
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-title">Column Backgrounds</div>
        {block.data.columns.map((col, index) => (
          <div key={col.id}>
            <div className="form-group">
              <label>Column {index + 1} Background</label>
              <div className="color-input-row">
                <input
                  type="color"
                  value={col.backgroundColor || '#ffffff'}
                  onChange={(e) => updateColumn(index, { backgroundColor: e.target.value })}
                />
                <input
                  type="text"
                  value={col.backgroundColor || ''}
                  placeholder="transparent"
                  onChange={(e) => updateColumn(index, { backgroundColor: e.target.value || null })}
                />
              </div>
            </div>
            <ImageUrlPicker
              value={col.backgroundImage || ''}
              onChange={(url) => updateColumn(index, { backgroundImage: url || null })}
              label={`Column ${index + 1} Background Image`}
              showPreview={false}
            />
            <div className="form-group">
              <label>Column {index + 1} Padding</label>
              <SpacingControl
                value={col.padding || { top: 0, right: Math.floor((block.style.gap ?? 10) / 2), bottom: 0, left: Math.floor((block.style.gap ?? 10) / 2) }}
                onChange={(padding) => updateColumn(index, { padding })}
              />
            </div>
            <SliderInput label={`Column ${index + 1} Radius`} value={col.borderRadius || 0} min={0} max={64} onChange={(v) => updateColumn(index, { borderRadius: v })} />
          </div>
        ))}
      </div>
    </div>
  );
}
