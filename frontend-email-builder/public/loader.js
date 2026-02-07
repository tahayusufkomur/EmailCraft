(function () {
  'use strict';

  var EDITOR_BASE_URL = 'https://app.mailcraft.io/builder';
  var API_BASE_URL = 'https://api.mailcraft.io';
  var EDITOR_ORIGIN = new URL(EDITOR_BASE_URL).origin;

  var MailCraft = {
    _iframe: null,
    _config: null,
    _ready: false,
    _messageHandler: null,

    /**
     * Initialize the MailCraft editor.
     * @param {Object} config
     * @param {string} config.apiKey - API key (mc_live_* or mc_test_*)
     * @param {string|HTMLElement} config.container - CSS selector or DOM element
     * @param {Array} [config.variables] - Variables available in the editor
     * @param {Object} [config.templateJson] - Pre-load a template
     * @param {Object} [config.context] - Widget UI context
     * @param {boolean} [config.context.showLogo=true] - Show MailCraft logo/title in toolbar
     * @param {boolean} [config.context.showExportHtmlButton=true] - Show Export HTML button in toolbar
     * @param {'light'|'dark'|'system'} [config.context.themeMode='system'] - Theme mode for editor chrome
     * @param {boolean} [config.showLogo] - Deprecated alias for context.showLogo
     * @param {boolean} [config.hideLogo] - Deprecated alias for !context.showLogo
     * @param {boolean} [config.showExportHtmlButton] - Deprecated alias for context.showExportHtmlButton
     * @param {'light'|'dark'|'system'} [config.themeMode] - Deprecated alias for context.themeMode
     * @param {Function} [config.onSave] - Called when user saves
     * @param {Function} [config.onAutoSave] - Called on auto-save
     * @param {Function} [config.onError] - Called on errors
     * @param {Function} [config.onReady] - Called when editor is loaded
     */
    init: function (config) {
      if (!config || !config.apiKey) {
        console.error('[MailCraft] apiKey is required');
        return;
      }

      var container =
        typeof config.container === 'string'
          ? document.querySelector(config.container)
          : config.container;

      if (!container) {
        console.error('[MailCraft] Container element not found:', config.container);
        return;
      }

      this._config = config;
      var context = {};
      if (config.context && typeof config.context === 'object') {
        if (typeof config.context.showLogo === 'boolean') {
          context.showLogo = config.context.showLogo;
        }
        if (
          typeof config.context.hideLogo === 'boolean' &&
          typeof context.showLogo === 'undefined'
        ) {
          context.showLogo = !config.context.hideLogo;
        }
        if (typeof config.context.showExportHtmlButton === 'boolean') {
          context.showExportHtmlButton = config.context.showExportHtmlButton;
        }
        if (
          config.context.themeMode === 'light' ||
          config.context.themeMode === 'dark' ||
          config.context.themeMode === 'system'
        ) {
          context.themeMode = config.context.themeMode;
        }
      }
      if (typeof config.showLogo === 'boolean' && typeof context.showLogo === 'undefined') {
        context.showLogo = config.showLogo;
      }
      if (typeof config.hideLogo === 'boolean' && typeof context.showLogo === 'undefined') {
        context.showLogo = !config.hideLogo;
      }
      if (
        typeof config.showExportHtmlButton === 'boolean' &&
        typeof context.showExportHtmlButton === 'undefined'
      ) {
        context.showExportHtmlButton = config.showExportHtmlButton;
      }
      if (
        (config.themeMode === 'light' ||
          config.themeMode === 'dark' ||
          config.themeMode === 'system') &&
        typeof context.themeMode === 'undefined'
      ) {
        context.themeMode = config.themeMode;
      }

      // Create iframe
      var iframe = document.createElement('iframe');
      iframe.src = EDITOR_BASE_URL + '/?apiKey=' + encodeURIComponent(config.apiKey);
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.setAttribute(
        'sandbox',
        'allow-scripts allow-same-origin allow-forms allow-popups'
      );
      iframe.setAttribute('referrerpolicy', 'strict-origin');
      iframe.setAttribute('loading', 'lazy');

      container.innerHTML = '';
      container.appendChild(iframe);
      this._iframe = iframe;

      // Listen for messages from iframe
      var self = this;
      this._messageHandler = function (event) {
        if (event.origin !== EDITOR_ORIGIN) return;
        var data = event.data;
        if (!data || data.source !== 'mailcraft') return;

        switch (data.type) {
          case 'MAILCRAFT_READY':
            self._ready = true;
            var initPayload = {
              templateJson: config.templateJson || null,
              context: context,
            };
            if (Array.isArray(config.variables)) {
              initPayload.variables = config.variables;
            }
            // Send config to iframe
            iframe.contentWindow.postMessage(
              {
                source: 'mailcraft-host',
                type: 'MAILCRAFT_INIT',
                payload: initPayload,
              },
              EDITOR_ORIGIN
            );
            if (config.onReady) config.onReady();
            break;

          case 'MAILCRAFT_SAVE':
            if (config.onSave) config.onSave(data.payload);
            break;

          case 'MAILCRAFT_AUTO_SAVE':
            if (config.onAutoSave) config.onAutoSave(data.payload);
            break;

          case 'MAILCRAFT_ERROR':
            if (config.onError) config.onError(data.payload);
            break;
        }
      };
      window.addEventListener('message', this._messageHandler);
    },

    /**
     * Load a template into the editor.
     * @param {Object} templateJson
     */
    loadTemplate: function (templateJson) {
      if (!this._iframe || !this._ready) {
        console.warn('[MailCraft] Editor not ready yet');
        return;
      }
      this._iframe.contentWindow.postMessage(
        {
          source: 'mailcraft-host',
          type: 'MAILCRAFT_LOAD_TEMPLATE',
          payload: { json: templateJson },
        },
        EDITOR_ORIGIN
      );
    },

    /**
     * Export the current template.
     * @returns {Promise<{html: string, json: object}>}
     */
    export: function () {
      var self = this;
      return new Promise(function (resolve) {
        var handler = function (event) {
          if (event.origin !== EDITOR_ORIGIN) return;
          if (
            event.data &&
            event.data.source === 'mailcraft' &&
            event.data.type === 'MAILCRAFT_SAVE'
          ) {
            window.removeEventListener('message', handler);
            resolve(event.data.payload);
          }
        };
        window.addEventListener('message', handler);

        self._iframe.contentWindow.postMessage(
          {
            source: 'mailcraft-host',
            type: 'MAILCRAFT_EXPORT',
            payload: {},
          },
          EDITOR_ORIGIN
        );
      });
    },

    /**
     * Render a template with variables via API.
     * @param {Object} options
     * @param {string} [options.templateId] - Template ID to render
     * @param {Object} [options.jsonData] - Template JSON to render inline
     * @param {Object} options.variables - Key-value variable substitutions
     * @returns {Promise<{html: string, warnings: string[], variables_used: string[]}>}
     */
    render: function (options) {
      if (!this._config || !this._config.apiKey) {
        return Promise.reject(new Error('[MailCraft] Not initialized. Call init() first.'));
      }
      var body = { variables: options.variables || {} };
      if (options.templateId) body.template_id = options.templateId;
      if (options.jsonData) body.json_data = options.jsonData;

      return fetch(API_BASE_URL + '/api/v1/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this._config.apiKey,
        },
        body: JSON.stringify(body),
      }).then(function (res) {
        if (!res.ok) {
          return res.json().then(function (err) { throw err; });
        }
        return res.json();
      });
    },

    /**
     * Destroy the editor and clean up.
     */
    destroy: function () {
      if (this._messageHandler) {
        window.removeEventListener('message', this._messageHandler);
        this._messageHandler = null;
      }
      if (this._iframe) {
        this._iframe.remove();
        this._iframe = null;
      }
      this._config = null;
      this._ready = false;
    },
  };

  // Expose globally
  window.MailCraft = MailCraft;
})();
