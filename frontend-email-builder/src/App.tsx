import { useEffect, useRef, useState } from 'react';
import './App.css';
import { EditorDndContext } from './components/Editor/EditorDndContext';
import { Canvas } from './components/Editor/Canvas';
import { BlockPalette } from './components/Panels/BlockPalette';
import { StylePanel } from './components/Panels/StylePanel';
import { PreviewPane, DeviceToggle, type PreviewDevice } from './components/Preview/PreviewPane';
import { TemplateGallery } from './components/Gallery/TemplateGallery';
import { SaveTemplateModal } from './components/Gallery/SaveTemplateModal';
import { MediaLibraryModal } from './components/Media/MediaLibraryModal';
import { VariableInserter } from './components/Panels/VariableInserter';
import { AiStart } from './components/Ai/AiStart';
import { AskBar } from './components/Ai/AskBar';
import { AiBuilding, AiSkeleton } from './components/Ai/AiBuilding';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { useConfigStore } from './store/configStore';
import { useEditorStore } from './store/editorStore';
import { exportToHtml } from './lib/htmlExporter';
import { applyImageUrlToBlock } from './lib/media';
import { withFreshIds } from './lib/templates';
import { api } from './lib/api';
import { useAutoSave, loadDraft } from './hooks/useAutoSave';
import { useAiJob } from './hooks/useAiJob';
import { listenToParent, sendErrorEvent, sendReadyEvent, sendSaveEvent, sendTemplateSavedEvent } from './lib/postMessage';
import type { EmailTemplate, TemplateBackgroundStyle } from './types/blocks';
import type { ThemeMode, Variable } from './types/editor';
import { getBuilderThemePreset, resolveBuilderTheme } from './lib/builderTheme';
import { LayoutGrid, Image, Save, SaveAll, Download, Sparkles } from 'lucide-react';

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

/**
 * Parse variables from URL query param.
 * Supports two formats:
 *   ?variables=first_name,last_name,email  (simple: keys only, labels auto-generated)
 *   ?variables=[{"key":"first_name","label":"First Name"}]  (JSON: full control)
 */
const parseVariablesFromParam = (param: string | null): Variable[] => {
  if (!param) return [];
  const trimmed = param.trim();

  // JSON array format
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      return normalizeVariables(parsed);
    } catch {
      return [];
    }
  }

  // Simple comma-separated keys
  return trimmed
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
    .map((key) => ({
      key,
      label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      type: 'text' as const,
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
  defaultPalette?: string;
  customPalette?: Record<string, string>;
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
    default_palette?: unknown;
    custom_palette?: unknown;
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
  const defaultPalette = typeof maybe.default_palette === 'string' ? maybe.default_palette : undefined;
  const customPalette = (maybe.custom_palette && typeof maybe.custom_palette === 'object' && !Array.isArray(maybe.custom_palette))
    ? maybe.custom_palette as Record<string, string>
    : undefined;

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
  if (defaultPalette !== undefined) output.defaultPalette = defaultPalette;
  if (customPalette !== undefined) output.customPalette = customPalette;
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

const EDITABLE_TARGET_SELECTOR = 'input, textarea, select, button, [contenteditable="true"], .ProseMirror';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return Boolean(target.closest(EDITABLE_TARGET_SELECTOR));
}

function isCanvasNavigationTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return target === document;
  }
  if (target === document.body) return true;
  return Boolean(target.closest('.canvas-area'));
}

function focusBlockWrapper(blockId: string) {
  const blockEl = document.querySelector<HTMLElement>(`.block-wrapper[data-block-id="${blockId}"]`);
  blockEl?.focus();
}

