import { useEffect, useRef } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';

import { CATEGORY_LABELS } from '../../lib/templates';

const STARTERS: [label: string, brief: string][] = [
  ['Welcome new members', 'A welcome email for people who just joined, with three things to try first and a button to get started.'],
  ['Monthly newsletter', 'A monthly newsletter with one lead story, three short updates and a warm closing note.'],
  ['Weekend sale', 'A weekend sale: 20% off everything with code WEEKEND20, ending Sunday at midnight.'],
  ['Event invitation', 'An invitation to an evening event, with the date, time, place and an RSVP button.'],
];

interface Props {
  brief: string;
  category: string;
  error: string | null;
  generationsLeft: number | null;
  /** Offered when there is an email to go back to. */
  onBack?: () => void;
  onBriefChange: (brief: string) => void;
  onCategoryChange: (category: string) => void;
  onSubmit: () => void;
  onBrowseTemplates: () => void;
  /** Offered when the email is empty. */
  onStartBlank?: () => void;
}

/** The editor's first screen: describe the email and the AI builds it. */
export function AiStart({
  brief, category, error, generationsLeft, onBack, onBriefChange, onCategoryChange, onSubmit,
  onBrowseTemplates, onStartBlank,
}: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => inputRef.current?.focus(), []);

  const outOfQuota = generationsLeft === 0;
  const canSubmit = brief.trim().length > 0 && !outOfQuota;
  const submit = () => {
    if (canSubmit) onSubmit();
  };

  return (
    <div className="ai-start">
      <div className="ai-start-inner">
        <span className="ai-start-mark" aria-hidden="true">
          <Sparkles size={18} />
        </span>
        <h1 className="ai-start-title">What email do you want to send?</h1>
        <p className="ai-start-lede">
          Describe it in a sentence or two. The AI writes and designs it, and you can change anything after.
        </p>

        <form
          className="ai-start-card"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <textarea
            ref={inputRef}
            className="ai-start-input"
            aria-label="Describe your email"
            rows={4}
            maxLength={2000}
            value={brief}
            onChange={(e) => onBriefChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="For example: a spring sale for our ceramics shop, 20% off everything this weekend with code SPRING20. Warm and friendly."
          />
          <div className="ai-start-actions">
            <label className="ai-start-type">
              Type
              <select value={category} onChange={(e) => onCategoryChange(e.target.value)}>
                <option value="">Any</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn btn-primary ai-submit" disabled={!canSubmit}>
              Create email
              <ArrowUp size={14} aria-hidden="true" />
            </button>
          </div>
        </form>

        {error && <div role="alert" className="ai-error">{error}</div>}

        <div className="ai-starters">
          {STARTERS.map(([label, text]) => (
            <button
              key={label}
              type="button"
              className="ai-chip"
              onClick={() => {
                onBriefChange(text);
                inputRef.current?.focus();
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="ai-start-footer">
          {onBack && (
            <>
              <button type="button" className="ai-link" onClick={onBack}>Back to your email</button>
              <span aria-hidden="true">·</span>
            </>
          )}
          <button type="button" className="ai-link" onClick={onBrowseTemplates}>Start from a template</button>
          {onStartBlank && (
            <>
              <span aria-hidden="true">·</span>
              <button type="button" className="ai-link" onClick={onStartBlank}>Start blank</button>
            </>
          )}
          {generationsLeft !== null && (
            <span className="ai-start-quota">
              {outOfQuota
                ? 'No AI emails left on your plan'
                : `${generationsLeft} AI email${generationsLeft === 1 ? '' : 's'} left`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
