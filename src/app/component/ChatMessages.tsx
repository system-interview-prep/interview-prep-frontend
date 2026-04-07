"use client";

import React, { useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";
import { Message } from "../../types/message";
import { useAuthProfile } from "../../auth/useAuthProfile";

const AI_AVATAR = "/logo.jpg";
const DEFAULT_USER_AVATAR = "/default-avatar.svg";

function formatMessageTime(sentAt: number | undefined, locale: string) {
  if (sentAt == null) return null;
  try {
    return new Date(sentAt).toLocaleTimeString(locale === "vi" ? "vi-VN" : "en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

export function ChatMessages({
  messages,
  isLoading,
  hideEmpty,
  variant = "chat",
}: {
  messages: Message[];
  isLoading?: boolean;
  /** Hide the “interview starts here” panel (e.g. when showing a connection error instead) */
  hideEmpty?: boolean;
  /** Voice page uses alternate empty / loading copy */
  variant?: "chat" | "voice";
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t, lang } = useLanguage();
  const { playAudio, supportsVoice } = useAudioPlayer();
  const { profile, displayName } = useAuthProfile();
  const userAvatarSrc = profile?.picture?.trim() || DEFAULT_USER_AVATAR;
  const userAvatarAlt = displayName ? `${displayName} avatar` : t("chat.you");

  const onListen = useCallback(
    (m: Message) => {
      if (!m.audioBase64) return;
      playAudio(m.audioBase64, m.audioMimeType);
    },
    [playAudio]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const locale = lang === "vi" ? "vi" : "en";

  const showEmpty = messages.length === 0 && !isLoading && !hideEmpty;

  return (
    <div className="flex flex-col space-y-10 sm:space-y-12 w-full pb-2">
      {showEmpty && (
        <div className="flex flex-col items-center justify-center text-center px-4 py-10 sm:py-14 rounded-2xl border border-dashed border-primary/25 bg-primary/[0.04]">
          <div className="w-16 h-16 rounded-2xl ai-gradient-bg flex items-center justify-center text-on-primary shadow-lg mb-4">
            <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {variant === "voice" ? "mic" : "psychology"}
            </span>
          </div>
          <h2 className="font-headline font-bold text-lg text-on-surface max-w-md">
            {variant === "voice" ? t("voice.emptyTitle") : t("chatInterview.emptyTitle")}
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant max-w-md leading-relaxed">
            {variant === "voice" ? t("voice.emptyBody") : t("chatInterview.emptyBody")}
          </p>
        </div>
      )}

      {messages.map((msg) => {
        const timeStr = formatMessageTime(msg.sentAt, locale);

        if (msg.sender === "ai") {
          return (
            <div key={msg.id} className="flex gap-6 max-w-[85%]">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-outline-variant/20 bg-surface-container shadow-lg">
                  <img src={AI_AVATAR} alt="INTERVIA" className="h-full w-full object-cover" />
                </div>
              </div>
              <div className="space-y-3 pt-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-headline font-bold text-lg">{t("interview.curatorAi")}</span>
                  <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded uppercase tracking-widest">
                    {t("interview.interviewerPill")}
                  </span>
                </div>
                <div className="bg-surface-container-low p-6 rounded-tr-3xl rounded-br-3xl rounded-bl-3xl text-on-surface leading-relaxed text-lg border-l-4 border-primary/20">
                  <div className="prose prose-lg max-w-none prose-p:my-2 prose-headings:font-headline text-on-surface">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-on-surface-variant text-xs flex-wrap">
                  {timeStr && <span>{timeStr}</span>}
                  {supportsVoice && msg.audioBase64 && (
                    <button
                      type="button"
                      onClick={() => onListen(msg)}
                      className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">volume_up</span>
                      <span>{t("interview.listen")}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        }

        return (
          <div key={msg.id} className="flex flex-row-reverse gap-6 max-w-[85%] ml-auto">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-primary/10 bg-surface-container">
                <img
                  alt={userAvatarAlt}
                  className="w-full h-full object-cover"
                  src={userAvatarSrc}
                  width={48}
                  height={48}
                  onError={(event) => {
                    const target = event.currentTarget;
                    if (target.src !== window.location.origin + DEFAULT_USER_AVATAR) {
                      target.src = DEFAULT_USER_AVATAR;
                    }
                  }}
                />
              </div>
            </div>
            <div className="space-y-3 pt-1 text-right min-w-0">
              <div className="flex items-center justify-end gap-3 flex-wrap">
                <span className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant text-[10px] font-bold rounded uppercase tracking-widest">
                  {t("interview.candidatePill")}
                </span>
                <span className="font-headline font-bold text-lg">{t("chat.you")}</span>
              </div>
              <div className="bg-primary text-on-primary p-6 rounded-tl-3xl rounded-bl-3xl rounded-br-3xl leading-relaxed text-lg shadow-sm text-left">
                {msg.text}
              </div>
              {timeStr && (
                <span className="text-on-surface-variant text-xs block">
                  {timeStr} • {t("chat.delivered")}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className="flex gap-6 items-center">
          <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center">
            <div className="w-3 h-3 bg-tertiary rounded-full animate-pulse" />
          </div>
          <div className="text-on-surface-variant italic font-medium animate-pulse">
            {variant === "voice" ? t("voice.aiReplying") : t("chat.analyzing")}
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