/** What to tell the customer about an AI job's warnings (image misses are many lines; one note covers them). */
function aiNoteFor(warnings: string[]): string | null {
  const notes = new Set(warnings.map((w) => (
    w.startsWith('image:') ? 'Some photos could not be found, so placeholders were used.' : w
  )));
  return notes.size ? [...notes].join(' ') : null;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function App() {
  const isDirty = useEditorStore((s) => s.isDirty);
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const selectedBlock = useEditorStore((s) => s.getSelectedBlock());
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const getSelectableBlockIds = useEditorStore((s) => s.getSelectableBlockIds);
  const canUndo = useEditorStore((s) => s.historyPast.length > 0);
  const canRedo = useEditorStore((s) => s.historyFuture.length > 0);
  const applyOrganizationBackground = useEditorStore((s) => s.applyOrganizationBackground);
  const showLogo = useConfigStore((s) => s.showLogo);
  const showExportHtmlButton = useConfigStore((s) => s.showExportHtmlButton);
  const builderTheme = useConfigStore((s) => s.builderTheme);
  const setConfig = useConfigStore((s) => s.setConfig);
  const hostContextAppliedRef = useRef(false);
  const [view, setView] = useState<'editor' | 'split' | 'preview'>('editor');
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [showGallery, setShowGallery] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null);
  const savedTemplateIdRef = useRef<string | null>(null);
  useEffect(() => { savedTemplateIdRef.current = savedTemplateId; }, [savedTemplateId]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveModalMode, setSaveModalMode] = useState<'save' | 'saveAs'>('save');
  const activeThemePreset = getBuilderThemePreset(builderTheme);

  const previewTemplate = useEditorStore((s) => s.previewTemplate);
  const commitTemplate = useEditorStore((s) => s.commitTemplate);
  const bodyIsEmpty = useEditorStore((s) => s.template.body.blocks.length === 0);
  const aiEnabled = useConfigStore((s) => s.aiEnabled);
  const aiGenerationsLeft = useConfigStore((s) => s.aiGenerationsLeft);
  const ai = useAiJob();
  const aiBusyRef = useRef(false);
  useEffect(() => { aiBusyRef.current = ai.busy; }, [ai.busy]);
  const [aiStartOpen, setAiStartOpen] = useState(false); // "New with AI" over an email that has blocks
  const [startBlank, setStartBlank] = useState(false);
  const [brief, setBrief] = useState('');
  const [briefCategory, setBriefCategory] = useState('');
  const [aiNote, setAiNote] = useState<string | null>(null);
  const generating = ai.kind === 'generate';
  const showAiStart = aiEnabled === true && !generating && (aiStartOpen || (bodyIsEmpty && !startBlank));

  useAutoSave(ai.busy);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (aiBusyRef.current) return; // the canvas shows a live AI preview; nothing may change it
      const hasPrimaryModifier = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      const editableTarget = isEditableTarget(event.target);

      if (hasPrimaryModifier && !event.altKey && key === 'z') {
        if (editableTarget) return;
        event.preventDefault();
        if (event.shiftKey) {
          if (canRedo) redo();
          return;
        }
        if (canUndo) undo();
        return;
      }

      if (hasPrimaryModifier && !event.altKey && key === 'y') {
        if (editableTarget) return;
        event.preventDefault();
        if (canRedo) redo();
        return;
      }

      if (event.key !== 'Tab' || hasPrimaryModifier || event.altKey) return;
      if (editableTarget) return;
      if (!isCanvasNavigationTarget(event.target)) return;

      const orderedBlockIds = getSelectableBlockIds();
      if (orderedBlockIds.length === 0) return;

      event.preventDefault();

      const currentIndex = selectedBlockId ? orderedBlockIds.indexOf(selectedBlockId) : -1;
      const nextIndex = event.shiftKey
        ? (currentIndex <= 0 ? orderedBlockIds.length - 1 : currentIndex - 1)
        : (currentIndex === -1 || currentIndex >= orderedBlockIds.length - 1 ? 0 : currentIndex + 1);
      const nextBlockId = orderedBlockIds[nextIndex];
      if (!nextBlockId) return;

      selectBlock(nextBlockId);
      window.requestAnimationFrame(() => focusBlockWrapper(nextBlockId));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canRedo, canUndo, getSelectableBlockIds, redo, selectBlock, selectedBlockId, undo]);

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

    // Parse variables from URL param — these override session/org variables
    const variablesFromQuery = parseVariablesFromParam(params.get('variables'));
    if (variablesFromQuery.length > 0) {
      setConfig({ variables: variablesFromQuery });
    }

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
          // URL variables take priority over session/org variables
          variables: variablesFromQuery.length > 0
            ? variablesFromQuery
            : normalizeVariables(session.config.variables),
          maxUploadSize: session.config.max_upload_size_bytes,
          maxMediaFilesPerUpload: session.config.max_media_files_per_upload,
          storageUsed: session.config.storage_used_bytes,
          storageLimit: session.config.storage_limit_bytes,
          aiEnabled: Boolean(session.config.ai?.enabled),
          aiGenerationsLeft: session.config.ai?.generations_left ?? null,
          ...(hostContextAppliedRef.current ? {} : sessionUiContext),
          ...sessionThemeContext,
          ...sessionEmailBackgroundContext,
          ...queryColorOverrides,
        });
        if (shouldApplyQueryContext && Object.keys(contextFromQuery).length > 0) {
          setConfig(contextFromQuery);
        }
      } catch {
        // A failed refresh keeps what an earlier session said; a first failure means no AI.
        if (useConfigStore.getState().aiEnabled === undefined) setConfig({ aiEnabled: false });
        if (shouldApplyQueryContext && Object.keys(contextFromQuery).length > 0) {
          setConfig(contextFromQuery);
        }
      }
    };

    if (resolvedApiKey) {
      void syncSessionConfig(resolvedApiKey);
    } else if (hasSessionToken) {
      void syncSessionConfig('');
    } else {
      setConfig({ aiEnabled: false });
      if (shouldApplyQueryContext && Object.keys(contextFromQuery).length > 0) {
        setConfig(contextFromQuery);
      }
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
      onRequestSave: () => {
        const currentTemplate = useEditorStore.getState().template;
        localStorage.setItem('mailcraft_draft', JSON.stringify(currentTemplate));
        emitSaveEvent(currentTemplate);

        const existingId = savedTemplateIdRef.current;
        if (existingId) {
          // Update existing template
          void api.updateTemplate(existingId, { json_data: currentTemplate }).then(() => {
            sendTemplateSavedEvent(existingId, '');
            useEditorStore.getState().markClean();
          }).catch(() => {});
        } else {
          // Auto-create a new template so the parent gets an ID
          void api.saveTemplate({
            name: 'Untitled Email',
            json_data: currentTemplate,
          }).then((result) => {
            savedTemplateIdRef.current = result.id;
            setSavedTemplateId(result.id);
            sendTemplateSavedEvent(result.id, 'Untitled Email');
            useEditorStore.getState().markClean();
          }).catch(() => {});
        }
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

  const historyDepth = useEditorStore((s) => s.historyPast.length);
  const [aiUndoDepth, setAiUndoDepth] = useState<number | null>(null);
  const aiActivity = ai.job?.activity
    || (ai.job?.status === 'queued' ? 'Waiting for a free AI worker…' : generating ? 'Starting…' : 'Reading your request');

  // The email builds on the canvas as the AI writes it; it lands as one undoable step.
  const handleGenerate = () => {
    const before = useEditorStore.getState().template;
    setAiNote(null);
    setAiUndoDepth(null);
    void ai.run('generate', () => api.generateTemplate(brief.trim(), briefCategory), {
      onPartial: previewTemplate,
      onDone: async (job) => {
        const detail = job.template_id ? await api.getTemplate(job.template_id) : null;
        if (!detail || !isEmailTemplate(detail.json_data)) throw new Error('The AI finished without an email. Try again.');
        commitTemplate(before, withFreshIds(detail.json_data));
        useEditorStore.getState().markClean(); // the generation already saved it as a template
        setSavedTemplateId(job.template_id);
        setAiStartOpen(false);
        setBrief('');
        const left = useConfigStore.getState().aiGenerationsLeft;
        if (left !== null) setConfig({ aiGenerationsLeft: Math.max(left - 1, 0) });
        setAiNote(aiNoteFor(job.warnings));
      },
      onFail: () => previewTemplate(before),
    });
  };

  // A change to the whole email, or to the selected block.
  const handleAsk = (instruction: string) => {
    const { template: before, selectedBlockId: scope } = useEditorStore.getState();
    setAiNote(null);
    setAiUndoDepth(null);
    void ai.run('edit', () => api.editTemplate(before, instruction, scope ?? ''), {
      onPartial: previewTemplate,
      onDone: (job) => {
        if (!job.result) throw new Error('The AI finished without a change. Try again.');
        commitTemplate(before, job.result);
        setAiUndoDepth(useEditorStore.getState().historyPast.length);
        setAiNote(aiNoteFor(job.warnings));
      },
      onFail: () => previewTemplate(before),
    });
  };

  const handleSave = async () => {
    const currentTemplate = useEditorStore.getState().template;
    localStorage.setItem('mailcraft_draft', JSON.stringify(currentTemplate));
    emitSaveEvent(currentTemplate);

    if (!savedTemplateId) {
      // No existing template — show the save modal to create one
      setSaveModalMode('save');
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

  const handleSaveAs = () => {
    setSaveModalMode('saveAs');
    setShowSaveModal(true);
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

  const showAskBar = aiEnabled === true && !generating && !bodyIsEmpty;

  return (
    <div
      className={`app-shell ${isDarkChrome ? 'theme-dark' : 'theme-light'} ${activeThemePreset.shellClassName}`}
      style={customColorOverrides as React.CSSProperties}
    >
      {/* While the AI works the canvas shows its live preview: nothing else can be used, but its
          status lines stay outside `inert` so screen readers still hear them. */}
      <div className="top-toolbar" inert={ai.busy}>
        {showLogo && (
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="7" fill="currentColor" />
                <rect x="7" y="9.5" width="18" height="13" rx="2" stroke="var(--chrome-surface)" strokeWidth="2.4" />
                <path d="M8 10.5L16 16.5L24 10.5" stroke="var(--chrome-surface)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="brand-text">
              <div className="brand-title">MailCraft</div>
              <div className="brand-subtitle">Email Studio</div>
            </div>
          </div>
        )}
        <div className="toolbar-actions">
          {aiEnabled && !showAiStart && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                ai.clearError();
                setAiStartOpen(true);
              }}
            >
              <Sparkles size={16} />
              New with AI
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setShowGallery(true)}>
            <LayoutGrid size={16} />
            Templates
          </Button>
          <VariableInserter />
          <Button variant="ghost" size="sm" onClick={() => setShowMedia(true)}>
            <Image size={16} />
            Media
          </Button>
          <div className="toolbar-separator" />
          <Button variant="ghost" size="sm" className="toolbar-action-btn" onClick={() => void handleSave()} disabled={isSaving}>
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button variant="ghost" size="sm" className="toolbar-action-btn" onClick={handleSaveAs} disabled={isSaving}>
            <SaveAll size={16} />
            Save As
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
          {showAiStart ? (
            <AiStart
              brief={brief}
              category={briefCategory}
              error={ai.error?.kind === 'generate' ? ai.error.message : null}
              generationsLeft={aiGenerationsLeft}
              onBack={bodyIsEmpty ? undefined : () => setAiStartOpen(false)}
              onBriefChange={setBrief}
              onCategoryChange={setBriefCategory}
              onSubmit={handleGenerate}
              onBrowseTemplates={() => {
                setAiStartOpen(false);
                setShowGallery(true);
              }}
              onStartBlank={bodyIsEmpty ? () => {
                ai.clearError();
                setStartBlank(true);
              } : undefined}
            />
          ) : aiEnabled === undefined && bodyIsEmpty ? (
            // The session has not said yet whether the editor opens on the AI start screen.
            <div className="canvas-area" />
          ) : (
            <>
              {!generating && <div className="ai-inert-group" inert={ai.busy}><BlockPalette /></div>}
              <div className={`canvas-column${showAskBar ? ' has-askbar' : ''}`}>
                {!generating && (
                  <div className="view-bar" inert={ai.busy}>
                  <div className="view-tabs" role="tablist" aria-label="View">
                    {(['editor', 'split', 'preview'] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        role="tab"
                        aria-selected={view === v}
                        className={`view-tab${view === v ? ' is-active' : ''}`}
                        onClick={() => setView(v)}
                      >
                        {{ editor: 'Editor', split: 'Editor + Preview', preview: 'Preview' }[v]}
                      </button>
                    ))}
                  </div>
                  {view !== 'editor' && <div className="view-bar-end"><DeviceToggle value={device} onChange={setDevice} /></div>}
                  </div>
                )}
                <div className={`canvas-panes${view === 'split' && !generating ? ' is-split' : ''}`}>
                  {(view !== 'preview' || generating) && (
                    <div className="ai-inert-group" inert={ai.busy}>
                      <Canvas empty={generating ? <AiSkeleton /> : undefined} />
                    </div>
                  )}
                  {view !== 'editor' && !generating && <PreviewPane device={device} lockScroll={view === 'split'} />}
                </div>
                {generating && <AiBuilding activity={aiActivity} />}
                {showAskBar && (
                  <AskBar
                    busy={ai.kind === 'edit'}
                    activity={aiActivity}
                    scopeLabel={selectedBlock ? ({ columns: 'Section', html: 'HTML' }[selectedBlock.type as string]
                      ?? capitalize(selectedBlock.type)) : null}
                    note={ai.error?.kind === 'edit' ? ai.error.message : aiNote}
                    noteIsError={ai.error?.kind === 'edit'}
                    canUndo={aiUndoDepth !== null && historyDepth === aiUndoDepth}
                    onAsk={handleAsk}
                    onClearScope={() => selectBlock(null)}
                    onUndo={undo}
                    onDismissNote={() => {
                      ai.clearError();
                      setAiNote(null);
                    }}
                  />
                )}
              </div>
              {!generating && <div className="ai-inert-group" inert={ai.busy}><StylePanel /></div>}
            </>
          )}
        </div>
      </EditorDndContext>
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
          title={saveModalMode === 'saveAs' ? 'Save As New Template' : 'Save Template'}
          onSave={(name, category) => void handleSaveNew(name, category)}
          onClose={() => setShowSaveModal(false)}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

export default App;
