"use client";

import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import type { PipelineEvent } from "../services/pipeline.service";
import { EVENT_TONE, clock, eventDetail, eventLabel, fill, formatMs, tr } from "../utils/pipelineFormat";
import { Muted, TableShell, Th, usePagedRows } from "./ui";

/** The raw event log, newest first, with a "problems only" filter. */
export default function PipelineEvents({ events, truncated }: { events: PipelineEvent[]; truncated: boolean }) {
  const { t } = useLanguage();
  const [problems, setProblems] = useState(false);
  const all = events.filter((event) => !problems || event.status === "error" || event.status === "warning").reverse();
  const { rows, pager } = usePagedRows(all, 25);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("aiPipeline.events.title")}>
        {[false, true].map((value) => (
          <button
            key={String(value)}
            type="button"
            aria-pressed={problems === value}
            onClick={() => setProblems(value)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              problems === value
                ? "bg-[#204195] text-white"
                : "border border-[#DCE4F3] bg-white text-[#607096] hover:text-[#204195]"
            }`}
          >
            {t(value ? "aiPipeline.events.filter.problems" : "aiPipeline.events.filter.all")}
          </button>
        ))}
        {truncated ? <span className="text-xs text-[#8A98B8]">{t("aiPipeline.events.truncated")}</span> : null}
      </div>
      {rows.length ? (
        <TableShell minWidth={720}>
          <thead>
            <tr>
              <Th>{t("aiPipeline.ai.at")}</Th>
              <Th>{t("aiPipeline.health.step")}</Th>
              <Th>{t("aiPipeline.health.event")}</Th>
              <Th align="right">{t("aiPipeline.ai.time")}</Th>
              <Th>{t("aiPipeline.calls.detail")}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAEFF8] text-xs">
            {rows.map((event, index) => (
              <tr key={`${event.id}-${index}`}>
                <td className="py-2 pr-4 tabular-nums text-[#607096]">{clock(event.at)}</td>
                <td className="py-2 pr-4 text-[#475569]">
                  {tr(t, `aiPipeline.stage.${event.stage === "session" ? "created" : event.stage}`, event.stage)}
                  {event.turnIndex != null ? (
                    <span className="block text-[#8A98B8]">{fill(t("aiPipeline.turn.question"), { n: event.turnIndex + 1 })}</span>
                  ) : null}
                </td>
                <td className="py-2 pr-4">
                  <AdminStatusBadge status={EVENT_TONE[event.status]} label={eventLabel(event.event, t)} size="sm" />
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">{formatMs(event.durationMs)}</td>
                <td className="py-2 break-all text-[#475569]">{eventDetail(event, t)}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      ) : (
        <Muted>{t("aiPipeline.noEvents")}</Muted>
      )}
      {pager}
    </div>
  );
}
