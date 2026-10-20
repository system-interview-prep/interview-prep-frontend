'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import InterviewerAvatar from './InterviewerAvatar';
import {
  ChatMessage,
  ChatRuntimeResponse,
  EndReason,
  interviewChatApi,
} from '../services/interviewChat.service';
import InteractiveCodeSandbox from '@/components/interview/InteractiveCodeSandbox';
import { AbortConfirmationModal } from '@/components/interview/AbortConfirmationModal';
import { ConfirmDialog } from '@components/shared/ConfirmDialog';
import { getStageLabel } from './ChatInterviewProgress';
import { currentQuestionFromRuntime } from '../hooks/useRuntimeProgress';
import { ChatRoomErrorState, ChatRoomLoadingState } from './ChatRoomStates';
import { ChatReturnModal } from './ChatReturnModal';
import { useChatPresence } from '../hooks/useChatPresence';
import { useLanguage } from '@/i18n/LanguageProvider';
import { fmt } from '@/i18n/format';
import {
  ChatClosedFooter,
  ChatComposer,
  ChatRoomHeader,
  chatErrorMessage,
  ErrorBanner,
  InterviewGuidePanel,
  MessageBubble,
  StageTipBar,
  TypingBubble,
} from './ChatRoomParts';

interface InterviewChatRoomProps {
  sessionId: string;
  jobTitle?: string;
  backUrl?: string;
}

