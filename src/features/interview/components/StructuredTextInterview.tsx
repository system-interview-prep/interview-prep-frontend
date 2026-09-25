'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import ChatBox, { type ChatMessage } from './ChatBox';
import {
  interviewRuntimeApi,
  type InterviewTextRuntime,
} from '../services/interviewRuntime.service';

function timestamp(value?: string | null): string {
  if (!value) return '';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function StructuredTextInterview({
  sessionId,
  onCompleted,
}: {
  sessionId: string;
  onCompleted?: () => void;
}) {
  const [runtime, setRuntime] = useState<InterviewTextRuntime | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRuntime = useCallback(async () => {
    const next = await interviewRuntimeApi.getTextRuntime(sessionId);
    if (next.currentTurn?.status === 'PLANNED') {
      await interviewRuntimeApi.askTurn(sessionId, next.currentTurn.turnId);
      return interviewRuntimeApi.getTextRuntime(sessionId);
    }
    return next;
  }, [sessionId]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    loadRuntime()
      .then((next) => {
        if (active) setRuntime(next);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load interview');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadRuntime]);

  const messages = useMemo<ChatMessage[]>(() => {
    if (!runtime) return [];
    const result: ChatMessage[] = [];
    for (const turn of runtime.turns) {
      if (turn.status === 'PLANNED') break;
      const question = turn.question.questionText?.trim();
      if (question) {
        result.push({
          senderId: 'ai',
          senderName: 'AI Interviewer',
          content: question,
          timestamp: timestamp(turn.startedAt),
        });
      }
      if (turn.answerText) {
        result.push({
          senderId: 'me',
          senderName: 'Me',
          content: turn.answerText,
          timestamp: timestamp(turn.completedAt),
        });
      }
    }
    return result;
  }, [runtime]);

  const submitAnswer = useCallback(async (content: string) => {
    if (!runtime?.currentTurn || isSending) return;
    setIsSending(true);
    setError(null);
    try {
      await interviewRuntimeApi.answerTurn(
        sessionId,
        runtime.currentTurn.turnId,
        content,
      );
      let next = await interviewRuntimeApi.getTextRuntime(sessionId);
      if (next.completed) {
        next = await interviewRuntimeApi.completeTextRuntime(sessionId);
        setRuntime(next);
        onCompleted?.();
        return;
      }
      if (next.currentTurn?.status === 'PLANNED') {
        await interviewRuntimeApi.askTurn(sessionId, next.currentTurn.turnId);
        next = await interviewRuntimeApi.getTextRuntime(sessionId);
      }
      setRuntime(next);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit answer');
    } finally {
      setIsSending(false);
    }
  }, [isSending, onCompleted, runtime?.currentTurn, sessionId]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center gap-3 text-on-surface-variant">
        <Loader2 className="size-5 animate-spin" />
        <span>Preparing your interview…</span>
      </div>
    );
  }

  if (error && !runtime) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-error">
        {error}
      </div>
    );
  }

  if (!runtime) return null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-outline-variant/20 bg-surface-container-low px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Structured interview
            </p>
            <p className="text-sm font-bold text-on-surface">
              {runtime.completed
                ? 'Interview completed'
                : `Question ${Math.min(runtime.progress.answered + 1, runtime.progress.total)} of ${runtime.progress.total}`}
            </p>
          </div>
          <span className="text-xs font-semibold tabular-nums text-on-surface-variant">
            {runtime.progress.answered}/{runtime.progress.total}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container-high">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{
              width: `${runtime.progress.total ? (runtime.progress.answered / runtime.progress.total) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {runtime.completed ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <CheckCircle2 className="size-10 text-primary" />
          <h2 className="font-headline text-lg font-bold">Interview completed</h2>
          <p className="max-w-md text-sm text-on-surface-variant">
            Your answers were saved. Scoring and evidence feedback are added in the evaluation phase.
          </p>
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <ChatBox
            messages={messages}
            onSendMessage={submitAnswer}
            disabled={isSending || !runtime.currentTurn}
          />
        </div>
      )}

      {error && runtime ? (
        <div className="shrink-0 border-t border-error/20 bg-error-container px-4 py-2 text-xs text-on-error-container">
          {error}
        </div>
      ) : null}
    </div>
  );
}
