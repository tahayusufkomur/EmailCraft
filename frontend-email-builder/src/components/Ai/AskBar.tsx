import { useState } from 'react';
import { ArrowUp, Sparkles, X } from 'lucide-react';

interface Props {
  busy: boolean;
  activity: string;
  /** The selected block's kind; the request is about that block. */
  scopeLabel: string | null;
  note: string | null;
  noteIsError: boolean;
  /** The last change came from the AI and can be undone from here. */
  canUndo: boolean;
  onAsk: (instruction: string) => void;
  onClearScope: () => void;
  onUndo: () => void;
  onDismissNote: () => void;
}

/** Ask the AI for a change to the email, or to the selected block. */
export function AskBar({
  busy, activity, scopeLabel, note, noteIsError, canUndo, onAsk, onClearScope, onUndo, onDismissNote,
}: Props) {
  const [text, setText] = useState('');

  return (
    <form
      className="ai-askbar"
      onSubmit={(e) => {
        e.preventDefault();
        const instruction = text.trim();
        if (!instruction || busy) return;
        onAsk(instruction);
        setText('');
      }}
    >
      {note && !busy && (
        <div className={`ai-note${noteIsError ? ' is-error' : ''}`} role={noteIsError ? 'alert' : 'status'}>
          <span>{note}</span>
          <button type="button" className="ai-note-close" aria-label="Dismiss" onClick={onDismissNote}>
            <X size={13} />
          </button>
        </div>
      )}
      <div className="ai-askbar-field">
        {busy ? (
          <div className="ai-askbar-status" role="status">
            <span className="ai-pulse" aria-hidden="true" />
            {activity || 'Working on it…'}
          </div>
        ) : (
          <>
            <Sparkles size={16} className="ai-askbar-icon" aria-hidden="true" />
            {scopeLabel && (
              <span className="ai-scope">
                {scopeLabel}
                <button type="button" aria-label="Ask about the whole email instead" onClick={onClearScope}>
                  <X size={12} />
                </button>
              </span>
            )}
            <input
              className="ai-askbar-input"
              value={text}
              maxLength={1000}
              onChange={(e) => setText(e.target.value)}
              aria-label="Ask the AI to change the email"
              placeholder={scopeLabel ? `Ask the AI to change this ${scopeLabel.toLowerCase()}…` : 'Ask the AI to change this email…'}
            />
            {canUndo && !text && (
              <button type="button" className="ai-link ai-askbar-undo" onClick={onUndo}>Undo</button>
            )}
            <button type="submit" className="ai-askbar-send" disabled={!text.trim()} aria-label="Send to the AI">
              <ArrowUp size={16} />
            </button>
          </>
        )}
      </div>
    </form>
  );
}
