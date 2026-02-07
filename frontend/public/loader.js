(function () {
  'use strict';

  var EDITOR_URL = 'https://app.mailcraft.io';

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

      // Create iframe
      var iframe = document.createElement('iframe');
      iframe.src = EDITOR_URL + '/editor?apiKey=' + encodeURIComponent(config.apiKey);
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
        if (event.origin !== EDITOR_URL) return;
        var data = event.data;
        if (!data || data.source !== 'mailcraft') return;

        switch (data.type) {
          case 'MAILCRAFT_READY':
            self._ready = true;
            // Send config to iframe
            iframe.contentWindow.postMessage(
              {
                source: 'mailcraft-host',
                type: 'MAILCRAFT_INIT',
                payload: {
                  variables: config.variables || [],
                  templateJson: config.templateJson || null,
                },
              },
              EDITOR_URL
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
        EDITOR_URL
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
          if (event.origin !== EDITOR_URL) return;
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
          EDITOR_URL
        );
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
