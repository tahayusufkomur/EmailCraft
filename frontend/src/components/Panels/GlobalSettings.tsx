import { useEditorStore } from '../../store/editorStore';

const WEB_SAFE_FONTS = [
  'Arial, Helvetica, sans-serif',
  'Georgia, "Times New Roman", Times, serif',
  '"Trebuchet MS", Helvetica, sans-serif',
  'Verdana, Geneva, sans-serif',
  '"Courier New", Courier, monospace',
];

export function GlobalSettings() {
  const settings = useEditorStore((s) => s.template.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  return (
    <div>
      <div className="panel-section">
        <div className="panel-section-title">Background</div>
        <div className="form-group">
          <label>Background Color</label>
          <div className="color-input-row">
            <input
              type="color"
              value={settings.backgroundColor}
              onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
            />
            <input
              type="text"
              value={settings.backgroundColor}
              onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-title">Typography</div>
        <div className="form-group">
          <label>Default Font</label>
          <select
            value={settings.defaultFont}
            onChange={(e) => updateSettings({ defaultFont: e.target.value })}
          >
            {WEB_SAFE_FONTS.map((font) => (
              <option key={font} value={font}>{font.split(',')[0].replace(/"/g, '')}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Default Font Size (px)</label>
          <input
            type="number"
            min={10}
            max={32}
            value={settings.defaultFontSize}
            onChange={(e) => updateSettings({ defaultFontSize: Number(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>Default Text Color</label>
          <div className="color-input-row">
            <input
              type="color"
              value={settings.defaultColor}
              onChange={(e) => updateSettings({ defaultColor: e.target.value })}
            />
            <input
              type="text"
              value={settings.defaultColor}
              onChange={(e) => updateSettings({ defaultColor: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-title">Layout</div>
        <div className="form-group">
          <label>Content Width (px)</label>
          <input
            type="number"
            min={320}
            max={800}
            step={10}
            value={settings.contentWidth}
            onChange={(e) => updateSettings({ contentWidth: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}
