"use client";

import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminSection from "@features/admin/components/primitives/AdminSection";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";
import { usePolledResource } from "../hooks/usePolledResource";
import { pipelineService } from "../services/pipeline.service";
import { clock, compactNumber, fill, formatMs, purposeLabel } from "../utils/pipelineFormat";
import { Chip, Fact, Muted } from "./ui";

function TextBlock({ label, text, chars }: { label: string; text: string | null | undefined; chars: number | null }) {
  const { t } = useLanguage();
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#607096]">
        {label}
        {chars != null ? <span className="ml-2 normal-case tracking-normal">{fill(t("aiPipeline.calls.chars"), { n: chars })}</span> : null}
      </p>
      {text ? (
        <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#F8FAFC] p-3 text-xs leading-5 text-[#14244B]">
          {text}
        </pre>
      ) : null}
    </div>
  );
}

export default function AiCallDetailClient({ callId }: { callId: string }) {
  const { t } = useLanguage();
  const { state, refresh } = usePolledResource(() => pipelineService.call(callId), () => null, [callId]);
  const call = state.status === "ready" ? state.data : null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={fill(t("aiPipeline.calls.detailTitle"), { id: callId })}
        description={call ? purposeLabel(call.purpose, t) : undefined}
        breadcrumbs={[
          { label: "Quản trị", href: "/admin/dashboard" },
          { label: t("aiPipeline.calls.title"), href: "/admin/ai/traces" },
          { label: `#${callId}` },
        ]}
      />
      {state.status === "loading" ? (
        <div className="h-40 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none" />
      ) : !call ? (
        <AdminEmptyState
          variant={state.status === "error" && state.httpStatus === 404 ? "empty" : "error"}
          title={t(
            state.status === "error" && state.httpStatus === 404
              ? "aiPipeline.calls.notFound"
              : state.status === "error" && state.httpStatus === 503
                ? "aiPipeline.notMigrated"
                : "aiPipeline.loadError",
          )}
          description=""
          onRetry={() => void refresh()}
        />
      ) : (
        <>
          <AdminSection title={purposeLabel(call.purpose, t)} description={call.purpose ?? undefined}>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Fact label={t("aiPipeline.ai.status")}>
                {call.status === "error" ? <Chip tone="bad">{call.errorType ?? t("aiPipeline.ai.error")}</Chip> : <Chip tone="good">{t("aiPipeline.ai.ok")}</Chip>}
              </Fact>
              <Fact label={t("aiPipeline.ai.time")}>{formatMs(call.durationMs)}</Fact>
              <Fact label={t("aiPipeline.ai.tokens")}>
                <span className="tabular-nums">
                  {compactNumber(call.inputTokens)} / {compactNumber(call.outputTokens)}
                </span>
              </Fact>
              <Fact label={t("aiPipeline.ai.at")}>
                {call.at ? new Date(call.at).toLocaleDateString("vi-VN") : ""} {clock(call.at)}
              </Fact>
              <Fact label={t("aiPipeline.ai.model")}>
                <span className="font-mono text-xs">{call.provider} · {call.model ?? "—"}</span>
              </Fact>
              <Fact label={t("aiPipeline.calls.session")}>
                {call.sessionId ? (
                  <Link href={`/admin/interviews/${encodeURIComponent(call.sessionId)}`} className="font-mono text-xs text-[#204195] hover:underline">
                    {call.sessionId.slice(0, 8)}
                  </Link>
                ) : (
                  "—"
                )}
              </Fact>
            </dl>
            {call.errorMessage ? (
              <pre className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-[#FFF8F8] p-3 text-xs text-[#C43B3B]">{call.errorMessage}</pre>
            ) : null}
          </AdminSection>
          <AdminSection title={`${t("aiPipeline.calls.input")} / ${t("aiPipeline.calls.output")}`}>
            <div className="space-y-5">
              <TextBlock label={t("aiPipeline.calls.input")} text={call.inputPreview} chars={call.inputChars} />
              <TextBlock label={t("aiPipeline.calls.output")} text={call.outputPreview} chars={call.outputChars} />
              {!call.inputPreview && !call.outputPreview ? <Muted>{t("aiPipeline.calls.textHidden")}</Muted> : null}
            </div>
          </AdminSection>
        </>
      )}
    </div>
  );
}
