import type { EmailTemplate } from '../types/blocks';

type MessageType =
  | 'MAILCRAFT_READY'
  | 'MAILCRAFT_SAVE'
  | 'MAILCRAFT_AUTO_SAVE'
  | 'MAILCRAFT_ERROR';

interface MailCraftMessage {
  source: 'mailcraft';
  type: MessageType;
  payload: unknown;
}

export function sendToParent(type: MessageType, payload: unknown = {}, targetOrigin = '*') {
  if (window.parent === window) return; // Not in iframe

  const message: MailCraftMessage = {
    source: 'mailcraft',
    type,
    payload,
  };

  window.parent.postMessage(message, targetOrigin);
}

export function sendSaveEvent(html: string, template: EmailTemplate, targetOrigin = '*') {
  sendToParent('MAILCRAFT_SAVE', { html, json: template }, targetOrigin);
}

export function sendReadyEvent(targetOrigin = '*') {
  sendToParent('MAILCRAFT_READY', {}, targetOrigin);
}

export function sendErrorEvent(code: string, message: string, targetOrigin = '*') {
  sendToParent('MAILCRAFT_ERROR', { code, message }, targetOrigin);
}

type IncomingHandler = {
  onInit?: (config: { variables?: unknown[]; templateJson?: EmailTemplate }) => void;
  onLoadTemplate?: (json: EmailTemplate) => void;
};

export function listenToParent(handlers: IncomingHandler) {
  const listener = (event: MessageEvent) => {
    const data = event.data;
    if (!data || data.source !== 'mailcraft-host') return;

    switch (data.type) {
      case 'MAILCRAFT_INIT':
        handlers.onInit?.(data.payload);
        break;
      case 'MAILCRAFT_LOAD_TEMPLATE':
        handlers.onLoadTemplate?.(data.payload.json);
        break;
    }
  };

  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
