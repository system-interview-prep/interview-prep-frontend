"use client";

import Link from "next/link";
import React, { useEffect } from "react";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useChat } from "../../hooks/useChat";
import { ChatHeader } from "../component/ChatHeader";
import { ChatInterviewActions } from "../component/ChatInterviewActions";
import { ChatMessages } from "../component/ChatMessages";
import { ChatInput } from "../component/ChatInput";

export default function ChatPage() {
  const { t, lang } = useLanguage();
  const {
    messages,
    sessionId,
    language,
    isLoading,
    error,
    setLanguage,
    sendMessage,
  } = useChat({ defaultMode: "chat" });

  const [input, setInput] = React.useState("");

  useEffect(() => {
    setLanguage(lang === "vi" ? "vietnamese" : "english");
  }, [lang, setLanguage]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const currentInput = input;
    setInput("");
    await sendMessage(currentInput);
  };

  return (
    <div
      className="flex h-screen bg-surface font-body text-on-surface overflow-hidden"
    >
      <main className="flex-1 flex flex-col h-full min-w-0 bg-gradient-to-br from-primary/[0.06] via-surface to-tertiary/[0.05] pb-24 md:pb-0">
        <ChatHeader sessionId={sessionId} />

        <div className="flex min-h-0 flex-1 flex-col px-2 py-3 sm:px-4 sm:py-4">
          <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/95 shadow-[0_16px_56px_-20px_rgba(0,61,155,0.22)] backdrop-blur-[2px] sm:rounded-3xl">
            <div className="shrink-0 flex flex-wrap items-center gap-2 px-3 sm:px-5 py-2.5 border-b border-outline-variant/20 bg-gradient-to-r from-primary/10 via-surface-container-low/80 to-tertiary/10">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border border-emerald-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  {t("chatInterview.liveBadge")}
                </span>
                <span className="text-[11px] sm:text-xs text-on-surface-variant truncate font-mono max-w-[140px] sm:max-w-none">
                  {sessionId ? `${sessionId.slice(0, 10)}…${sessionId.slice(-4)}` : "—"}
                </span>
              </div>
              <ChatInterviewActions messages={messages} sessionId={sessionId} />
            </div>

            {error && (
              <div
                className="shrink-0 mx-3 sm:mx-4 mt-3 px-3 py-2.5 rounded-xl bg-error-container/90 text-on-error-container text-sm border border-error/25 flex flex-wrap items-center justify-between gap-2"
                role="alert"
              >
                <span className="min-w-0 flex-1">{t(error)}</span>
              </div>
            )}

            <section className="flex-1 overflow-y-auto min-h-[min(45vh,380px)] px-2 sm:px-4 py-3 sm:py-5">
              <ChatMessages messages={messages} isLoading={isLoading} hideEmpty={Boolean(error)} />
            </section>

            <ChatInput embedded input={input} setInput={setInput} onSend={handleSend} voiceListening={false} />
          </div>
        </div>
      </main>

      <nav
        className="bg-primary/95 backdrop-blur-xl fixed bottom-5 left-1/2 -translate-x-1/2 rounded-full px-6 py-2 w-fit min-w-[160px] flex items-center justify-center gap-8 z-50 shadow-lg border border-white/10 md:hidden"
        aria-label={t("chatInterview.navSection")}
      >
        <Link
          href="/voice"
          className="text-on-primary/95 hover:text-on-primary p-2 rounded-full hover:bg-white/10 transition-transform active:scale-95"
          aria-label={t("chatInterview.nav.voiceInterview")}
        >
          <span className="material-symbols-outlined text-[22px]">mic</span>
        </Link>
      </nav>
    </div>
  );
}
