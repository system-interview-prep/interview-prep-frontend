import type { Message } from "../types/message";

export type SessionMeta = {
  preview: string;
  updatedAt: number;
  messageCount: number;
};

const STORAGE_KEY = "curator.chatInterview.sessionsMeta.v1";

function safeParse(raw: string | null): Record<string, SessionMeta> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as Record<string, SessionMeta>;
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

export function readAllSessionMeta(): Record<string, SessionMeta> {
  if (typeof window === "undefined") return {};
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function writeAllSessionMeta(meta: Record<string, SessionMeta>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
  } catch {
    /* quota */
  }
}

export function patchSessionMeta(sessionId: string, patch: Partial<SessionMeta>): void {
  if (!sessionId) return;
  const all = readAllSessionMeta();
  const prev = all[sessionId] ?? {
    preview: "",
    updatedAt: Date.now(),
    messageCount: 0,
  };
  all[sessionId] = { ...prev, ...patch };
  writeAllSessionMeta(all);
}

export function syncMetaFromMessages(sessionId: string, messages: Message[]): void {
  if (!sessionId || messages.length === 0) return;
  const last = messages[messages.length - 1];
  const previewSource = last?.text ?? "";
  const preview =
    previewSource.length > 90 ? `${previewSource.slice(0, 87).trim()}…` : previewSource.trim() || "—";
  patchSessionMeta(sessionId, {
    preview,
    updatedAt: last?.sentAt ?? Date.now(),
    messageCount: messages.length,
  });
}

export function formatRelativeTime(updatedAt: number, locale: string): string {
  const now = Date.now();
  const diffSec = Math.round((now - updatedAt) / 1000);
  if (diffSec < 60) return locale === "vi" ? "Vừa xong" : "Just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return locale === "vi" ? `${diffMin} phút trước` : `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return locale === "vi" ? `${diffHr} giờ trước` : `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return locale === "vi" ? `${diffDay} ngày trước` : `${diffDay}d ago`;
  try {
    return new Date(updatedAt).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

export function buildTranscriptText(messages: Message[], opts: { aiLabel: string; youLabel: string }): string {
  return messages
    .map((m) => {
      const who = m.sender === "ai" ? opts.aiLabel : opts.youLabel;
      return `${who}: ${m.text}`;
    })
    .join("\n\n");
}
