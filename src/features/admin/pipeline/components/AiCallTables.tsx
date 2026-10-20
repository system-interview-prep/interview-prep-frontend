"use client";

import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { AiCall, AiCallSummary } from "../services/pipeline.service";
import { clock, compactNumber, formatMs, purposeLabel } from "../utils/pipelineFormat";
import { Chip, Fact, Muted, TableShell, Th, usePagedRows } from "./ui";

export function AiSummaryFacts({ summary }: { summary: AiCallSummary }) {
  const { t } = useLanguage();
  return (
    <dl className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <Fact label={t("aiPipeline.ai.calls")}>
        <span className="tabular-nums">{summary.total}</span>
      </Fact>
      <Fact label={t("aiPipeline.ai.errors")}>
        <span className={`tabular-nums ${summary.errors ? "text-[#C43B3B]" : ""}`}>{summary.errors}</span>
      </Fact>
      <Fact label={t("aiPipeline.ai.p50")}>{formatMs(summary.p50Ms)}</Fact>
      <Fact label={t("aiPipeline.ai.p95")}>{formatMs(summary.p95Ms)}</Fact>
      <Fact label={t("aiPipeline.ai.tokens")}>
        <span className="tabular-nums">
          {compactNumber(summary.inputTokens)} / {compactNumber(summary.outputTokens)}
        </span>
      </Fact>
    </dl>
  );
}

export function AiPurposeTable({ summary }: { summary: AiCallSummary }) {
  const { t } = useLanguage();
  const purposeRows = usePagedRows(summary.byPurpose, 10);
  if (!summary.byPurpose.length) return <Muted>{t("aiPipeline.ai.none")}</Muted>;
  return (
    <>
      <TableShell>
        <thead>
          <tr>
            <Th>{t("aiPipeline.ai.purpose")}</Th>
            <Th align="right">{t("aiPipeline.ai.calls")}</Th>
            <Th align="right">{t("aiPipeline.ai.errors")}</Th>
            <Th align="right">{t("aiPipeline.ai.p95")}</Th>
            <Th align="right">{t("aiPipeline.ai.tokens")}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EAEFF8]">
          {purposeRows.rows.map((row) => (
            <tr key={row.purpose}>
              <td className="py-2 pr-4">
                <span className="font-semibold text-[#14244B]">{purposeLabel(row.purpose, t)}</span>
                <span className="block font-mono text-[11px] text-[#8A98B8]">{row.purpose}</span>
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">{row.count}</td>
              <td className={`py-2 pr-4 text-right tabular-nums ${row.errors ? "text-[#C43B3B]" : ""}`}>{row.errors}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{formatMs(row.p95Ms)}</td>
              <td className="py-2 text-right tabular-nums">
                {compactNumber(row.inputTokens)} / {compactNumber(row.outputTokens)}
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>
      {purposeRows.pager}
    </>
  );
}

/** Model calls; more than `pageSize` are paged in the browser (the calls page pages on the server). */
export function AiCallTable({
  calls,
  showSession = false,
  pageSize = 20,
}: {
  calls: AiCall[];
  showSession?: boolean;
  pageSize?: number;
}) {
  const { t } = useLanguage();
  const callRows = usePagedRows(calls, pageSize);
  if (!calls.length) return <Muted>{t("aiPipeline.ai.none")}</Muted>;
  return (
    <>
      <TableShell minWidth={680}>
        <thead>
          <tr>
            <Th>{t("aiPipeline.ai.at")}</Th>
            <Th>{t("aiPipeline.ai.purpose")}</Th>
            <Th>{t("aiPipeline.ai.model")}</Th>
            <Th align="right">{t("aiPipeline.ai.time")}</Th>
            <Th align="right">{t("aiPipeline.ai.tokens")}</Th>
            <Th>{t("aiPipeline.ai.status")}</Th>
            {showSession ? <Th>{t("aiPipeline.calls.session")}</Th> : null}
            <Th align="right">{t("aiPipeline.calls.detail")}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EAEFF8]">
          {callRows.rows.map((call) => (
            <tr key={call.id ?? `${call.at}-${call.purpose}`} className={call.status === "error" ? "bg-[#FFF8F8]" : undefined}>
              <td className="py-2 pr-4 tabular-nums text-[#607096]">
                {call.at ? new Date(call.at).toLocaleDateString("vi-VN") : ""} {clock(call.at)}
              </td>
              <td className="py-2 pr-4">
                <span className="font-semibold text-[#14244B]">{purposeLabel(call.purpose, t)}</span>
              </td>
              <td className="py-2 pr-4 font-mono text-[11px] text-[#475569]">{call.model ?? "—"}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{formatMs(call.durationMs)}</td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {call.inputTokens != null ? `${compactNumber(call.inputTokens)} / ${compactNumber(call.outputTokens)}` : "—"}
              </td>
              <td className="py-2 pr-4">
                {call.status === "error" ? (
                  <Chip tone="bad">{call.errorType ?? t("aiPipeline.ai.error")}</Chip>
                ) : (
                  <Chip tone="good">{t("aiPipeline.ai.ok")}</Chip>
                )}
              </td>
              {showSession ? (
                <td className="py-2 pr-4 font-mono text-[11px]">
                  {call.sessionId ? (
                    <Link href={`/admin/interviews/${encodeURIComponent(call.sessionId)}`} className="text-[#204195] hover:underline">
                      {call.sessionId.slice(0, 8)}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              ) : null}
              <td className="py-2 text-right">
                {call.id != null ? (
                  <Link href={`/admin/ai/traces/${call.id}`} className="text-xs font-semibold text-[#204195] hover:underline">
                    {t("aiPipeline.calls.detail")}
                  </Link>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>
      {callRows.pager}
    </>
  );
}