export default function InterviewChatRoom({
  sessionId,
  jobTitle: initialJobTitle,
  backUrl = '/dashboard',
}: InterviewChatRoomProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<ChatRuntimeResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Heartbeat + "left" signal while the room is open; the backend closes an abandoned chat after a grace period.
  const presence = useChatPresence(sessionId, Boolean(runtime) && runtime?.sessionStatus !== 'CLOSED');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingRetryRef = useRef<{
    clientMessageId: string;
    content: string;
    telemetry?: Record<string, unknown>;
  } | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Load or initialize chat runtime
  const loadChatSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await interviewChatApi.start(sessionId);
      setRuntime(data);
      const loadedMessages = data.messages || [];
      setMessages(loadedMessages);
      const lastMessage = loadedMessages[loadedMessages.length - 1];
      if (lastMessage?.role === 'user' && lastMessage.clientMessageId) {
        pendingRetryRef.current = {
          clientMessageId: lastMessage.clientMessageId,
          content: lastMessage.content,
          telemetry: (lastMessage.metadata?.telemetry as Record<string, unknown> | undefined),
        };
        setInputValue(lastMessage.content);
      } else {
        pendingRetryRef.current = null;
      }
    } catch (err: unknown) {
      setError(chatErrorMessage(err, t('room.chat.startError')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      loadChatSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  // Send message
  const handleSendMessage = async (customContent?: string, telemetry?: Record<string, unknown>) => {
    const rawContent = customContent !== undefined ? customContent : inputValue;
    const trimmed = rawContent.trim();
    if (!trimmed || isSending || runtime?.sessionStatus === 'CLOSED') return;

    const pendingRetry = pendingRetryRef.current;
    if (pendingRetry && pendingRetry.content !== trimmed) {
      setActionError(t('room.chat.pendingRetry'));
      setInputValue(pendingRetry.content);
      return;
    }
    const clientMsgId = pendingRetry?.clientMessageId
      ?? `cli-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const requestTelemetry = pendingRetry?.telemetry ?? telemetry;
    const tempUserMsg: ChatMessage = {
      messageId: clientMsgId,
      sessionId,
      role: 'user',
      messageType: 'CANDIDATE_ANSWER',
      turnId: runtime?.currentTurn?.turnId,
      sequence: (messages[messages.length - 1]?.sequence || 0) + 1,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    if (!pendingRetry) {
      setMessages((prev) => [...prev, tempUserMsg]);
    }
    if (customContent === undefined) {
      setInputValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
    setIsSending(true);
    setActionError(null);

    try {
      const res = await interviewChatApi.sendMessage(sessionId, {
        clientMessageId: clientMsgId,
        content: trimmed,
        telemetry: requestTelemetry,
      });
      pendingRetryRef.current = null;

      setMessages((prev) => {
        // Replace temp msg and append assistant response
        const filtered = prev.filter((m) => m.messageId !== clientMsgId);
        const next = [...filtered, res.userMessage];
        if (res.assistantResponse) {
          next.push(res.assistantResponse);
        }
        return next;
      });

      // A CONFIRM_ABORT reply renders its own stop/continue buttons in the bubble.

      if (res.sessionStatus === 'CLOSED') {
        setRuntime((prev) =>
          prev
            ? { ...prev, sessionStatus: 'CLOSED', endReason: res.endReason ?? prev.endReason }
            : null
        );
      } else {
        try {
          const freshRuntime = await interviewChatApi.getRuntime(sessionId);
          setRuntime(freshRuntime);
        } catch {
          if (res.turnStatus?.turnIndex !== undefined) {
            setRuntime((prev) =>
              prev
                ? {
                    ...prev,
                    currentTurnIndex: res.turnStatus.turnIndex ?? prev.currentTurnIndex,
                    currentTurn: prev.currentTurn
                      ? { ...prev.currentTurn, stage: res.currentStage ?? prev.currentTurn.stage }
                      : prev.currentTurn,
                    workingMemory: {
                      ...prev.workingMemory,
                      current_stage: res.currentStage ?? prev.workingMemory?.current_stage,
                      remaining_time:
                        res.remainingTimeSeconds ?? prev.workingMemory?.remaining_time,
                    },
                  }
                : null
            );
          }
        }
      }
    } catch (err: unknown) {
      pendingRetryRef.current = {
        clientMessageId: clientMsgId,
        content: trimmed,
        telemetry: requestTelemetry,
      };
      setActionError(chatErrorMessage(err, t('room.chat.sendError')));
      // Remove optimistic message on hard failure
      setMessages((prev) => prev.filter((m) => m.messageId !== clientMsgId));
      if (customContent === undefined) {
        setInputValue(trimmed);
      }
    } finally {
      setIsSending(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  };

  const handleCodeSubmit = async (code: string, codeDiff: string, testPassed: boolean) => {
    const formattedCodeMsg = fmt(t('room.chat.codeMessage'), {
      result: t(testPassed ? 'room.chat.codePassed' : 'room.chat.codeFailed'),
      code,
    });

    await handleSendMessage(formattedCodeMsg, {
      isCodingTurn: true,
      is_coding_turn: true,
      codeDiff,
      code_diff: codeDiff,
      testPassed,
      test_passed: testPassed,
      submittedCode: code,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Vietnamese IMEs commit a word with Enter: never send mid-composition.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // End interview session
  const handleEndSession = async (reason?: string) => {
    setIsEnding(true);
    const endReason: EndReason =
      reason === 'COMPLETED' || reason === 'TECHNICAL_FAILURE' ? reason : 'USER_ENDED';
    try {
      await interviewChatApi.complete(sessionId, endReason);
      setShowEndModal(false);
      setRuntime((prev) => (prev ? { ...prev, sessionStatus: 'CLOSED', endReason } : null));
      // Re-fetch latest transcript to ensure all wrap-up messages are loaded
      const updated = await interviewChatApi.getRuntime(sessionId);
      setRuntime(updated);
      setMessages(updated.messages || []);
    } catch (err: unknown) {
      // Navigating away here used to leave the session OPEN without telling
      // the candidate. Stay in the room so they can retry ending it.
      setShowEndModal(false);
      setActionError(
        fmt(t('room.common.endError'), { reason: chatErrorMessage(err, t('room.common.tryAgainLower')) })
      );
    } finally {
      setIsEnding(false);
    }
  };

  const jobTitle = runtime?.jobTitle || initialJobTitle || t('room.chat.defaultJobTitle');
  const isClosed = runtime?.sessionStatus === 'CLOSED';
  const currentStage = runtime?.currentTurn?.stage ?? runtime?.workingMemory?.current_stage;

  const durationMinutes = runtime?.durationMinutes;
  const startedAt = runtime?.startedAt;
  const serverRemainingSeconds = runtime?.workingMemory?.remaining_time;

  // Stage of each turn, so every AI message can say which stage it belongs to.
  const stageByTurnId = useMemo(() => {
    const map = new Map<string, string>();
    for (const turn of runtime?.turns ?? []) {
      if (turn.stage) map.set(turn.turnId, String(turn.stage));
    }
    return map;
  }, [runtime?.turns]);

  // Questions answered, not messages sent: a "repeat the question" request or
  // the auto "continue" reply after an abort prompt is not an answer.
  const answeredCount = useMemo(
    () =>
      new Set(
        messages
          .filter((message) => message.role === 'user' && message.messageType === 'CANDIDATE_ANSWER' && message.turnId)
          .map((message) => message.turnId)
      ).size,
    [messages]
  );

  // Screen readers hear only the newest interviewer message, not the whole transcript.
  const latestAssistantText = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'assistant') return messages[i].content;
    }
    return '';
  }, [messages]);

  const isCodingQuestion = useMemo(() => {
    return (
      runtime?.currentTurn?.questionType === 'coding' ||
      Boolean(runtime?.currentTurn?.starterCode)
    );
  }, [runtime?.currentTurn?.questionType, runtime?.currentTurn?.starterCode]);

  const renderMessageItems = () => (
    <>
      {messages.map((msg, index) => {
        const turnStage = msg.turnId ? stageByTurnId.get(msg.turnId) : undefined;
        return (
          <MessageBubble
            key={msg.messageId || index}
            message={msg}
            stageLabel={getStageLabel(turnStage, t)}
            isClosed={isClosed}
            isEnding={isEnding}
            isSending={isSending}
            onConfirmAbort={() => handleEndSession('USER_ENDED')}
            onContinue={() => handleSendMessage(t('room.chat.continueMessage'))}
          />
        );
      })}
      {isSending ? <TypingBubble /> : null}
      <div ref={messagesEndRef} />
    </>
  );

  if (loading) {
    return <ChatRoomLoadingState />;
  }

  if (error) {
    return (
      <ChatRoomErrorState
        message={error}
        onRetry={loadChatSession}
        onBack={() => router.push(backUrl)}
      />
    );
  }

  // The engine allows one clarification per question; repeats and questions about
  // the interview do not count (same rule as chat_runtime's clarify count).
  const currentTurnId = runtime?.currentTurn?.turnId;
  const clarifyUsed =
    Boolean(currentTurnId) &&
    messages.some(
      (m) =>
        m.role === 'assistant' &&
        m.turnId === currentTurnId &&
        m.messageType === 'CLARIFY' &&
        !m.metadata?.repeatRequest &&
        !m.metadata?.candidateQuestionIntent,
    );

  const composer = (compact: boolean) => (
    <ChatComposer
      value={inputValue}
      currentStage={currentStage}
      isSending={isSending}
      textareaRef={textareaRef}
      compact={compact}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onSend={() => handleSendMessage()}
      onQuickReply={(text) => handleSendMessage(text)}
      clarifyUsed={clarifyUsed}
      onSkip={() => setShowSkipConfirm(true)}
    />
  );

  return (
    <div className="flex h-dvh flex-col bg-[#F7F9FD] text-[#14244B]">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {latestAssistantText}
      </div>
      <ChatRoomHeader
        jobTitle={jobTitle}
        durationMinutes={durationMinutes}
        isClosed={isClosed}
        endReason={runtime?.endReason}
        serverRemainingSeconds={serverRemainingSeconds}
        startedAt={startedAt}
        isEnding={isEnding}
        onBack={() => (isClosed ? router.push(backUrl) : setShowLeaveConfirm(true))}
        onEnd={() => setShowEndModal(true)}
        onLeave={() => router.push(backUrl)}
        questionNumber={runtime?.currentTurn ? (runtime.currentTurnIndex ?? 0) + 1 : null}
        totalQuestions={runtime?.totalTurns}
        stageLabel={isClosed ? null : getStageLabel(currentStage, t)}
      />

      {/* Like the voice room: no stage stepper; the stage is in the header and on the question card (below lg, in the tip bar). */}
      {!isClosed ? <StageTipBar currentStage={currentStage} /> : null}

      {isCodingQuestion && !isClosed ? (
        <main className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-6 lg:overflow-visible">
          <div className="grid grid-cols-12 gap-4 lg:h-full">
            <div className="col-span-12 flex max-h-[70dvh] min-h-[320px] flex-col overflow-hidden lg:h-full lg:max-h-none lg:min-h-0 rounded-3xl border border-[#DCE4F3] bg-white lg:col-span-5">
              <div className="flex items-center gap-2 border-b border-[#DCE4F3] bg-[#F7F9FD] px-4 py-2.5">
                <InterviewerAvatar size={22} />
                <span className="text-xs font-bold text-[#14244B]">{t('room.chat.codingPanelTitle')}</span>
              </div>
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">{renderMessageItems()}</div>
              <div className="border-t border-[#DCE4F3] bg-[#F7F9FD] p-3">
                {actionError ? (
                  <div className="mb-2">
                    <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />
                  </div>
                ) : null}
                {composer(true)}
                <p className="mt-1 px-1 text-[11px] font-medium text-[#204195]">
                  {t('room.chat.codingHint')}
                </p>
              </div>
            </div>
            <div className="col-span-12 flex h-[75dvh] min-h-[500px] flex-col lg:col-span-7 lg:h-full">
              <InteractiveCodeSandbox
                starterCode={runtime?.currentTurn?.starterCode || ''}
                language={runtime?.currentTurn?.language || 'python'}
                testCode={runtime?.currentTurn?.testCasesCode || ''}
                onSubmit={handleCodeSubmit}
                isSubmitting={isSending}
              />
            </div>
          </div>
        </main>
      ) : (
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
              <div className="mx-auto max-w-3xl space-y-5">{renderMessageItems()}</div>
            </main>
            <footer className="border-t border-[#DCE4F3] bg-white p-3 sm:p-4">
              <div className="mx-auto max-w-3xl space-y-2">
                {actionError ? (
                  <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />
                ) : null}
                {isClosed ? (
                  <ChatClosedFooter
                    endReason={runtime?.endReason}
                    answeredCount={answeredCount}
                    onReport={() => router.push(`/interview/results/${sessionId}`)}
                    onBack={() => router.push(backUrl)}
                  />
                ) : (
                  composer(false)
                )}
              </div>
            </footer>
          </div>
          <InterviewGuidePanel
            currentStage={currentStage}
            sessionStatus={runtime?.sessionStatus ?? 'OPEN'}
            answeredCount={answeredCount}
            question={runtime ? currentQuestionFromRuntime(runtime) : null}
          />
        </div>
      )}

      {presence.awaySince && runtime?.sessionStatus !== 'CLOSED' ? (
        <ChatReturnModal
          awaySince={presence.awaySince}
          graceMinutes={presence.graceMinutes}
          onContinue={() => {
            presence.dismissAway();
            textareaRef.current?.focus();
          }}
        />
      ) : null}

      {/* End Session Confirmation Modal (Dual-Trigger) */}
      <AbortConfirmationModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        onConfirm={handleEndSession}
        isSubmitting={isEnding}
      />

      <ConfirmDialog
        open={showSkipConfirm}
        title={t('room.chat.skip.title')}
        body={t('room.chat.skip.body')}
        confirmLabel={t('room.chat.skip.confirm')}
        cancelLabel={t('room.chat.skip.cancel')}
        onConfirm={() => {
          setShowSkipConfirm(false);
          // The engine's skip phrase (interview_engine.SKIP_QUESTION_PATTERNS).
          void handleSendMessage(t('room.chat.quick.skip'));
        }}
        onCancel={() => setShowSkipConfirm(false)}
      />

      <ConfirmDialog
        open={showLeaveConfirm}
        title={t('room.common.leaveConfirmTitle')}
        body={fmt(t('room.common.leaveConfirmBody'), { n: presence.graceMinutes })}
        confirmLabel={t('room.common.leaveConfirm')}
        cancelLabel={t('room.common.continueInterview')}
        onConfirm={() => {
          setShowLeaveConfirm(false);
          router.push(backUrl);
        }}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </div>
  );
}
