'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  LogOut,
  RefreshCw,
  Send,
  Sparkles,
  User,
} from 'lucide-react';
import {
  ChatMessage,
  ChatRuntimeResponse,
  interviewChatApi,
} from '../services/interviewChat.service';

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
      const resData = (err as { response?: { data?: { detail?: string } } })?.response?.data;
      const msg =
        typeof resData?.detail === 'string'
          ? resData.detail
          : err instanceof Error
          ? err.message
          : 'Không thể khởi động phòng phỏng vấn.';
      setError(msg);
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
  const handleSendMessage = async () => {
    const trimmed = inputValue.trim();
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
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsSending(true);

    try {
      const res = await interviewChatApi.sendMessage(sessionId, {
        clientMessageId: clientMsgId,
        content: trimmed,
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

      if (res.sessionStatus === 'CLOSED') {
        setRuntime((prev) => (prev ? { ...prev, sessionStatus: 'CLOSED' } : null));
      } else if (res.turnStatus?.turnIndex !== undefined) {
        setRuntime((prev) =>
          prev
            ? {
                ...prev,
                currentTurnIndex: res.turnStatus.turnIndex ?? prev.currentTurnIndex,
                currentTurn: res.turnStatus.turnId
                  ? {
                      turnId: res.turnStatus.turnId,
                      turnIndex: res.turnStatus.turnIndex ?? 0,
                    }
                  : prev.currentTurn,
              }
            : null
        );
      }
    } catch (err: unknown) {
      const resData = (err as { response?: { data?: { detail?: string } } })?.response?.data;
      const msg =
        typeof resData?.detail === 'string'
          ? resData.detail
          : err instanceof Error
          ? err.message
          : 'Lỗi gửi tin nhắn. Vui lòng thử lại.';
      alert(msg);
      // Remove optimistic message on hard failure
      setMessages((prev) => prev.filter((m) => m.messageId !== clientMsgId));
      setInputValue(trimmed);
    } finally {
      setIsSending(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // End interview session
  const handleEndSession = async () => {
    setIsEnding(true);
    try {
      await interviewChatApi.complete(sessionId, 'USER_ENDED');
      setShowEndModal(false);
      setRuntime((prev) => (prev ? { ...prev, sessionStatus: 'CLOSED', endReason: 'USER_ENDED' } : null));
      // Re-fetch latest transcript to ensure all wrap-up messages are loaded
      const updated = await interviewChatApi.getRuntime(sessionId);
      setMessages(updated.messages || []);
    } catch {
      router.push(backUrl);
    } finally {
      setIsEnding(false);
    }
  };

  const jobTitle = runtime?.jobTitle || initialJobTitle || 'Vị trí phỏng vấn';
  const isClosed = runtime?.sessionStatus === 'CLOSED';
  const totalTurns = runtime?.totalTurns || 0;
  const currentTurnDisplay = Math.min((runtime?.currentTurnIndex ?? 0) + 1, totalTurns || 1);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-slate-800">
        <div className="relative flex items-center justify-center">
          <div className="size-16 rounded-2xl bg-indigo-600/10 animate-pulse" />
          <Bot className="absolute size-8 text-indigo-600 animate-bounce" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900">Đang khởi tạo phòng phỏng vấn...</h2>
          <p className="text-xs text-slate-500 mt-1">
            Đang đồng bộ hồ sơ và kết nối AI Interviewer
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-6 shadow-sm border border-slate-200 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-4">
            <AlertCircle className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Không thể bắt đầu phỏng vấn</h3>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{error}</p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={loadChatSession}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition"
            >
              <RefreshCw className="size-4" /> Thử lại
            </button>
            <button
              onClick={() => router.push(backUrl)}
              className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition"
            >
              Quay về
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900">
      {/* 1. Header */}
      <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(backUrl)}
            className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
            title="Quay lại"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 sm:text-base line-clamp-1">
                {jobTitle}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200/50">
                <Sparkles className="size-3" /> Interview Chat
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {isClosed ? 'Đã hoàn tất' : `Chủ đề ${currentTurnDisplay}/${totalTurns}`}
              </span>
              <span>•</span>
              <span
                className={`font-medium ${
                  isClosed ? 'text-slate-500' : 'text-emerald-600'
                }`}
              >
                {isClosed
                  ? runtime?.endReason === 'USER_ENDED'
                    ? 'Dừng theo yêu cầu'
                    : runtime?.endReason === 'TECHNICAL_FAILURE'
                    ? 'Lỗi hệ thống'
                    : 'Đã hoàn tất'
                  : 'Đang diễn ra'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isClosed ? (
            <button
              onClick={() => setShowEndModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Kết thúc phỏng vấn</span>
            </button>
          ) : (
            <button
              onClick={() => router.push(backUrl)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
            >
              Rời phòng
            </button>
          )}
        </div>
      </header>

      {/* 2. Chat Message Stream */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((msg, index) => {
            const isAsst = msg.role === 'assistant';
            const isMainQ = msg.messageType === 'MAIN_QUESTION';
            const isProbe = msg.messageType === 'PROBE' || msg.messageType === 'CLARIFY';
            const isWrapUp = msg.messageType === 'WRAP_UP';

            return (
              <div
                key={msg.messageId || index}
                className={`flex gap-3 sm:gap-4 ${
                  isAsst ? 'items-start' : 'items-start flex-row-reverse'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
                    isAsst
                      ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white'
                      : 'bg-gradient-to-tr from-slate-800 to-slate-700 text-white'
                  }`}
                >
                  {isAsst ? <Bot className="size-4" /> : <User className="size-4" />}
                </div>

                {/* Message Bubble Container */}
                <div className={`flex flex-col max-w-[85%] sm:max-w-[78%] ${!isAsst && 'items-end'}`}>
                  {/* Badges for assistant message types */}
                  {isAsst && (
                    <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                      {isMainQ && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-100">
                          📌 Câu hỏi chính
                        </span>
                      )}
                      {isProbe && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                          🔍 Câu hỏi đào sâu
                        </span>
                      )}
                      {isWrapUp && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="size-3" /> Tổng kết phiên
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {isAsst ? 'AI Interviewer' : 'Bạn'}
                      </span>
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      isAsst
                        ? 'bg-white text-slate-800 border border-slate-200/90 shadow-sm rounded-tl-sm'
                        : 'bg-[#204195] text-white shadow-sm rounded-tr-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isSending && (
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-sm">
                <Bot className="size-4" />
              </div>
              <div className="flex flex-col">
                <div className="text-[11px] text-slate-400 ml-1 mb-1">AI Interviewer</div>
                <div className="inline-flex items-center gap-2 rounded-2xl rounded-tl-sm bg-white px-4 py-3 border border-slate-200 shadow-sm text-xs text-slate-500">
                  <div className="flex gap-1">
                    <span className="size-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.3s]" />
                    <span className="size-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.15s]" />
                    <span className="size-1.5 rounded-full bg-indigo-600 animate-bounce" />
                  </div>
                  <span>AI Interviewer đang suy nghĩ câu hỏi tiếp theo...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* 3. Composer or Closed Banner */}
      <footer className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 sm:p-4 backdrop-blur-md">
        <div className="mx-auto max-w-3xl">
          {isClosed ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-slate-100 p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    Phiên phỏng vấn đã kết thúc
                  </h4>
                  <p className="text-xs text-slate-500">
                    Bạn có thể cuộn lên để xem lại toàn bộ transcript cuộc trò chuyện.
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push(backUrl)}
                className="w-full sm:w-auto rounded-xl bg-[#204195] px-4 py-2 text-xs font-semibold text-white hover:bg-[#183273] transition"
              >
                Về bảng điều khiển
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="relative flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 transition">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập câu trả lời của bạn... (Nhấn Enter để gửi, Shift+Enter để xuống dòng)"
                  rows={1}
                  disabled={isSending}
                  className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isSending}
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#204195] text-white hover:bg-[#183273] disabled:opacity-40 disabled:hover:bg-[#204195] transition"
                  title="Gửi câu trả lời"
                >
                  {isSending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
                <span>Nhấn Enter để gửi câu trả lời</span>
                <span>Tối đa 10,000 ký tự</span>
              </div>
            </div>
          )}
        </div>
      </footer>

      {/* End Session Confirmation Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="max-w-sm w-full rounded-2xl bg-white p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-4">
              <HelpCircle className="size-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">
              Kết thúc phiên phỏng vấn?
            </h3>
            <p className="mt-2 text-xs text-slate-600 text-center leading-relaxed">
              Bạn có chắc chắn muốn kết thúc sớm buổi phỏng vấn này không? Lịch sử cuộc trò chuyện
              sẽ được lưu lại đầy đủ để bạn xem lại.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setShowEndModal(false)}
                disabled={isEnding}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
              >
                Tiếp tục phỏng vấn
              </button>
              <button
                onClick={handleEndSession}
                disabled={isEnding}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-2.5 text-xs font-semibold text-white hover:bg-rose-700 transition"
              >
                {isEnding ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Kết thúc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
