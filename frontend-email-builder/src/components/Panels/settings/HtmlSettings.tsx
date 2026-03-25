import type { HtmlBlock } from '../../../types/blocks';
import { useEditorStore } from '../../../store/editorStore';
import { AlignmentPicker } from './AlignmentPicker';
import { SpacingControl } from './SpacingControl';

interface Props {
  block: HtmlBlock;
}

export function HtmlSettings({ block }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const updateData = (data: Partial<HtmlBlock['data']>) => {
    updateBlock(block.id, { data: { ...block.data, ...data } } as Partial<HtmlBlock>);
  };

  const updateStyle = (style: Partial<HtmlBlock['style']>) => {
    updateBlock(block.id, { style: { ...block.style, ...style } });
  };

  return (
    <div>
      <div className="panel-section">
        <div className="panel-section-title">HTML Content</div>
        <div className="form-group">
          <label>Raw HTML</label>
          <textarea
            value={block.data.html}
            rows={8}
            onChange={(e) => updateData({ html: e.target.value })}
          />
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-title">Alignment</div>
        <AlignmentPicker
          value={block.style.alignment || 'left'}
          onChange={(alignment) => updateStyle({ alignment })}
        />
      </div>

      <div className="panel-section">
        <div className="panel-section-title">Padding</div>
        <SpacingControl
          value={block.style.padding || { top: 10, right: 20, bottom: 10, left: 20 }}
          onChange={(padding) => updateStyle({ padding })}
        />
      </div>

      <div className="panel-section">
        <div className="panel-section-title">Background</div>
        <div className="form-group">
          <label>Background Color</label>
          <div className="color-input-row">
            <input
              type="color"
              value={block.style.backgroundColor || '#ffffff'}
              onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
            />
            <input
              type="text"
              value={block.style.backgroundColor || ''}
              placeholder="transparent"
              onChange={(e) => updateStyle({ backgroundColor: e.target.value || null })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
