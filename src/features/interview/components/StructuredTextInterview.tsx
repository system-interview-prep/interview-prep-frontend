'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, MessageSquareText, ShieldCheck } from 'lucide-react';
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
      <div className="shrink-0 border-b border-[#E6EBF4] bg-white px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF3FF] text-[#204195]">
              <MessageSquareText className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#607096]">Chat interview</p>
              <p className="truncate text-sm font-bold text-[#14244B]">
                {runtime.completed
                  ? 'Interview completed'
                  : `Question ${Math.min(runtime.progress.answered + 1, runtime.progress.total)} of ${runtime.progress.total}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 sm:inline-flex">
              <ShieldCheck className="size-3.5" />
              Answers saved
            </span>
            <span className="rounded-full bg-[#F4F6FA] px-2.5 py-1 text-xs font-bold tabular-nums text-[#425477]">
              {runtime.progress.answered}/{runtime.progress.total}
            </span>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EDF1F7]">
          <div
            className="h-full rounded-full bg-[#204195] transition-[width]"
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
