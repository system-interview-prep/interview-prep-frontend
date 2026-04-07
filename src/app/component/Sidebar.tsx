"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { useLanguage } from "../../i18n/LanguageProvider";
import type { ChatSessionListItem } from "../../hooks/useChat";
import { ChatInterviewBrand } from "./ChatInterviewBrand";
import { formatRelativeTime } from "../../utils/chatSessionMeta";

type SidebarProps = {
  sessionListItems: ChatSessionListItem[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  sidebarWidth: number;
  onResizeStart: (event: React.PointerEvent<HTMLElement>) => void;
};

function sessionTitle(t: (key: string) => string, index: number) {
  return t("chatInterview.sessionNumber").replace("{n}", String(index + 1));
}

export function Sidebar({
  sessionListItems,
  currentSessionId,
  onSelectSession,
  onNewSession,
  sidebarWidth,
  onResizeStart,
}: SidebarProps) {
  const { t, lang } = useLanguage();
  const pathname = usePathname();

  const isChat = pathname === "/chat" || pathname.startsWith("/chat");
  const isVoice = pathname.startsWith("/voice");

  return (
    <aside
      className="bg-[#f9fafb] dark:bg-slate-800/50 h-screen fixed left-0 top-0 z-40 hidden md:flex flex-col font-body text-sm font-medium border-r border-outline-variant/20"
      style={{ width: `${sidebarWidth}px` }}
    >
      <button
        type="button"
        onPointerDown={onResizeStart}
        aria-label="Resize sidebar"
        title="Resize sidebar"
        className="absolute right-0 top-0 h-full w-3 translate-x-1/2 cursor-col-resize touch-none border-0 bg-transparent p-0 outline-none"
      >
        <span className="absolute inset-y-4 left-1/2 w-px -translate-x-1/2 rounded-full bg-primary/20 transition-colors hover:bg-primary/50" />
      </button>
      <div className="flex flex-col h-full min-h-0 p-4 sm:p-5">
        <Link
          href="/dashboard"
          title={t("chatInterview.goWorkspace")}
          className="mb-4 block w-full min-w-0 shrink-0 rounded-xl p-1 -m-1 transition-all hover:bg-surface-container-high/80 hover:ring-2 hover:ring-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ChatInterviewBrand density="sidebar" />
        </Link>

        <button
          type="button"
          onClick={onNewSession}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-2 bg-primary text-on-primary rounded-xl text-sm font-semibold shadow-sm hover:bg-primary-container transition-all active:scale-[0.98] shrink-0 mb-4"
        >
          <span className="material-symbols-outlined shrink-0 text-sm">add</span>
          <span className="min-w-0 text-center leading-snug whitespace-normal">
            {t("chat.newSessionSidebar")}
          </span>
        </button>

        <div className="shrink-0 space-y-1.5 mb-4">
          <Link
            href="/chat"
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
              isChat
                ? "bg-surface-container-lowest dark:bg-slate-700 text-primary font-semibold shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            <span className="material-symbols-outlined shrink-0 text-[20px]">chat</span>
            <span className="min-w-0 leading-snug">{t("chatInterview.mode.chatShort")}</span>
          </Link>
          <Link
            href="/voice"
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
              isVoice
                ? "bg-surface-container-lowest dark:bg-slate-700 text-primary font-semibold shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            <span className="material-symbols-outlined shrink-0 text-[20px]">mic</span>
            <span className="min-w-0 leading-snug">{t("chatInterview.mode.voiceShort")}</span>
          </Link>
        </div>

        <div className="flex flex-col flex-1 min-h-0 border-t border-outline-variant/25 pt-3">
          <p className="text-[10px] font-semibold text-on-surface-variant px-0.5 mb-2 shrink-0">{t("chat.history")}</p>
          <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 pr-0.5 -mr-0.5">
            {sessionListItems.length === 0 && (
              <div className="px-1 text-[11px] text-on-surface-variant/90 italic leading-relaxed">{t("chat.noHistoryYet")}</div>
            )}
            {sessionListItems.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSession(item.id)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-[11px] transition-all border border-transparent ${
                  item.id === currentSessionId
                    ? "bg-primary/10 text-primary font-semibold ring-1 ring-primary/20 border-primary/10"
                    : "text-on-surface-variant hover:bg-surface-container-highest hover:border-outline-variant/30"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="font-semibold leading-tight truncate">{sessionTitle(t, index)}</span>
                  {item.updatedAt > 0 && (
                    <span className="text-[9px] opacity-75 shrink-0 font-mono">
                      {formatRelativeTime(item.updatedAt, lang === "vi" ? "vi" : "en")}
                    </span>
                  )}
                </div>
                {item.preview ? (
                  <p className="text-[10px] leading-snug line-clamp-2 opacity-90">{item.preview}</p>
                ) : (
                  <p className="text-[10px] opacity-60 italic">{t("chatInterview.historyEmptyPreview")}</p>
                )}
                {item.messageCount > 0 && (
                  <p className="text-[9px] mt-1 opacity-70">
                    {t("chatInterview.msgCount").replace("{n}", String(item.messageCount))}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="shrink-0 mt-3 pt-3 border-t border-outline-variant/25">
          <Link
            href="/logout"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-on-surface-variant hover:bg-error-container/15 hover:text-error text-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>{t("userDash.nav.logout")}</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
