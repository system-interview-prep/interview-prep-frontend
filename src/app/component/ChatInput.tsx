"use client";

import React from "react";
import { useLanguage } from "../../i18n/LanguageProvider";

export function ChatInput({
  input,
  setInput,
  onSend,
  voiceListening = false,
  embedded = false,
}: {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  voiceListening?: boolean;
  embedded?: boolean;
}) {
  const { t } = useLanguage();

  const shell = embedded
    ? "px-4 sm:px-5 pt-2 pb-4 sm:pb-5 bg-transparent border-t border-outline-variant/15"
    : "p-6 sm:p-8 bg-surface-bright/50 backdrop-blur-md border-t border-outline-variant/10";

  return (
    <footer className={shell}>
      <div className="relative mx-auto w-full max-w-[1600px]">
        {voiceListening && (
          <div className="mb-3 flex items-center gap-3 bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/10 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-sm text-tertiary">mic</span>
            {t("chat.voiceListeningBanner")}
          </div>
        )}
        <form
          className="bg-surface-container-lowest border border-outline-variant/25 rounded-2xl shadow-sm p-1.5 flex items-end gap-2 sm:gap-3 focus-within:ring-2 focus-within:ring-primary/25 focus-within:border-primary/30 transition-all duration-300"
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
        >
          <textarea
            className="flex-1 bg-transparent border-none focus:ring-0 p-3 sm:p-4 min-h-[80px] sm:min-h-[96px] resize-none text-on-surface text-base leading-relaxed placeholder:text-on-surface-variant/45 outline-none"
            placeholder={t("chat.input.placeholder")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) onSend();
              }
            }}
            autoFocus
            aria-label={t("chat.input.placeholder")}
          />
          <div className="flex flex-col gap-1.5 p-1.5 pb-2">
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-11 h-11 sm:w-12 sm:h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center hover:bg-primary-container transition-all active:scale-90 disabled:opacity-40 disabled:pointer-events-none group/btn shadow-md"
              aria-label={t("interview.pressEnterToSend")}
            >
              <span className="material-symbols-outlined text-[26px] sm:text-[28px] group-hover/btn:translate-x-0.5 transition-transform">
                send
              </span>
            </button>
          </div>
        </form>
      </div>
    </footer>
  );
}
