import { useEditorStore } from '../../store/editorStore';
import { SliderInput } from './settings/SliderInput';
import {
  BODY_BACKGROUND_STYLE_PRESETS,
  getBodyBackgroundStylePreset,
  resolveTemplateBodyBackgroundStyle,
} from '../../lib/backgroundStyles';


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
        <div className="panel-section-title">Layout</div>
        <SliderInput label="Content Width" value={settings.contentWidth} min={320} max={800} step={10} onChange={(v) => updateSettings({ contentWidth: v })} />
        <SliderInput label="Body Border Radius" value={settings.bodyBorderRadius || 0} min={0} max={32} onChange={(v) => updateSettings({ bodyBorderRadius: v })} />
      </div>
    </div>
  );
}
