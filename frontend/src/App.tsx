import { useEffect, useState } from 'react';
import './App.css';
import { Canvas } from './components/Editor/Canvas';
import { BlockPalette } from './components/Panels/BlockPalette';
import { StylePanel } from './components/Panels/StylePanel';
import { PreviewModal } from './components/Preview/PreviewModal';
import { TemplateGallery } from './components/Gallery/TemplateGallery';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { useEditorStore } from './store/editorStore';
import { exportToHtml } from './lib/htmlExporter';
import { useAutoSave, loadDraft } from './hooks/useAutoSave';
import { sendReadyEvent, sendSaveEvent } from './lib/postMessage';
import type { EmailTemplate } from './types/blocks';

const isEmailTemplate = (value: unknown): value is EmailTemplate => {
  if (!value || typeof value !== 'object') return false;
  const maybe = value as EmailTemplate;
  return Boolean(maybe.version && maybe.settings && maybe.body && Array.isArray(maybe.body.blocks));
};

function App() {
  const isDirty = useEditorStore((s) => s.isDirty);
  const template = useEditorStore((s) => s.template);
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const [showPreview, setShowPreview] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  useAutoSave();

  useEffect(() => {
    const draft = loadDraft();
    if (draft && isEmailTemplate(draft)) {
      loadTemplate(draft);
    }
    sendReadyEvent();
  }, [loadTemplate]);

  const handleSave = () => {
    localStorage.setItem('mailcraft_draft', JSON.stringify(template));
    useEditorStore.getState().markClean();

    const html = exportToHtml(template, 'placeholders');
    sendSaveEvent(html, template);
  };

  const handleExport = () => {
    const html = exportToHtml(template, 'placeholders');
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'email-template.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      <div className="top-toolbar">
        <div className="brand">
          <div className="brand-title">MailCraft</div>
          <div className="brand-subtitle">Email Builder</div>
        </div>
        <div className="toolbar-actions">
          <Button variant="secondary" onClick={() => setShowGallery(true)}>
            Gallery
          </Button>
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            Preview
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
          <Button variant="default" onClick={handleExport}>
            Export HTML
          </Button>
          {isDirty && <Badge variant="secondary">Unsaved</Badge>}
        </div>
      </div>
      <div className="editor-layout">
        <BlockPalette />
        <Canvas />
        <StylePanel />
      </div>
      {showPreview && <PreviewModal onClose={() => setShowPreview(false)} />}
      {showGallery && <TemplateGallery onClose={() => setShowGallery(false)} />}
    </div>
  );
}

export default App;
