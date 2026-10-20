import { useCallback, useEffect, useRef, useState } from 'react';

import { api, ApiError } from '../../lib/api';
import type { GenerationJob } from '../../types/api';

export const CATEGORY_LABELS: Record<string, string> = {
  welcome: 'Welcome',
  newsletter: 'Newsletter',
  promotional: 'Promotional',
  transactional: 'Transactional',
  event: 'Event',
};

const POLL_MS = 2000;
const TIMEOUT_MS = 10 * 60 * 1000;

const ERROR_COPY: Record<string, string> = {
  AI_GENERATION_LIMIT_EXCEEDED: "You've used all AI generations on your plan.",
  AI_NOT_CONFIGURED: "AI generation isn't available right now.",
  RATE_LIMITED: 'Too many requests, try again in a minute.',
};

function errorText(error: unknown): string {
  if (error instanceof ApiError) return ERROR_COPY[error.code] || error.message || 'Generation failed.';
  return error instanceof Error && error.message ? error.message : 'Generation failed.';
}

function statusText(job: GenerationJob | null): string {
  if (!job || job.status === 'queued') return 'Waiting for a free AI worker…';
  if (job.step === 'images') return 'Finding images…';
  return 'Writing your email…';
}

export function CreateWithAiTab({ onGenerated }: { onGenerated: (templateId: string, warnings: string[]) => void }) {
  const [brief, setBrief] = useState('');
  const [category, setCategory] = useState('welcome');
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  const onGeneratedRef = useRef(onGenerated);
  onGeneratedRef.current = onGenerated;

  const stopPolling = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  const fail = useCallback((message: string) => {
    stopPolling();
    setBusy(false);
    setError(message);
  }, [stopPolling]);

  const poll = useCallback((jobId: string, startedAt: number) => {
    timer.current = setTimeout(async () => {
      if (!alive.current) return;
      if (Date.now() - startedAt > TIMEOUT_MS) {
        fail('Timed out waiting for the AI worker.');
        return;
      }
      try {
        const next = await api.getGenerationJob(jobId);
        if (!alive.current) return;
        setJob(next);
        if (next.status === 'done' && next.template_id) {
          stopPolling();
          onGeneratedRef.current(next.template_id, next.warnings || []);
        } else if (next.status === 'failed' || next.status === 'done') {
          fail(next.error || 'Generation failed.');
        } else {
          poll(jobId, startedAt);
        }
      } catch (e) {
        if (alive.current) fail(errorText(e));
      }
    }, POLL_MS);
  }, [fail, stopPolling]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setJob(null);
    try {
      const { job_id } = await api.generateTemplate(brief.trim(), category);
      if (alive.current) poll(job_id, Date.now());
    } catch (e) {
      if (alive.current) fail(errorText(e));
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <textarea
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        maxLength={2000}
        rows={6}
        disabled={busy}
        placeholder="Describe the email: who it's for, what it announces, the tone."
        style={{
          width: '100%', boxSizing: 'border-box', padding: 12, fontSize: 14, fontFamily: 'inherit',
          border: '1px solid #e2e8f0', borderRadius: 8, resize: 'vertical',
        }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '12px 0' }}>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            disabled={busy}
            onClick={() => setCategory(key)}
            style={{
              padding: '5px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', borderRadius: 20,
              border: '1px solid ' + (category === key ? '#6366f1' : '#e2e8f0'),
              background: category === key ? '#6366f1' : '#f8fafc',
              color: category === key ? '#ffffff' : '#64748b',
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn" onClick={submit} disabled={busy || !brief.trim()}>
          {error && !busy ? 'Try again' : 'Generate'}
        </button>
        {busy && <span role="status" style={{ fontSize: 13, color: '#64748b' }}>{statusText(job)}</span>}
      </div>
      {error && (
        <div
          role="alert"
          style={{
            marginTop: 12, border: '1px solid #fed7d7', background: '#fff5f5',
            color: '#c53030', borderRadius: 6, padding: '8px 12px', fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
