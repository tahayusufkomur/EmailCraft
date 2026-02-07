import { useState, useMemo } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { exportToHtml } from '../../lib/htmlExporter';

interface Props {
  onClose: () => void;
}

type ViewMode = 'desktop' | 'mobile';

export function PreviewModal({ onClose }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const template = useEditorStore((s) => s.template);

  const html = useMemo(() => exportToHtml(template, 'placeholders'), [template]);
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
            <button
              className={`btn ${viewMode === 'desktop' ? 'btn-primary' : ''}`}
              onClick={() => setViewMode('desktop')}
            >
              Desktop
            </button>
            <button
              className={`btn ${viewMode === 'mobile' ? 'btn-primary' : ''}`}
              onClick={() => setViewMode('mobile')}
            >
              Mobile
            </button>
          </div>
          <button className="btn" onClick={onClose}>&times; Close</button>
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
