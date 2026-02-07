import { createElement, type ReactNode } from 'react';
import type { Block, EmailTemplate } from '../types/blocks';

const VAR_REGEX = /(\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\})/g;
const VAR_PATTERN = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

/**
 * Insert text at the current cursor position of an input or textarea element.
 */
export function insertAtCursor(
  element: HTMLInputElement | HTMLTextAreaElement | null,
  currentValue: string,
  insertText: string,
): { newValue: string; cursorPos: number } {
  if (!element) {
    return {
      newValue: currentValue + insertText,
      cursorPos: (currentValue + insertText).length,
    };
  }
  const start = element.selectionStart ?? currentValue.length;
  const end = element.selectionEnd ?? currentValue.length;
  const newValue = currentValue.slice(0, start) + insertText + currentValue.slice(end);
  return { newValue, cursorPos: start + insertText.length };
}

/**
 * After React re-renders, restore cursor position in the input element.
 */
export function restoreCursor(
  element: HTMLInputElement | HTMLTextAreaElement | null,
  position: number,
): void {
  if (!element) return;
  setTimeout(() => {
    element.focus();
    element.setSelectionRange(position, position);
  }, 0);
}

/**
 * Split text by {{var}} patterns and return React elements with chip styling
 * for variable placeholders. For use in canvas block display.
 */
export function highlightVariables(text: string): ReactNode[] {
  const parts = text.split(VAR_REGEX);
  return parts.map((part, i) => {
    if (VAR_REGEX.test(part)) {
      // Reset lastIndex since we use global flag
      VAR_REGEX.lastIndex = 0;
      return createElement(
        'span',
        {
          key: i,
          style: {
            backgroundColor: '#dbeafe',
            color: '#1e40af',
            borderRadius: 3,
            padding: '1px 4px',
            fontFamily: 'monospace',
            fontSize: '0.9em',
          },
        },
        part,
      );
    }
    return part;
  });
}

/**
 * Client-side variable substitution for preview with default values.
 * Returns a new template with {{key}} placeholders replaced.
 */
export function substituteVariablesClientSide(
  template: EmailTemplate,
  variables: Record<string, string>,
): EmailTemplate {
  const result = JSON.parse(JSON.stringify(template)) as EmailTemplate;
  for (const section of ['header', 'body', 'footer'] as const) {
    substituteInBlocks(result[section].blocks, variables);
  }
  return result;
}

function substituteInBlocks(blocks: Block[], variables: Record<string, string>): void {
  for (const block of blocks) {
    switch (block.type) {
      case 'text':
        block.data.html = replaceVars(block.data.html, variables);
        break;
      case 'heading':
        block.data.text = replaceVars(block.data.text, variables);
        break;
      case 'button':
        block.data.text = replaceVars(block.data.text, variables);
        block.data.url = replaceVars(block.data.url, variables);
        break;
      case 'image':
        block.data.alt = replaceVars(block.data.alt, variables);
        if (block.data.link) block.data.link = replaceVars(block.data.link, variables);
        break;
      case 'html':
        block.data.html = replaceVars(block.data.html, variables);
        break;
      case 'columns':
        for (const col of block.data.columns) {
          substituteInBlocks(col.blocks, variables);
        }
        break;
    }
  }
}

function replaceVars(text: string, variables: Record<string, string>): string {
  return text.replace(VAR_PATTERN, (match, key: string) => variables[key] ?? match);
}
