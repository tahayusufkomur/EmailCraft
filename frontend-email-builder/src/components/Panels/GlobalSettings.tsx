import { useEditorStore } from '../../store/editorStore';
import {
  BODY_BACKGROUND_STYLE_PRESETS,
  getBodyBackgroundStylePreset,
  resolveTemplateBodyBackgroundStyle,
} from '../../lib/backgroundStyles';

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
  const selectedBodyBackgroundStyle = resolveTemplateBodyBackgroundStyle(settings.bodyBackgroundStyle);
  const selectedBodyPreset = getBodyBackgroundStylePreset(selectedBodyBackgroundStyle);

  return (
    <div>
      <div className="panel-section">
        <div className="panel-section-title">Email Body Background</div>
        <div className="form-group">
          <label>Style Preset</label>
          <div className="background-style-grid">
            {BODY_BACKGROUND_STYLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`background-style-option ${selectedBodyBackgroundStyle === preset.id ? 'active' : ''}`}
                onClick={() => updateSettings({ bodyBackgroundStyle: preset.id })}
                title={preset.description}
              >
                <span
                  className="background-style-preview"
                  style={{ background: preset.canvasBackground }}
                />
                <span className="background-style-name">{preset.label}</span>
              </button>
            ))}
          </div>
          <p className="background-style-description">
            {selectedBodyPreset.description}
          </p>
        </div>
        <div className="form-group">
          <label>Fallback Body Color</label>
          <div className="color-input-row">
            <input
              type="color"
              value={settings.bodyBackgroundColor || '#ffffff'}
              onChange={(e) => updateSettings({ bodyBackgroundColor: e.target.value })}
            />
            <input
              type="text"
              value={settings.bodyBackgroundColor || '#ffffff'}
              onChange={(e) => updateSettings({ bodyBackgroundColor: e.target.value })}
            />
          </div>
          <p className="background-style-description">
            Applies to the complete email content area for export and render.
          </p>
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
        <div className="form-group">
          <label>Body Border Radius (px)</label>
          <input
            type="number"
            min={0}
            max={32}
            value={settings.bodyBorderRadius || 0}
            onChange={(e) => updateSettings({ bodyBorderRadius: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}
