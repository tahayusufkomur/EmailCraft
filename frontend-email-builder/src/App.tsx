import { useEffect, useRef, useState } from 'react';
import './App.css';
import { EditorDndContext } from './components/Editor/EditorDndContext';
import { Canvas } from './components/Editor/Canvas';
import { BlockPalette } from './components/Panels/BlockPalette';
import { StylePanel } from './components/Panels/StylePanel';
import { PreviewModal } from './components/Preview/PreviewModal';
import { TemplateGallery } from './components/Gallery/TemplateGallery';
import { SaveTemplateModal } from './components/Gallery/SaveTemplateModal';
import { MediaLibraryModal } from './components/Media/MediaLibraryModal';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { useConfigStore } from './store/configStore';
import { useEditorStore } from './store/editorStore';
import { exportToHtml } from './lib/htmlExporter';
import { applyImageUrlToBlock } from './lib/media';
import { api } from './lib/api';
import { useAutoSave, loadDraft } from './hooks/useAutoSave';
import { listenToParent, sendErrorEvent, sendReadyEvent, sendSaveEvent, sendTemplateSavedEvent } from './lib/postMessage';
import type { EmailTemplate, TemplateBackgroundStyle } from './types/blocks';
import type { ThemeMode, Variable } from './types/editor';
import { getBuilderThemePreset, resolveBuilderTheme } from './lib/builderTheme';
import { LayoutGrid, Image, Eye, Save, Download } from 'lucide-react';

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

const builderThemeFromThemeMode = (themeMode: ThemeMode | undefined) => {
  if (themeMode === 'dark') return 'dark-slate' as const;
  return 'light-breeze' as const;
};

const asOptionalBuilderTheme = (value: unknown) => {
  const resolved = resolveBuilderTheme(value);
  if (!value) return undefined;
  return resolved;
};

const asOptionalTemplateBackgroundStyle = (value: unknown): TemplateBackgroundStyle | undefined => {
  if (
    value === 'none'
    || value === 'aurora'
    || value === 'sunset-glow'
    || value === 'mint-weave'
    || value === 'midnight-grid'
    || value === 'paper-rings'
  ) {
    return value;
  }
  return undefined;
};

const asOptionalHexColor = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  if (/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(normalized)) {
    return normalized;
  }
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

type UiContext = {
  showLogo?: boolean;
  showExportHtmlButton?: boolean;
  themeMode?: ThemeMode;
  builderTheme?: 'light-breeze' | 'light-paper' | 'dark-slate' | 'dark-cosmos';
  emailBackgroundStyle?: TemplateBackgroundStyle;
  emailBackgroundColor?: string;
  chromeColor?: string;
  canvasColor?: string;
};

