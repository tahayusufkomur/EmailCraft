import { useEffect, useRef, useState } from 'react';
import './App.css';
import { EditorDndContext } from './components/Editor/EditorDndContext';
import { Canvas } from './components/Editor/Canvas';
import { BlockPalette } from './components/Panels/BlockPalette';
import { StylePanel } from './components/Panels/StylePanel';
import { PreviewModal } from './components/Preview/PreviewModal';
import { TemplateGallery } from './components/Gallery/TemplateGallery';
import { MediaLibraryModal } from './components/Media/MediaLibraryModal';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { useConfigStore } from './store/configStore';
import { useEditorStore } from './store/editorStore';
import { exportToHtml } from './lib/htmlExporter';
import { applyImageUrlToBlock } from './lib/media';
import { api } from './lib/api';
import { useAutoSave, loadDraft } from './hooks/useAutoSave';
import { listenToParent, sendErrorEvent, sendReadyEvent, sendSaveEvent } from './lib/postMessage';
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

const asOptionalNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

const asOptionalBooleanFromSearchParam = (value: string | null): boolean | undefined => {
  if (value === null) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') {
    return false;
  }
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

const normalizeUiContextFromSession = (
  widgetContext: unknown,
): { showLogo?: boolean; showExportHtmlButton?: boolean; themeMode?: ThemeMode } => {
  if (!widgetContext || typeof widgetContext !== 'object') return {};

  const maybe = widgetContext as {
    show_logo?: unknown;
    show_export_html_button?: unknown;
    theme_mode?: unknown;
  };

  const output: { showLogo?: boolean; showExportHtmlButton?: boolean; themeMode?: ThemeMode } = {};
  const showLogo = asOptionalBoolean(maybe.show_logo);
  const showExportHtmlButton = asOptionalBoolean(maybe.show_export_html_button);
  const themeMode = asOptionalThemeMode(maybe.theme_mode);

  if (showLogo !== undefined) output.showLogo = showLogo;
  if (showExportHtmlButton !== undefined) output.showExportHtmlButton = showExportHtmlButton;
  if (themeMode !== undefined) output.themeMode = themeMode;
  return output;
};

