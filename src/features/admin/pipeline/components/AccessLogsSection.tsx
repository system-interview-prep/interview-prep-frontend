"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminSection from "@features/admin/components/primitives/AdminSection";
import { usePolledResource } from "../hooks/usePolledResource";
import { pipelineService, type AccessLog } from "../services/pipeline.service";
import { fill, tr } from "../utils/pipelineFormat";
import { Muted, TableShell, Th } from "./ui";

const PAGE = 25;
const KINDS = ["all", "reads", "changes"] as const;
type Kind = (typeof KINDS)[number];

const USER_ACTIONS = new Set(["VIEW_USER_ACTIVITY", "CREATE_USER", "CHANGE_ROLES", "SET_USER_STATUS"]);
const JD_ACTIONS = new Set(["PUBLISH_JD", "EDIT_JD"]);

type Translate = (key: string) => string;

function dateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** Where the object of an action lives in the admin, if it has a page. */
export function targetHref(log: Pick<AccessLog, "action" | "sessionId" | "targetId">): string | null {
  if (log.sessionId) return `/admin/interviews/${encodeURIComponent(log.sessionId)}`;
  if (!log.targetId) return null;
  const id = encodeURIComponent(log.targetId);
  if (USER_ACTIONS.has(log.action)) return `/admin/users/${id}`;
  if (JD_ACTIONS.has(log.action)) return `/admin/job-descriptions/${id}`;
  if (log.action === "REPARSE_CV") return `/admin/cv-parsing/${id}`;
  if (log.action.includes("TAXONOMY")) return "/admin/taxonomy";
  return null;
}

/** The detail of a change in a few words: review decision, roles, published version… */
export function detailText(detail: Record<string, unknown> | null | undefined, t: Translate): string {
  if (!detail) return "";
  const parts: string[] = [];
  for (const [key, value] of Object.entries(detail)) {
    if (value === null || value === undefined || value === "") continue;
    const shown = Array.isArray(value)
      ? value.map((v) => tr(t, `aiPipeline.access.value.${String(v)}`, String(v))).join(", ")
      : typeof value === "boolean"
        ? t(value ? "adminOps.config.on" : "adminOps.config.off")
        : tr(t, `aiPipeline.access.value.${String(value)}`, String(value));
    parts.push(`${tr(t, `aiPipeline.access.detail.${key}`, key)}: ${shown}`);
  }
  return parts.join(" · ");
}

/** Every admin read of candidate data and every change made in the admin, newest first (admin_access_logs). */
export default function AccessLogsSection() {
  const { t } = useLanguage();
  const [offset, setOffset] = useState(0);
  const [kind, setKind] = useState<Kind>("all");
  const { state } = usePolledResource(() => pipelineService.accessLogs(PAGE, offset, kind), () => null, [offset, kind]);

  const chips = (
    <div className="mb-4 flex flex-wrap gap-2">
      {KINDS.map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={kind === value}
          onClick={() => {
            setKind(value);
            setOffset(0);
          }}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
            kind === value ? "bg-[#204195] text-white" : "border border-[#DCE4F3] bg-white text-[#607096] hover:text-[#204195]"
          }`}
        >
          {t(`aiPipeline.access.kind.${value}`)}
        </button>
      ))}
    </div>
  );

  let body;
  if (state.status === "loading") {
    body = <div className="h-24 animate-pulse rounded-xl bg-[#F1F5F9] motion-reduce:animate-none" role="status" />;
  } else if (state.status === "error") {
    body = <Muted>{t(state.httpStatus === 503 ? "aiPipeline.access.notMigrated" : "aiPipeline.access.error")}</Muted>;
  } else if (!state.data.logs.length) {
    body = <Muted>{t("aiPipeline.access.empty")}</Muted>;
  } else {
    const { logs, total } = state.data;
    body = (
      <>
        <TableShell minWidth={760}>
          <thead>
            <tr>
              <Th>{t("aiPipeline.access.at")}</Th>
              <Th>{t("aiPipeline.access.admin")}</Th>
              <Th>{t("aiPipeline.access.action")}</Th>
              <Th>{t("aiPipeline.access.target")}</Th>
              <Th>{t("aiPipeline.access.detailCol")}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAEFF8]">
            {logs.map((log) => {
              const href = targetHref(log);
              const label = log.candidate ?? (log.sessionId ? log.sessionId.slice(0, 8) : log.targetId ? log.targetId.slice(0, 12) : "—");
              return (
                <tr key={log.id}>
                  <td className="py-2 pr-4 tabular-nums text-[#475569]">{dateTime(log.at)}</td>
                  <td className="py-2 pr-4 text-[#14244B]">{log.adminEmail ?? "—"}</td>
                  <td className="py-2 pr-4 text-[#14244B]">{tr(t, `aiPipeline.access.action.${log.action}`, log.action)}</td>
                  <td className="py-2 pr-4">
                    {href ? (
                      <Link href={href} className="font-semibold text-[#204195] hover:underline">
                        {label}
                      </Link>
                    ) : (
                      <span className="text-[#14244B]">{label}</span>
                    )}
                    {log.candidate && log.sessionId ? (
                      <span className="block font-mono text-[10px] text-[#8A98B8]">{log.sessionId.slice(0, 8)}</span>
                    ) : null}
                  </td>
                  <td className="py-2 text-xs text-[#607096]">{detailText(log.detail, t) || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
        {total > PAGE ? (
          <div className="mt-3 flex items-center justify-end gap-2 text-xs">
            <span className="tabular-nums text-[#607096]">
              {fill(t("aiPipeline.calls.range"), { from: offset + 1, to: Math.min(offset + PAGE, total), total })}
            </span>
            <button
              type="button"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE))}
              className="rounded-full border border-[#DCE4F3] px-3 py-1 font-semibold text-[#14244B] disabled:opacity-40"
            >
              {t("aiPipeline.calls.prev")}
            </button>
            <button
              type="button"
              disabled={offset + PAGE >= total}
              onClick={() => setOffset(offset + PAGE)}
              className="rounded-full border border-[#DCE4F3] px-3 py-1 font-semibold text-[#14244B] disabled:opacity-40"
            >
              {t("aiPipeline.calls.next")}
            </button>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <AdminSection title={t("aiPipeline.access.title")} description={t("aiPipeline.access.subtitle")}>
      {chips}
      {body}
    </AdminSection>
  );
}
