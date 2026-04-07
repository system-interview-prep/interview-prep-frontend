"use client";

import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { ChatInterviewActions } from "../../component/ChatInterviewActions";
import type { Message } from "../../../types/message";

function formatMessageTime(sentAt: number | undefined, locale: string) {
  if (sentAt == null) return "";
  try {
    return new Date(sentAt).toLocaleTimeString(locale === "vi" ? "vi-VN" : "en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

type VoiceLiveTranscriptProps = {
  messages: Message[];
  sessionId: string;
  isLoading: boolean;
};

/** Transcript column — console mock: tertiary-fixed AI bubbles, white user, secondary badge */
export function VoiceLiveTranscript({ messages, sessionId, isLoading }: VoiceLiveTranscriptProps) {
  const { t, lang } = useLanguage();
  const bottomRef = useRef<HTMLDivElement>(null);
  const locale = lang === "vi" ? "vi" : "en";
  const aiAvatarSrc = "/logo.jpg";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div
      id="voice-live-transcript"
      className="flex h-full min-h-0 min-w-0 w-full flex-1 flex-col border-l border-outline-variant/15 bg-surface-container-low"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/15 bg-white/50 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className="font-headline text-base font-bold text-on-surface">{t("voice.liveTranscriptTitle")}</h2>
          <span className="rounded bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-on-secondary-container">
            {t("voice.realtimeBadge")}
          </span>
        </div>
        <ChatInterviewActions messages={messages} sessionId={sessionId} />
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-6">
        {messages.length === 0 && !isLoading && (
          <p className="rounded-xl border border-dashed border-outline-variant/25 bg-white/60 px-4 py-10 text-center text-sm text-on-surface-variant">
            {t("voice.transcriptEmpty")}
          </p>
        )}

        {messages.map((msg) => {
          const timeStr = formatMessageTime(msg.sentAt, locale);
          const isAi = msg.sender === "ai";

          if (isAi) {
            return (
              <div key={msg.id} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container shadow-sm">
                  <img src={aiAvatarSrc} alt="INTERVIA" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-tertiary">{t("interview.curatorAi")}</span>
                    {timeStr ? <span className="text-[10px] text-on-surface-variant">{timeStr}</span> : null}
                  </div>
                  <div className="rounded-xl rounded-tl-none bg-tertiary-fixed p-4 text-sm font-medium leading-relaxed text-on-tertiary-fixed shadow-sm">
                    <div className="prose prose-sm max-w-none text-on-tertiary-fixed prose-p:my-1 prose-p:leading-relaxed">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className="flex items-start gap-3 justify-end">
              <div className="min-w-0 flex-1 space-y-2 text-right">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {timeStr ? <span className="text-[10px] text-on-surface-variant">{timeStr}</span> : null}
                  <span className="text-[10px] font-bold uppercase text-primary">{t("chat.you")}</span>
                </div>
                <div className="rounded-xl rounded-tr-none border border-outline-variant/15 bg-white p-4 text-sm leading-relaxed text-on-surface shadow-sm text-left">
                  {msg.text}
                </div>
              </div>
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary shadow-sm">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container shadow-sm">
              <img src={aiAvatarSrc} alt="INTERVIA" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-tertiary">{t("interview.curatorAi")}</span>
                <span className="text-[10px] italic text-on-surface-variant">{t("voice.transcribing")}</span>
              </div>
              <div className="rounded-xl rounded-tl-none bg-tertiary-fixed/60 p-4 text-sm text-on-tertiary-fixed">
                <span className="opacity-80">…</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