const normalizeUiContextFromSearch = (
  params: URLSearchParams,
): { showLogo?: boolean; showExportHtmlButton?: boolean; themeMode?: ThemeMode } => {
  const showLogo = asOptionalBooleanFromSearchParam(params.get('showLogo'));
  const legacyHideLogo = asOptionalBooleanFromSearchParam(params.get('hideLogo'));
  const showExportHtmlButton = asOptionalBooleanFromSearchParam(params.get('showExportHtmlButton'));
  const themeMode = asOptionalThemeMode(params.get('themeMode'));

  const output: { showLogo?: boolean; showExportHtmlButton?: boolean; themeMode?: ThemeMode } = {};
  if (showLogo !== undefined) output.showLogo = showLogo;
  if (showLogo === undefined && legacyHideLogo !== undefined) output.showLogo = !legacyHideLogo;
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
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const selectedBlock = useEditorStore((s) => s.getSelectedBlock());
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const showLogo = useConfigStore((s) => s.showLogo);
  const showExportHtmlButton = useConfigStore((s) => s.showExportHtmlButton);
  const themeMode = useConfigStore((s) => s.themeMode);
  const setConfig = useConfigStore((s) => s.setConfig);
  const hostContextAppliedRef = useRef(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
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
    const params = new URLSearchParams(window.location.search);
    const contextFromQuery = normalizeUiContextFromSearch(params);
    const shouldApplyQueryContext =
      asOptionalBooleanFromSearchParam(params.get('contextOverride')) === true || window.parent !== window;
    const apiKeyFromQuery = params.get('apiKey');
    let resolvedApiKey: string | null = null;
    if (apiKeyFromQuery) {
      localStorage.setItem('mailcraft_api_key', apiKeyFromQuery);
      resolvedApiKey = apiKeyFromQuery;
      setConfig({ apiKey: apiKeyFromQuery });
    } else {
      const apiKeyFromStorage = localStorage.getItem('mailcraft_api_key');
      if (apiKeyFromStorage) {
        resolvedApiKey = apiKeyFromStorage;
        setConfig({ apiKey: apiKeyFromStorage });
      }
    }

    const syncSessionConfig = async (apiKey: string) => {
      try {
        const session = await api.createSession(window.location.origin);
        const sessionUiContext = normalizeUiContextFromSession(session.config.widget_context);
        setConfig({
          apiKey,
          sessionToken: session.token,
          plan: session.config.plan,
          variables: normalizeVariables(session.config.variables),
          maxUploadSize: session.config.max_upload_size_bytes,
          maxMediaFilesPerUpload: session.config.max_media_files_per_upload,
          storageUsed: session.config.storage_used_bytes,
          storageLimit: session.config.storage_limit_bytes,
          ...(hostContextAppliedRef.current ? {} : sessionUiContext),
        });
        if (shouldApplyQueryContext && Object.keys(contextFromQuery).length > 0) {
          setConfig(contextFromQuery);
        }
      } catch {
        if (shouldApplyQueryContext && Object.keys(contextFromQuery).length > 0) {
          setConfig(contextFromQuery);
        }
      }
    };

    if (resolvedApiKey) {
      void syncSessionConfig(resolvedApiKey);
    } else if (shouldApplyQueryContext && Object.keys(contextFromQuery).length > 0) {
      setConfig(contextFromQuery);
    }

    const refreshSessionIfNeeded = () => {
      if (!resolvedApiKey) return;
      void syncSessionConfig(resolvedApiKey);
    };
    const handleWindowFocus = () => {
      refreshSessionIfNeeded();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      refreshSessionIfNeeded();
    };
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const stopListening = listenToParent({
      onInit: (config) => {
        const uiContext = normalizeUiContext(config);
        if (Object.keys(uiContext).length > 0) {
          hostContextAppliedRef.current = true;
        }
        const incomingApiKey = asOptionalNonEmptyString(
          config?.apiKey ?? config?.api_key,
        );
        const nextConfig: {
          apiKey?: string;
          variables?: Variable[];
          showLogo?: boolean;
          showExportHtmlButton?: boolean;
          themeMode?: ThemeMode;
        } = {
          ...uiContext,
        };
        if (incomingApiKey) {
          localStorage.setItem('mailcraft_api_key', incomingApiKey);
          nextConfig.apiKey = incomingApiKey;
          void syncSessionConfig(incomingApiKey);
        }
        if (config && typeof config === 'object' && 'variables' in config) {
          nextConfig.variables = normalizeVariables(config.variables);
        }
        setConfig(nextConfig);
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
        void exportTemplateUsingApi({ shouldDownload: false, shouldSendToHost: true });
      },
    });

    const draft = loadDraft();
    if (draft && isEmailTemplate(draft)) {
      loadTemplate(draft);
    }

    sendReadyEvent();
    return () => {
      stopListening();
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadTemplate, setConfig]);

  const handleSave = () => {
    const currentTemplate = useEditorStore.getState().template;
    localStorage.setItem('mailcraft_draft', JSON.stringify(currentTemplate));
    useEditorStore.getState().markClean();
    emitSaveEvent(currentTemplate);
  };

  const resolveErrorMessage = (error: unknown): string => {
    if (error instanceof Error && error.message.trim().length > 0) return error.message;
    return 'Unable to export HTML.';
  };

  const exportTemplateUsingApi = async (
    options?: { shouldDownload?: boolean; shouldSendToHost?: boolean },
  ) => {
    const currentTemplate = useEditorStore.getState().template;
    setExportError(null);
    setIsExporting(true);

    try {
      const response = await api.exportHtml({
        json_data: currentTemplate,
        variables_mode: 'placeholders',
      });
      const html = response.html;

      if (options?.shouldSendToHost) {
        sendSaveEvent(html, currentTemplate);
      }

      if (options?.shouldDownload !== false) {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'email-template.html';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      const message = resolveErrorMessage(error);
      setExportError(message);
      sendErrorEvent('EXPORT_FAILED', message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = async () => {
    await exportTemplateUsingApi({ shouldDownload: true });
  };

  const handleToolbarMediaSelect = (url: string) => {
    const currentSelection = useEditorStore.getState().getSelectedBlock();
    if (!currentSelection || currentSelection.type !== 'image') return;
    applyImageUrlToBlock(currentSelection, url, updateBlock);
  };

  const isDarkChrome = themeMode === 'dark' || (themeMode === 'system' && prefersDarkScheme);
  const canApplySelectedMedia = Boolean(selectedBlock && selectedBlock.type === 'image');

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
            Templates
          </Button>
          <Button variant="secondary" onClick={() => setShowMedia(true)}>
            Media
          </Button>
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            Preview
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
          {showExportHtmlButton && (
            <Button variant="default" onClick={() => void handleExport()} disabled={isExporting}>
              {isExporting ? 'Exporting...' : 'Export HTML'}
            </Button>
          )}
          {isDirty && <Badge variant="secondary">Unsaved</Badge>}
          {exportError && <Badge variant="destructive">{exportError}</Badge>}
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
      {showMedia && (
        <MediaLibraryModal
          onClose={() => setShowMedia(false)}
          onSelectUrl={canApplySelectedMedia ? handleToolbarMediaSelect : undefined}
        />
      )}
    </div>
  );
}

export default App;
