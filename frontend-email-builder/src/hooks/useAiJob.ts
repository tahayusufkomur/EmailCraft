import { useCallback, useEffect, useRef, useState } from 'react';

import { api, ApiError } from '../lib/api';
import type { GenerationJob } from '../types/api';
import type { EmailTemplate } from '../types/blocks';

const POLL_MS = 1000;
const TIMEOUT_MS = 10 * 60 * 1000;
const MAX_POLL_ERRORS = 3;

const ERROR_COPY: Record<string, string> = {
  AI_GENERATION_LIMIT_EXCEEDED: "You've used all the AI emails on your plan.",
  AI_GENERATION_IN_PROGRESS: 'The AI is still working on your last request. Try again in a moment.',
  AI_NOT_CONFIGURED: "AI isn't available right now.",
  RATE_LIMITED: 'Too many requests. Try again in a minute.',
};

function errorText(error: unknown): string {
  if (error instanceof ApiError) return ERROR_COPY[error.code] || error.message || 'Something went wrong.';
  return error instanceof Error && error.message ? error.message : 'Something went wrong.';
}

export type AiKind = 'generate' | 'edit';

interface Handlers {
  /** The email so far, each time it changes while the AI writes. */
  onPartial?: (partial: EmailTemplate) => void;
  onDone: (job: GenerationJob) => void | Promise<void>;
  onFail?: () => void;
}

/** Runs one AI job at a time: starts it, polls it, and hands its live preview and result to the caller. */
export function useAiJob() {
  const [kind, setKind] = useState<AiKind | null>(null);
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [error, setError] = useState<{ kind: AiKind; message: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const run = useCallback(
    async (nextKind: AiKind, create: () => Promise<{ job_id: string }>, handlers: Handlers) => {
      setKind(nextKind);
      setJob(null);
      setError(null);
      const fail = (message: string) => {
        if (!alive.current) return;
        setKind(null);
        setError({ kind: nextKind, message });
        handlers.onFail?.();
      };

      let jobId: string;
      try {
        jobId = (await create()).job_id;
      } catch (e) {
        fail(errorText(e));
        return;
      }

      const startedAt = Date.now();
      let shownPartial = '';
      let pollErrors = 0;
      const tick = async () => {
        if (!alive.current) return;
        if (Date.now() - startedAt > TIMEOUT_MS) {
          fail('This is taking too long. Try again.');
          return;
        }
        try {
          const next = await api.getGenerationJob(jobId);
          pollErrors = 0;
          if (!alive.current) return;
          setJob(next);
          if (next.status === 'failed') {
            fail(next.error || 'Something went wrong.');
            return;
          }
          if (next.status === 'done') {
            try {
              await handlers.onDone(next);
            } catch (e) {
              fail(errorText(e));
              return;
            }
            if (alive.current) setKind(null);
            return;
          }
          const partial = next.partial ? JSON.stringify(next.partial) : '';
          if (next.partial && partial !== shownPartial) {
            shownPartial = partial;
            handlers.onPartial?.(next.partial);
          }
        } catch (e) {
          pollErrors += 1;
          if (pollErrors >= MAX_POLL_ERRORS) {
            fail(errorText(e));
            return;
          }
        }
        timer.current = setTimeout(tick, POLL_MS);
      };
      timer.current = setTimeout(tick, POLL_MS);
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return { kind, busy: kind !== null, job, error, run, clearError };
}
