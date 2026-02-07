import { useEffect, useState } from 'react';
import './App.css';
import { EditorDndContext } from './components/Editor/EditorDndContext';
import { Canvas } from './components/Editor/Canvas';
import { BlockPalette } from './components/Panels/BlockPalette';
import { StylePanel } from './components/Panels/StylePanel';
import { PreviewModal } from './components/Preview/PreviewModal';
import { TemplateGallery } from './components/Gallery/TemplateGallery';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { useConfigStore } from './store/configStore';
import { useEditorStore } from './store/editorStore';
import { exportToHtml } from './lib/htmlExporter';
import { useAutoSave, loadDraft } from './hooks/useAutoSave';
import { listenToParent, sendReadyEvent, sendSaveEvent } from './lib/postMessage';
import type { EmailTemplate } from './types/blocks';
import type { ThemeMode, Variable } from './types/editor';

const isEmailTemplate = (value: unknown): value is EmailTemplate => {
  if (!value || typeof value !== 'object') return false;
  const maybe = value as EmailTemplate;
  return Boolean(maybe.version && maybe.settings && maybe.body && Array.isArray(maybe.body.blocks));
};

const isVariable = (value: unknown): value is Variable => {
  if (!value || typeof value !== 'object') return false;
  const maybe = value as Variable;
  if (typeof maybe.key !== 'string' || typeof maybe.label !== 'string') return false;
  if (maybe.defaultValue !== undefined && typeof maybe.defaultValue !== 'string') return false;
  if (maybe.type !== undefined && maybe.type !== 'text' && maybe.type !== 'url') return false;
  return true;
};

const normalizeVariables = (value: unknown): Variable[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isVariable)
    .map((item) => ({
      key: item.key,
      label: item.label,
      defaultValue: item.defaultValue,
      type: item.type || 'text',
    }));
};

const asOptionalBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  return undefined;
};

const asOptionalThemeMode = (value: unknown): ThemeMode | undefined => {
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return undefined;
};

const normalizeUiContext = (
  value: unknown,
): { showLogo?: boolean; showExportHtmlButton?: boolean; themeMode?: ThemeMode } => {
  if (!value || typeof value !== 'object') return {};

  const maybe = value as {
    context?: {
      showLogo?: unknown;
      hideLogo?: unknown;
      showExportHtmlButton?: unknown;
      themeMode?: unknown;
    };
    showLogo?: unknown;
    hideLogo?: unknown;
    showExportHtmlButton?: unknown;
    themeMode?: unknown;
  };

  const embeddedContext =
    maybe.context && typeof maybe.context === 'object' ? maybe.context : {};

  const showLogo = asOptionalBoolean(
    embeddedContext.showLogo !== undefined ? embeddedContext.showLogo : maybe.showLogo,
  );
  const legacyHideLogo = asOptionalBoolean(
    embeddedContext.hideLogo !== undefined ? embeddedContext.hideLogo : maybe.hideLogo,
  );
  const resolvedShowLogo = showLogo !== undefined ? showLogo : legacyHideLogo !== undefined ? !legacyHideLogo : undefined;
  const showExportHtmlButton = asOptionalBoolean(
    embeddedContext.showExportHtmlButton !== undefined
      ? embeddedContext.showExportHtmlButton
      : maybe.showExportHtmlButton,
  );
  const themeMode = asOptionalThemeMode(
    embeddedContext.themeMode !== undefined ? embeddedContext.themeMode : maybe.themeMode,
  );

  const output: { showLogo?: boolean; showExportHtmlButton?: boolean; themeMode?: ThemeMode } = {};
  if (resolvedShowLogo !== undefined) output.showLogo = resolvedShowLogo;
  if (showExportHtmlButton !== undefined) output.showExportHtmlButton = showExportHtmlButton;
  if (themeMode !== undefined) output.themeMode = themeMode;
  return output;
};

function emitSaveEvent(template: EmailTemplate) {
  const html = exportToHtml(template, 'placeholders');
  sendSaveEvent(html, template);
}

function App() {
  const isDirty = useEditorStore((s) => s.isDirty);
  const template = useEditorStore((s) => s.template);
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const showLogo = useConfigStore((s) => s.showLogo);
  const showExportHtmlButton = useConfigStore((s) => s.showExportHtmlButton);
  const themeMode = useConfigStore((s) => s.themeMode);
  const setConfig = useConfigStore((s) => s.setConfig);
  const [showPreview, setShowPreview] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [prefersDarkScheme, setPrefersDarkScheme] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useAutoSave();

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersDarkScheme(event.matches);
    };

    setPrefersDarkScheme(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    const stopListening = listenToParent({
      onInit: (config) => {
        setConfig({
          variables: normalizeVariables(config?.variables),
          ...normalizeUiContext(config),
        });
        if (isEmailTemplate(config?.templateJson)) {
          loadTemplate(config.templateJson);
        }
      },
      onLoadTemplate: (json) => {
        if (isEmailTemplate(json)) {
          loadTemplate(json);
        }
      },
      onExport: () => {
        emitSaveEvent(useEditorStore.getState().template);
      },
    });

    const apiKeyFromQuery = new URLSearchParams(window.location.search).get('apiKey');
    if (apiKeyFromQuery) {
      localStorage.setItem('mailcraft_api_key', apiKeyFromQuery);
      setConfig({ apiKey: apiKeyFromQuery });
    } else {
      const apiKeyFromStorage = localStorage.getItem('mailcraft_api_key');
      if (apiKeyFromStorage) {
        setConfig({ apiKey: apiKeyFromStorage });
      }
    }

    const draft = loadDraft();
    if (draft && isEmailTemplate(draft)) {
      loadTemplate(draft);
    }

    sendReadyEvent();
    return stopListening;
  }, [loadTemplate, setConfig]);

  const handleSave = () => {
    const currentTemplate = useEditorStore.getState().template;
    localStorage.setItem('mailcraft_draft', JSON.stringify(currentTemplate));
    useEditorStore.getState().markClean();
    emitSaveEvent(currentTemplate);
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

  const isDarkChrome = themeMode === 'dark' || (themeMode === 'system' && prefersDarkScheme);

  return (
    <div className={`app-shell ${isDarkChrome ? 'theme-dark' : 'theme-light'}`}>
      <div className="top-toolbar">
        {showLogo && (
          <div className="brand">
            <div className="brand-title">MailCraft</div>
            <div className="brand-subtitle">Email Builder</div>
          </div>
        )}
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
          {showExportHtmlButton && (
            <Button variant="default" onClick={handleExport}>
              Export HTML
            </Button>
          )}
          {isDirty && <Badge variant="secondary">Unsaved</Badge>}
        </div>
      </div>
      <EditorDndContext>
        <div className="editor-layout">
          <BlockPalette />
          <Canvas />
          <StylePanel />
        </div>
      </EditorDndContext>
      {showPreview && <PreviewModal onClose={() => setShowPreview(false)} />}
      {showGallery && <TemplateGallery onClose={() => setShowGallery(false)} />}
    </div>
  );
}

export default App;
