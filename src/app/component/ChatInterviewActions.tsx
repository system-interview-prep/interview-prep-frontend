"use client";

import React, { useState } from "react";
import { useLanguage } from "../../i18n/LanguageProvider";
import type { Message } from "../../types/message";
import { buildTranscriptText } from "../../utils/chatSessionMeta";

export function ChatInterviewActions({
  messages,
  sessionId,
}: {
  messages: Message[];
  sessionId: string;
}) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const disabled = messages.length === 0;

  const transcript = () =>
    buildTranscriptText(messages, {
      aiLabel: t("interview.curatorAi"),
      youLabel: t("chat.you"),
    });

  const copy = async () => {
    if (disabled) return;
    try {
      await navigator.clipboard.writeText(transcript());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const exportTxt = () => {
    if (disabled || !sessionId) return;
    const blob = new Blob([transcript()], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `chat-interview-${sessionId.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex items-center gap-1 shrink-0">
      {copied && (
        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 mr-1 hidden sm:inline">
          {t("chatInterview.copied")}
        </span>
      )}
      <button
        type="button"
        onClick={() => void copy()}
        disabled={disabled}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 transition-colors"
        title={t("chatInterview.copyTranscript")}
        aria-label={t("chatInterview.copyTranscript")}
      >
        <span className="material-symbols-outlined text-[20px]">content_copy</span>
      </button>
      <button
        type="button"
        onClick={exportTxt}
        disabled={disabled}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 transition-colors"
        title={t("chatInterview.exportTxt")}
        aria-label={t("chatInterview.exportTxt")}
      >
        <span className="material-symbols-outlined text-[20px]">download</span>
      </button>
    </div>
  );
}
