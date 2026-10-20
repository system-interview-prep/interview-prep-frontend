"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminSection from "@features/admin/components/primitives/AdminSection";
import { usePolledResource } from "../hooks/usePolledResource";
import { pipelineService } from "../services/pipeline.service";
import { fill, tr } from "../utils/pipelineFormat";
import { Muted, TableShell, Th } from "./ui";

const PAGE = 25;

function dateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** Who read a candidate's answers in the pipeline view, newest first (admin_access_logs). */
export default function AccessLogsSection() {
  const { t } = useLanguage();
  const [offset, setOffset] = useState(0);
  const { state } = usePolledResource(() => pipelineService.accessLogs(PAGE, offset), () => null, [offset]);

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
        <TableShell minWidth={640}>
          <thead>
            <tr>
              <Th>{t("aiPipeline.access.at")}</Th>
              <Th>{t("aiPipeline.access.admin")}</Th>
              <Th>{t("aiPipeline.access.action")}</Th>
              <Th>{t("aiPipeline.access.candidate")}</Th>
              <Th>{t("aiPipeline.access.session")}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAEFF8]">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="py-2 pr-4 tabular-nums text-[#475569]">{dateTime(log.at)}</td>
                <td className="py-2 pr-4 text-[#14244B]">{log.adminEmail ?? "—"}</td>
                <td className="py-2 pr-4 text-[#14244B]">{tr(t, `aiPipeline.access.action.${log.action}`, log.action)}</td>
                <td className="py-2 pr-4 text-[#14244B]">{log.candidate ?? "—"}</td>
                <td className="py-2">
                  {log.sessionId ? (
                    <Link
                      href={`/admin/interviews/${encodeURIComponent(log.sessionId)}`}
                      className="font-semibold text-[#204195] hover:underline"
                    >
                      {log.sessionId.slice(0, 8)}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
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
      {body}
    </AdminSection>
  );
}
