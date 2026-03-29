import { useCallback, useRef } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useConfigStore } from '../../store/configStore';
import { SliderInput } from './settings/SliderInput';
import {
  BODY_BACKGROUND_STYLE_PRESETS,
  getBodyBackgroundStylePreset,
  resolveTemplateBodyBackgroundStyle,
} from '../../lib/backgroundStyles';
import { PALETTES, type ColorPalette } from '../../lib/colorPalettes';
import { recolorTemplate } from '../../lib/recolorTemplate';
import type { EmailTemplate } from '../../types/blocks';


function PalettePicker() {
  const template = useEditorStore((s) => s.template);
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const defaultPalette = useConfigStore((s) => s.defaultPalette);
  const setConfig = useConfigStore((s) => s.setConfig);

  // Store the original template (before any palette recolor) so repeated
  // palette switches always produce the same deterministic result.
  const originalTemplateRef = useRef<EmailTemplate | null>(null);

  const getOriginal = useCallback((): EmailTemplate => {
    if (!originalTemplateRef.current) {
      originalTemplateRef.current = structuredClone(template);
    }
    return originalTemplateRef.current;
  }, [template]);

  const applyPalette = useCallback((palette: ColorPalette, slug: string) => {
    const recolored = recolorTemplate(getOriginal(), palette);
    loadTemplate(recolored);
    setConfig({ defaultPalette: slug, customPalette: {} });
  }, [getOriginal, loadTemplate, setConfig]);

  return (
    <div className="panel-section">
      <div className="panel-section-title">Color Palette</div>

      {/* Preset palette picker */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
        {PALETTES.map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() => applyPalette(p, p.slug)}
            style={{
              flex: '0 0 auto',
              padding: '8px 10px',
              border: defaultPalette === p.slug ? '2px solid #6366f1' : '1px solid var(--border-color, #e2e8f0)',
              borderRadius: 8,
              background: 'var(--panel-bg, #ffffff)',
              cursor: 'pointer',
              textAlign: 'center',
              minWidth: 72,
              transition: 'border-color 0.15s',
            }}
          >
            <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginBottom: 4 }}>
              {[p.primary, p.secondary, p.textDark, p.surface].map((color, i) => (
                <span
                  key={i}
                  style={{
                    width: 14, height: 14, borderRadius: '50%',
                    backgroundColor: color,
                    border: '1px solid rgba(0,0,0,0.1)',
                    display: 'inline-block',
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-secondary, #64748b)', whiteSpace: 'nowrap' }}>
              {p.name}
            </span>
          </button>
        ))}
      </div>

    </div>
  );
}


export function GlobalSettings() {
  const settings = useEditorStore((s) => s.template.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const selectedBodyBackgroundStyle = resolveTemplateBodyBackgroundStyle(settings.bodyBackgroundStyle);
  const selectedBodyPreset = getBodyBackgroundStylePreset(selectedBodyBackgroundStyle);

  return (
    <div>
      <PalettePicker />

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
