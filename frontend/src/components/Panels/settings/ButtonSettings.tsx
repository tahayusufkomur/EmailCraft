import type { ButtonBlock } from '../../../types/blocks';
import { useEditorStore } from '../../../store/editorStore';
import { AlignmentPicker } from './AlignmentPicker';

interface Props {
  block: ButtonBlock;
}

export function ButtonSettings({ block }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const updateData = (data: Partial<ButtonBlock['data']>) => {
    updateBlock(block.id, { data: { ...block.data, ...data } } as Partial<ButtonBlock>);
  };

  const updateStyle = (style: Partial<ButtonBlock['style']>) => {
    updateBlock(block.id, { style: { ...block.style, ...style } });
  };

  return (
    <div>
      <div className="panel-section">
        <div className="panel-section-title">Button Content</div>
        <div className="form-group">
          <label>Button Text</label>
          <input type="text" value={block.data.text} onChange={(e) => updateData({ text: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Link URL</label>
          <input type="url" value={block.data.url} onChange={(e) => updateData({ url: e.target.value })} />
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-title">Style</div>
        <div className="form-group">
          <label>Background Color</label>
          <div className="color-input-row">
            <input type="color" value={block.style.backgroundColor || '#007bff'} onChange={(e) => updateStyle({ backgroundColor: e.target.value })} />
            <input type="text" value={block.style.backgroundColor || '#007bff'} onChange={(e) => updateStyle({ backgroundColor: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Text Color</label>
          <div className="color-input-row">
            <input type="color" value={block.style.color || '#ffffff'} onChange={(e) => updateStyle({ color: e.target.value })} />
            <input type="text" value={block.style.color || '#ffffff'} onChange={(e) => updateStyle({ color: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Border Radius (px)</label>
          <input type="number" min={0} max={50} value={block.style.borderRadius || 4} onChange={(e) => updateStyle({ borderRadius: Number(e.target.value) })} />
        </div>
        <div className="form-group">
          <label>Font Size (px)</label>
          <input type="number" min={10} max={32} value={block.style.fontSize || 16} onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })} />
        </div>
        <div className="toggle-row">
          <label>Full Width</label>
          <input type="checkbox" checked={block.style.fullWidth || false} onChange={(e) => updateStyle({ fullWidth: e.target.checked })} />
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-title">Alignment</div>
        <AlignmentPicker
          value={block.style.alignment || 'center'}
          onChange={(alignment) => updateStyle({ alignment })}
        />
      </div>
    </div>
  );
}
