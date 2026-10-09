'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot } from 'lucide-react';
import {
  ChatMessage,
  ChatRuntimeResponse,
  EndReason,
  interviewChatApi,
} from '../services/interviewChat.service';
import InteractiveCodeSandbox from '@/components/interview/InteractiveCodeSandbox';
import { AbortConfirmationModal } from '@/components/interview/AbortConfirmationModal';
import { ChatStageStepper, getStageLabel } from './ChatInterviewProgress';
import { ChatRoomErrorState, ChatRoomLoadingState } from './ChatRoomStates';
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<ChatRuntimeResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      setMessages(data.messages || []);
    } catch (err: unknown) {
      setError(chatErrorMessage(err, 'Không thể khởi động phòng phỏng vấn.'));
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

    const clientMsgId = `cli-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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

    setMessages((prev) => [...prev, tempUserMsg]);
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
        telemetry,
      });

      setMessages((prev) => {
        // Replace temp msg and append assistant response
        const filtered = prev.filter((m) => m.messageId !== clientMsgId);
        const next = [...filtered, res.userMessage];
        if (res.assistantResponse) {
          next.push(res.assistantResponse);
        }
        return next;
      });

      // TRIGGER 2 (Qua chat): AI nhận diện ý định dừng và trả về CONFIRM_ABORT
      // Không tự động bật popup modal nữa mà để người dùng bấm trực tiếp vào nút trong khung chat
      if (
        res.action === 'CONFIRM_ABORT' ||
        res.assistantResponse?.messageType === 'CONFIRM_ABORT'
      ) {
        // Nút bấm xác nhận dừng đã được hiển thị trực tiếp ngay dưới tin nhắn của AI
      }

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
      setActionError(chatErrorMessage(err, 'Chưa gửi được câu trả lời. Vui lòng thử lại.'));
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
    const formattedCodeMsg = `Tôi đã hoàn thành việc sửa lỗi code trên Editor.\n\nKết quả test cases: ${
      testPassed ? '✅ VƯỢT QUA TẤT CẢ TEST CASES (PASSED)' : '❌ CHƯA VƯỢT QUA TEST CASES (FAILED)'
    }\n\nGiải pháp của tôi:\n\`\`\`python\n${code}\n\`\`\``;

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
    if (e.key === 'Enter' && !e.shiftKey) {
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
        `Chưa kết thúc được buổi phỏng vấn: ${chatErrorMessage(err, 'vui lòng thử lại.')}`
      );
    } finally {
      setIsEnding(false);
    }
  };

  const jobTitle = runtime?.jobTitle || initialJobTitle || 'Vị trí phỏng vấn';
  const isClosed = runtime?.sessionStatus === 'CLOSED';
  const currentStage = runtime?.currentTurn?.stage ?? runtime?.workingMemory?.current_stage;
  const currentCompetency = runtime?.currentTurn?.competency;

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

  const answeredCount = useMemo(
    () => messages.filter((message) => message.role === 'user').length,
    [messages]
  );

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
            stageLabel={getStageLabel(turnStage)}
            isClosed={isClosed}
            isEnding={isEnding}
            isSending={isSending}
            onConfirmAbort={() => handleEndSession('USER_ENDED')}
            onContinue={() => handleSendMessage('Tôi muốn tiếp tục buổi phỏng vấn')}
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
    />
  );

  return (
    <div className="flex h-screen flex-col bg-[#F7F9FD] text-[#14244B]">
      <ChatRoomHeader
        jobTitle={jobTitle}
        durationMinutes={durationMinutes}
        isClosed={isClosed}
        endReason={runtime?.endReason}
        serverRemainingSeconds={serverRemainingSeconds}
        startedAt={startedAt}
        isEnding={isEnding}
        onBack={() => router.push(backUrl)}
        onEnd={() => setShowEndModal(true)}
        onLeave={() => router.push(backUrl)}
      />

      {/* Below lg the side panel is hidden: keep a compact stepper + tip. */}
      <div className="lg:hidden">
        <ChatStageStepper
          currentStage={currentStage}
          sessionStatus={runtime?.sessionStatus ?? 'OPEN'}
          turns={runtime?.turns}
        />
        {!isClosed ? <StageTipBar currentStage={currentStage} /> : null}
      </div>

      {isCodingQuestion && !isClosed ? (
        <main className="min-h-0 flex-1 px-3 py-3 sm:px-6">
          <div className="grid h-full grid-cols-12 gap-4">
            <div className="col-span-12 flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs lg:col-span-5">
              <div className="flex items-center gap-2 border-b border-[#DCE4F3] bg-[#F7F9FD] px-4 py-2.5">
                <Bot className="size-4 text-[#204195]" aria-hidden="true" />
                <span className="text-xs font-bold text-[#14244B]">Hội thoại với AI Interviewer</span>
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
                  Sửa code và bấm “Nộp bài” trong khung bên phải.
                </p>
              </div>
            </div>
            <div className="col-span-12 flex h-full min-h-[500px] flex-col lg:col-span-7">
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
            <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6" aria-live="polite">
              <div className="mx-auto max-w-3xl space-y-5">{renderMessageItems()}</div>
            </main>
            <footer className="border-t border-[#DCE4F3] bg-white/95 p-3 backdrop-blur-md sm:p-4">
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
            competency={currentCompetency}
            sessionStatus={runtime?.sessionStatus ?? 'OPEN'}
            turns={runtime?.turns}
            answeredCount={answeredCount}
          />
        </div>
      )}

      {/* End Session Confirmation Modal (Dual-Trigger) */}
      <AbortConfirmationModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        onConfirm={handleEndSession}
        isSubmitting={isEnding}
      />
    </div>
  );
}
