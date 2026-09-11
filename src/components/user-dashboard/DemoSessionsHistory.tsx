"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";

export type DemoSession = {
  roomId: string;
  topic: string;
  startedAt: string;
  mode?: "video" | "voice" | "chat";
};

const STORAGE_KEY = "demo.sessions";
const PAGE_SIZE_FULL = 4;
const PREVIEW_MAX = 4;

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function initialsFromTopic(topic: string) {
  const parts = topic.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return topic.slice(0, 2).toUpperCase() || "?";
}

function modeMeta(mode: DemoSession["mode"], t: (key: string) => string) {
  if (mode === "voice") {
    return {
      icon: "mic",
      label: t("admin.home.mode.voiceCall"),
    };
  }
  if (mode === "chat") {
    return {
      icon: "chat_bubble",
      label: t("userDash.table.modeChat"),
    };
  }
  return {
    icon: "videocam",
    label: t("admin.home.mode.videoCall"),
  };
}

type DemoSessionsHistoryProps = {
  /** Full table with pagination and room links — for `/interview/select`. */
  variant: "full" | "preview";
};

export function DemoSessionsHistory({ variant }: DemoSessionsHistoryProps) {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<DemoSession[]>([]);
  const [page, setPage] = useState(1);

  const loadFromStorage = useCallback(() => {
    setSessions(safeJsonParse<DemoSession[]>(localStorage.getItem(STORAGE_KEY)) ?? []);
  }, []);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    function onFocus() {
      loadFromStorage();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadFromStorage]);

  const totalPages = Math.max(1, Math.ceil(sessions.length / PAGE_SIZE_FULL));
  const pageSafe = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const rows = useMemo(() => {
    if (variant === "preview") {
      return sessions.slice(0, PREVIEW_MAX);
    }
    return sessions.slice((pageSafe - 1) * PAGE_SIZE_FULL, pageSafe * PAGE_SIZE_FULL);
  }, [sessions, variant, pageSafe]);

  const interactive = variant === "full";

  return (
    <section
      className={`mb-16 ${variant === "full" ? "border-t-2 border-[#234196] pt-10" : ""}`}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <h3 className="font-headline text-3xl font-semibold text-[#234196]">{t("userDash.history.title")}</h3>
      </div>

      <div className="overflow-x-auto rounded-2xl border-2 border-[#234196] bg-white shadow-[3px_3px_0_#234196]">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-[#234196] bg-[#F0F4FC] font-metadata text-[9px] font-bold uppercase tracking-[0.16em] text-[#234196]">
              <th className="px-6 py-4 md:px-8 md:py-5">{t("userDash.table.candidateDate")}</th>
              <th className="px-6 py-4 md:px-8 md:py-5">{t("userDash.table.mode")}</th>
              <th className="px-6 py-4 text-center md:px-8 md:py-5">{t("userDash.table.score")}</th>
              <th className="px-6 py-4 text-right md:px-8 md:py-5">{t("userDash.table.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-[#234196]/15 bg-white">
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-[#5A6B8F] md:px-8">
                  {t("dashboard.empty")}
                </td>
              </tr>
            ) : (
              rows.map((s) => (
                <tr key={s.roomId} className="transition-colors hover:bg-[#FEF9EE]">
                  <td className="px-6 py-5 md:px-8 md:py-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#234196] bg-[#FCB625] text-sm font-bold text-[#234196]">
                        {initialsFromTopic(s.topic)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#234196]">{s.topic}</p>
                        <p className="text-xs text-[#5A6B8F]">
                          {new Date(s.startedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 md:px-8 md:py-6">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#5A6B8F]">
                      {(() => {
                        const meta = modeMeta(s.mode, t);
                        return (
                          <>
                            <span className="material-symbols-outlined select-none text-lg leading-none text-[#234196]" aria-hidden="true">{meta.icon}</span>
                            {meta.label}
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-5 md:px-8 md:py-6">
                    <div className="flex items-center justify-center">
                      <span className="rounded-md bg-[#F0F4FC] px-3 py-1 text-xs font-bold text-[#5A6B8F]">
                        —
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right md:px-8 md:py-6">
                    {interactive ? (
                      <Link
                        href={`/interview/room/${s.roomId}`}
                        className="inline-flex min-h-11 items-center rounded-lg px-4 py-2 text-sm font-bold text-[#234196] underline decoration-[#FCB625] decoration-4 underline-offset-4 hover:bg-[#F0F4FC]"
                      >
                        {t("userDash.table.viewSummary")}
                      </Link>
                    ) : (
                      <span className="text-sm text-on-surface-variant/70">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {interactive && sessions.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-medium text-[#5A6B8F]">
            {Math.min((pageSafe - 1) * PAGE_SIZE_FULL + 1, sessions.length)}–
            {Math.min(pageSafe * PAGE_SIZE_FULL, sessions.length)} / {sessions.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pageSafe <= 1}
              className="chunky-secondary min-h-11 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("userDash.jobProfiles.pagePrev")}
            </button>
            <span className="min-w-[5rem] text-center text-sm font-bold text-[#234196]">
              {t("userDash.history.pageLabel")
                .replace("{n}", String(pageSafe))
                .replace("{total}", String(totalPages))}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={pageSafe >= totalPages}
              className="chunky-secondary min-h-11 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("userDash.jobProfiles.pageNext")}
            </button>
          </div>
        </div>
      ) : null}

      {!interactive && sessions.length > PREVIEW_MAX ? (
        <p className="mt-3 text-xs text-[#5A6B8F]">
          {t("userDash.history.previewTruncated").replace("{n}", String(PREVIEW_MAX))}
        </p>
      ) : null}
    </section>
  );
}
