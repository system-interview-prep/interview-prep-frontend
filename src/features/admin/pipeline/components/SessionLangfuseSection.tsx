"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminSection from "@features/admin/components/primitives/AdminSection";
import { langfuseService, scoreValueText, type LangfuseOff, type LangfuseSession } from "@features/admin/services/langfuse.service";
import { Muted } from "./ui";
import TurnAiPanel from "./TurnAiPanel";
import { clock, fill, tr } from "../utils/pipelineFormat";

/**
 * The interview as Langfuse sees it: every trace (turns and grading) with its
 * model calls and tokens, the session scores, and each trace openable here
 * (TurnAiPanel) or in Langfuse.
 */
export default function SessionLangfuseSection({ sessionId, projectUrl }: { sessionId: string; projectUrl?: string | null }) {
  const { t } = useLanguage();
  const [state, setState] = useState<{ status: "loading" } | { status: "error" } | { status: "ready"; data: LangfuseSession | LangfuseOff }>({
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;
    langfuseService
      .session(sessionId)
      .then((data) => !cancelled && setState({ status: "ready", data }))
      .catch(() => !cancelled && setState({ status: "error" }));
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  let body;
  if (state.status === "loading") body = <Muted>{t("langfuseUi.loading")}</Muted>;
  else if (state.status === "error") body = <Muted>{t("langfuseUi.error")}</Muted>;
  else if (!state.data.connected) body = <Muted>{tr(t, `langfuseUi.off.${state.data.reason}`, t("langfuseUi.error"))}</Muted>;
  else if (state.data.traces.length === 0) body = <Muted>{t("langfuseUi.session.empty")}</Muted>;
  else {
    const data = state.data;
    body = (
      <div className="space-y-3">
        {data.scores.length ? (
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {data.scores.map((score, i) => (
              <span key={`${score.name}-${i}`} className="rounded-full border border-[#DCE4F3] bg-white px-2 py-0.5 font-semibold text-[#475569]">
                {tr(t, `langfuseUi.sessionScore.${score.name}`, score.name)}: <span className="tabular-nums">{scoreValueText(score)}</span>
              </span>
            ))}
          </div>
        ) : null}
        <ol className="space-y-2">
          {data.traces.map((trace) => (
            <li key={trace.traceId} className="rounded-lg border border-[#EAEFF8] bg-[#FBFCFE] p-3 text-xs">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="font-semibold text-[#14244B]">{tr(t, `langfuseUi.step.${trace.name}`, trace.name ?? "—")}</span>
                <span className="tabular-nums text-[#8A98B8]">{clock(trace.startTime)}</span>
                <span className="tabular-nums text-[#607096]">
                  {fill(t("langfuseUi.session.trace"), { calls: trace.calls, tokens: trace.tokens.toLocaleString("vi-VN") })}
                </span>
                {trace.warnings ? <span className="font-semibold text-[#C43B3B]">{fill(t("langfuseUi.session.warnings"), { n: trace.warnings })}</span> : null}
              </div>
              <TurnAiPanel traceId={trace.traceId} traceUrl={projectUrl ? `${projectUrl}/traces/${encodeURIComponent(trace.traceId)}` : null} />
            </li>
          ))}
        </ol>
      </div>
    );
  }

  const sessionUrl = state.status === "ready" && state.data.connected ? state.data.sessionUrl : null;
  return (
    <AdminSection
      title={t("langfuseUi.session.title")}
      description={t("langfuseUi.session.note")}
      action={
        sessionUrl ? (
          <a href={sessionUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#204195] hover:underline">
            {t("langfuseUi.session.open")}
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        ) : undefined
      }
    >
      {body}
    </AdminSection>
  );
}
