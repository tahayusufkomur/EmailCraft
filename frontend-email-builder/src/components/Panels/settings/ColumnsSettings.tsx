import type { ColumnsBlock } from '../../../types/blocks';
import { useEditorStore } from '../../../store/editorStore';

interface Props {
  block: ColumnsBlock;
}

export function ColumnsSettings({ block }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const setColumnCount = (count: 2 | 3) => {
    const columns = [...block.data.columns];
    if (count === 3 && columns.length === 2) {
      columns.push({ id: crypto.randomUUID(), blocks: [] });
    } else if (count === 2 && columns.length === 3) {
      columns.pop();
    }
    const ratio = count === 2 ? [50, 50] : [33, 34, 33];
    updateBlock(block.id, {
      data: { ...block.data, columnCount: count, columnRatio: ratio, columns },
    } as Partial<ColumnsBlock>);
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
        <div className="form-group">
          <label>Column Gap (px)</label>
          <input
            type="number"
            min={0}
            max={40}
            value={block.style.gap || 10}
            onChange={(e) => updateStyle({ gap: Number(e.target.value) })}
          />
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
          <div className="form-group" key={col.id}>
            <label>Column {index + 1} Background</label>
            <div className="color-input-row">
              <input
                type="color"
                value={col.backgroundColor || '#ffffff'}
                onChange={(e) => {
                  const columns = block.data.columns.map((c, i) =>
                    i === index ? { ...c, backgroundColor: e.target.value } : c,
                  );
                  updateBlock(block.id, { data: { ...block.data, columns } } as Partial<ColumnsBlock>);
                }}
              />
              <input
                type="text"
                value={col.backgroundColor || ''}
                placeholder="transparent"
                onChange={(e) => {
                  const columns = block.data.columns.map((c, i) =>
                    i === index ? { ...c, backgroundColor: e.target.value || null } : c,
                  );
                  updateBlock(block.id, { data: { ...block.data, columns } } as Partial<ColumnsBlock>);
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