const normalizeUiContext = (
  value: unknown,
): UiContext => {
  if (!value || typeof value !== 'object') return {};

  const maybe = value as {
    context?: {
      showLogo?: unknown;
      hideLogo?: unknown;
      showExportHtmlButton?: unknown;
      themeMode?: unknown;
      builderTheme?: unknown;
      emailBackgroundStyle?: unknown;
      emailBackgroundColor?: unknown;
      chromeColor?: unknown;
      canvasColor?: unknown;
    };
    showLogo?: unknown;
    hideLogo?: unknown;
    showExportHtmlButton?: unknown;
    themeMode?: unknown;
    builderTheme?: unknown;
    emailBackgroundStyle?: unknown;
    emailBackgroundColor?: unknown;
    chromeColor?: unknown;
    canvasColor?: unknown;
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
  const builderTheme = asOptionalBuilderTheme(
    embeddedContext.builderTheme !== undefined ? embeddedContext.builderTheme : maybe.builderTheme,
  );
  const emailBackgroundStyle = asOptionalTemplateBackgroundStyle(
    embeddedContext.emailBackgroundStyle !== undefined
      ? embeddedContext.emailBackgroundStyle
      : maybe.emailBackgroundStyle,
  );
  const emailBackgroundColor = asOptionalHexColor(
    embeddedContext.emailBackgroundColor !== undefined
      ? embeddedContext.emailBackgroundColor
      : maybe.emailBackgroundColor,
  );
  const chromeColor = asOptionalHexColor(
    embeddedContext.chromeColor !== undefined ? embeddedContext.chromeColor : maybe.chromeColor,
  );
  const canvasColor = asOptionalHexColor(
    embeddedContext.canvasColor !== undefined ? embeddedContext.canvasColor : maybe.canvasColor,
  );

  const output: UiContext = {};
  if (resolvedShowLogo !== undefined) output.showLogo = resolvedShowLogo;
  if (showExportHtmlButton !== undefined) output.showExportHtmlButton = showExportHtmlButton;
  if (themeMode !== undefined) output.themeMode = themeMode;
  if (builderTheme !== undefined) {
    output.builderTheme = builderTheme;
  } else if (themeMode !== undefined) {
    output.builderTheme = builderThemeFromThemeMode(themeMode);
  }
  if (emailBackgroundStyle !== undefined) output.emailBackgroundStyle = emailBackgroundStyle;
  if (emailBackgroundColor !== undefined) output.emailBackgroundColor = emailBackgroundColor;
  if (chromeColor !== undefined) output.chromeColor = chromeColor;
  if (canvasColor !== undefined) output.canvasColor = canvasColor;
  return output;
};

const normalizeUiContextFromSession = (
  widgetContext: unknown,
): UiContext => {
  if (!widgetContext || typeof widgetContext !== 'object') return {};

  const maybe = widgetContext as {
    show_logo?: unknown;
    show_export_html_button?: unknown;
    theme_mode?: unknown;
    builder_theme?: unknown;
    email_background_style?: unknown;
    email_background_color?: unknown;
    chrome_color?: unknown;
    canvas_color?: unknown;
  };

  const output: UiContext = {};
  const showLogo = asOptionalBoolean(maybe.show_logo);
  const showExportHtmlButton = asOptionalBoolean(maybe.show_export_html_button);
  const themeMode = asOptionalThemeMode(maybe.theme_mode);
  const builderTheme = asOptionalBuilderTheme(maybe.builder_theme);
  const emailBackgroundStyle = asOptionalTemplateBackgroundStyle(maybe.email_background_style);
  const emailBackgroundColor = asOptionalHexColor(maybe.email_background_color);
  const chromeColor = asOptionalHexColor(maybe.chrome_color);
  const canvasColor = asOptionalHexColor(maybe.canvas_color);

  if (showLogo !== undefined) output.showLogo = showLogo;
  if (showExportHtmlButton !== undefined) output.showExportHtmlButton = showExportHtmlButton;
  if (themeMode !== undefined) output.themeMode = themeMode;
  if (builderTheme !== undefined) {
    output.builderTheme = builderTheme;
  } else if (themeMode !== undefined) {
    output.builderTheme = builderThemeFromThemeMode(themeMode);
  }
  if (emailBackgroundStyle !== undefined) output.emailBackgroundStyle = emailBackgroundStyle;
  if (emailBackgroundColor !== undefined) output.emailBackgroundColor = emailBackgroundColor;
  if (chromeColor !== undefined) output.chromeColor = chromeColor;
  if (canvasColor !== undefined) output.canvasColor = canvasColor;
  return output;
};

const normalizeUiContextFromSearch = (
  params: URLSearchParams,
): UiContext => {
  const showLogo = asOptionalBooleanFromSearchParam(params.get('showLogo'));
  const legacyHideLogo = asOptionalBooleanFromSearchParam(params.get('hideLogo'));
  const showExportHtmlButton = asOptionalBooleanFromSearchParam(params.get('showExportHtmlButton'));
  const themeMode = asOptionalThemeMode(params.get('themeMode'));
  const builderTheme = asOptionalBuilderTheme(params.get('builderTheme'));
  const emailBackgroundStyle = asOptionalTemplateBackgroundStyle(params.get('emailBackgroundStyle'));
  const emailBackgroundColor = asOptionalHexColor(params.get('emailBackgroundColor'));
  const chromeColor = asOptionalHexColor(params.get('chromeColor'));
  const canvasColor = asOptionalHexColor(params.get('canvasColor'));

  const output: UiContext = {};
  if (showLogo !== undefined) output.showLogo = showLogo;
  if (showLogo === undefined && legacyHideLogo !== undefined) output.showLogo = !legacyHideLogo;
  if (showExportHtmlButton !== undefined) output.showExportHtmlButton = showExportHtmlButton;
  if (themeMode !== undefined) output.themeMode = themeMode;
  if (builderTheme !== undefined) {
    output.builderTheme = builderTheme;
  } else if (themeMode !== undefined) {
    output.builderTheme = builderThemeFromThemeMode(themeMode);
  }
  if (emailBackgroundStyle !== undefined) output.emailBackgroundStyle = emailBackgroundStyle;
  if (emailBackgroundColor !== undefined) output.emailBackgroundColor = emailBackgroundColor;
  if (chromeColor !== undefined) output.chromeColor = chromeColor;
  if (canvasColor !== undefined) output.canvasColor = canvasColor;
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
  const applyOrganizationBackground = useEditorStore((s) => s.applyOrganizationBackground);
  const showLogo = useConfigStore((s) => s.showLogo);
  const showExportHtmlButton = useConfigStore((s) => s.showExportHtmlButton);
  const builderTheme = useConfigStore((s) => s.builderTheme);
  const setConfig = useConfigStore((s) => s.setConfig);
  const hostContextAppliedRef = useRef(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const activeThemePreset = getBuilderThemePreset(builderTheme);

  useAutoSave();

  useEffect(() => {
    applyOrganizationBackground(
      activeThemePreset.canvasBackgroundStyle,
      activeThemePreset.canvasBackgroundColor,
    );
  }, [activeThemePreset, applyOrganizationBackground]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const contextFromQuery = normalizeUiContextFromSearch(params);
    const shouldApplyQueryContext =
      asOptionalBooleanFromSearchParam(params.get('contextOverride')) === true || window.parent !== window;
    const sessionTokenFromQuery = params.get('sessionToken');
    const apiKeyFromQuery = params.get('apiKey');
    let resolvedApiKey: string | null = null;
    let hasSessionToken = false;

    if (sessionTokenFromQuery) {
      localStorage.setItem('mailcraft_session_token', sessionTokenFromQuery);
      setConfig({ sessionToken: sessionTokenFromQuery });
      hasSessionToken = true;
    } else {
      const sessionTokenFromStorage = localStorage.getItem('mailcraft_session_token');
      if (sessionTokenFromStorage) {
        setConfig({ sessionToken: sessionTokenFromStorage });
        hasSessionToken = true;
      }
    }

    if (apiKeyFromQuery) {
      localStorage.setItem('mailcraft_api_key', apiKeyFromQuery);
      resolvedApiKey = apiKeyFromQuery;
      setConfig({ apiKey: apiKeyFromQuery });
    } else if (!hasSessionToken) {
      const apiKeyFromStorage = localStorage.getItem('mailcraft_api_key');
      if (apiKeyFromStorage) {
        resolvedApiKey = apiKeyFromStorage;
        setConfig({ apiKey: apiKeyFromStorage });
      }
    }

    const queryColorOverrides: Partial<{ chromeColor: string; canvasColor: string }> = {};
    if (contextFromQuery.chromeColor) queryColorOverrides.chromeColor = contextFromQuery.chromeColor;
    if (contextFromQuery.canvasColor) queryColorOverrides.canvasColor = contextFromQuery.canvasColor;

    const syncSessionConfig = async (apiKey: string) => {
      try {
        const session = await api.createSession(window.location.origin);
        const sessionUiContext = normalizeUiContextFromSession(session.config.widget_context);
        const sessionThemeContext = {
          builderTheme: sessionUiContext.builderTheme,
        };
        const sessionEmailBackgroundContext = {
          emailBackgroundStyle: sessionUiContext.emailBackgroundStyle,
          emailBackgroundColor: sessionUiContext.emailBackgroundColor,
        };
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
          ...sessionThemeContext,
          ...sessionEmailBackgroundContext,
          ...queryColorOverrides,
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
    } else if (hasSessionToken) {
      void syncSessionConfig('');
    } else if (shouldApplyQueryContext && Object.keys(contextFromQuery).length > 0) {
      setConfig(contextFromQuery);
    }

    const refreshSessionIfNeeded = () => {
      if (!resolvedApiKey && !hasSessionToken) return;
      void syncSessionConfig(resolvedApiKey || '');
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
        const nextConfig: UiContext & {
          apiKey?: string;
          variables?: Variable[];
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

  const handleSave = async () => {
    const currentTemplate = useEditorStore.getState().template;
    localStorage.setItem('mailcraft_draft', JSON.stringify(currentTemplate));
    emitSaveEvent(currentTemplate);

    if (!savedTemplateId) {
      setShowSaveModal(true);
      return;
    }

    setIsSaving(true);
    try {
      await api.updateTemplate(savedTemplateId, { json_data: currentTemplate });
      sendTemplateSavedEvent(savedTemplateId, '');
      useEditorStore.getState().markClean();
    } catch {
      // localStorage save already succeeded
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNew = async (name: string, category: string) => {
    const currentTemplate = useEditorStore.getState().template;
    setIsSaving(true);
    try {
      const result = await api.saveTemplate({
        name,
        json_data: currentTemplate,
        category: category || undefined,
      });
      setSavedTemplateId(result.id);
      sendTemplateSavedEvent(result.id, name);
      useEditorStore.getState().markClean();
      setShowSaveModal(false);
    } catch {
      // best-effort
    } finally {
      setIsSaving(false);
    }
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

  const chromeColor = useConfigStore((s) => s.chromeColor);
  const canvasColor = useConfigStore((s) => s.canvasColor);
  const isDarkChrome = activeThemePreset.chromeMode === 'dark';
  const canApplySelectedMedia = Boolean(selectedBlock && selectedBlock.type === 'image');

  const customColorOverrides: Record<string, string> = {};
  if (chromeColor) {
    customColorOverrides['--chrome-surface'] = chromeColor;
    customColorOverrides['--chrome-surface-elevated'] = chromeColor;
  }
  if (canvasColor) {
    customColorOverrides['--canvas-bg'] = canvasColor;
  }

  return (
    <div className={`app-shell ${isDarkChrome ? 'theme-dark' : 'theme-light'} ${activeThemePreset.shellClassName}`} style={customColorOverrides as React.CSSProperties}>
      <div className="top-toolbar">
        {showLogo && (
          <div className="brand">
            <div className="brand-title">MailCraft</div>
            <div className="brand-subtitle">Email Builder</div>
          </div>
        )}
        <div className="toolbar-actions">
          <Button variant="ghost" size="sm" onClick={() => setShowGallery(true)}>
            <LayoutGrid size={16} />
            Templates
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowMedia(true)}>
            <Image size={16} />
            Media
          </Button>
          <div className="toolbar-separator" />
          <Button variant="ghost" size="sm" onClick={() => setShowPreview(true)}>
            <Eye size={16} />
            Preview
          </Button>
          <div className="toolbar-separator" />
          <Button variant="ghost" size="sm" className="toolbar-action-btn" onClick={() => void handleSave()} disabled={isSaving}>
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          {showExportHtmlButton && (
            <Button variant="ghost" size="sm" className="toolbar-action-btn" onClick={() => void handleExport()} disabled={isExporting}>
              <Download size={16} />
              {isExporting ? 'Exporting...' : 'Export'}
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
      {showGallery && (
        <TemplateGallery
          onClose={() => setShowGallery(false)}
          onTemplateLoaded={(id) => setSavedTemplateId(id)}
        />
      )}
      {showMedia && (
        <MediaLibraryModal
          onClose={() => setShowMedia(false)}
          onSelectUrl={canApplySelectedMedia ? handleToolbarMediaSelect : undefined}
        />
      )}
      {showSaveModal && (
        <SaveTemplateModal
          onSave={(name, category) => void handleSaveNew(name, category)}
          onClose={() => setShowSaveModal(false)}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

export default App;
