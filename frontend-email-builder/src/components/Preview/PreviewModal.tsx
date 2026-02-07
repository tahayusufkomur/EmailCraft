import { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { useEditorStore } from '../../store/editorStore';
import { useConfigStore } from '../../store/configStore';
import { exportToHtml } from '../../lib/htmlExporter';
import { substituteVariablesClientSide } from '../../lib/variableUtils';

interface Props {
  onClose: () => void;
}

type ViewMode = 'desktop' | 'mobile';

export function PreviewModal({ onClose }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [showDefaults, setShowDefaults] = useState(false);
  const template = useEditorStore((s) => s.template);
  const variables = useConfigStore((s) => s.variables);

  const html = useMemo(() => {
    if (showDefaults && variables.length > 0) {
      const defaults: Record<string, string> = {};
      for (const v of variables) {
        defaults[v.key] = v.defaultValue || `[${v.label}]`;
      }
      const substituted = substituteVariablesClientSide(template, defaults);
      return exportToHtml(substituted, 'defaults');
    }
    return exportToHtml(template, 'placeholders');
  }, [template, showDefaults, variables]);

  const width = viewMode === 'desktop' ? 640 : 375;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white', borderRadius: 8, width: '90vw', maxWidth: 900,
          height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: '1px solid #e2e8f0',
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              size="sm"
              variant={viewMode === 'desktop' ? 'default' : 'outline'}
              onClick={() => setViewMode('desktop')}
            >
              Desktop
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'mobile' ? 'default' : 'outline'}
              onClick={() => setViewMode('mobile')}
            >
              Mobile
            </Button>
            {variables.length > 0 && (
              <Button
                size="sm"
                variant={showDefaults ? 'default' : 'outline'}
                onClick={() => setShowDefaults(!showDefaults)}
              >
                {showDefaults ? 'Show Placeholders' : 'Show Sample Data'}
              </Button>
            )}
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            &times; Close
          </Button>
        </div>

        {/* Preview */}
        <div style={{
          flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center',
          padding: 24, background: '#f4f4f4',
        }}>
          <iframe
            srcDoc={html}
            style={{
              width, maxWidth: '100%', height: '100%', border: '1px solid #e2e8f0',
              background: 'white', transition: 'width 0.3s ease',
            }}
            sandbox="allow-same-origin"
            title="Email preview"
          />
        </div>
      </div>
    </div>
  );
}
