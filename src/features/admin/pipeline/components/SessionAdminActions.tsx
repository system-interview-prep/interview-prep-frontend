"use client";

import { useState } from "react";
import { CircleStop, ClipboardCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { ConfirmDialog } from "@components/shared/ConfirmDialog";
import { adminErrorCode, adminOpsService } from "@features/admin/services/adminOps.service";
import type { SessionPipeline } from "../services/pipeline.service";
import { tr } from "../utils/pipelineFormat";

type Action = "close" | "grade";

/**
 * Whether the "Chấm điểm" button applies: closed, no report, at least one
 * answered main question to score, no grading run going.
 */
export function canGrade(pipeline: SessionPipeline, now = Date.now()): boolean {
  if (String(pipeline.session.status ?? "").toUpperCase() !== "CLOSED") return false;
  if (pipeline.evaluation.evaluatedAt) return false;
  if (pipeline.turnCounts?.gradable === 0) return false;
  const job = pipeline.evaluation.job;
  if (job?.status?.toUpperCase() === "PROCESSING") {
    const lease = job.leaseUntil ? Date.parse(job.leaseUntil) : NaN;
    if (Number.isNaN(lease) || lease > now) return false;
  }
  return true;
}

export function canClose(pipeline: SessionPipeline): boolean {
  return String(pipeline.session.status ?? "").toUpperCase() !== "CLOSED";
}

const buttonClass =
  "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50";

/**
 * Admin interventions on one session: end it when it is stuck open, grade it
 * when it closed without a report. Both ask first and are written to the
 * access log by the backend.
 */
export default function SessionAdminActions({
  pipeline,
  onDone,
}: {
  pipeline: SessionPipeline;
  onDone: () => void;
}) {
  const { t } = useLanguage();
  const [pending, setPending] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const sessionId = pipeline.session.id;
  const showClose = canClose(pipeline);
  const showGrade = canGrade(pipeline);
  if (!showClose && !showGrade && !message) return null;

  const run = async () => {
    if (!pending) return;
    setBusy(true);
    setMessage(null);
    try {
      if (pending === "close") await adminOpsService.closeSession(sessionId);
      else await adminOpsService.gradeSession(sessionId);
      setMessage({ tone: "ok", text: t(`adminOps.session.${pending}.done`) });
      onDone();
    } catch (error) {
      const code = adminErrorCode(error) ?? "unknown";
      setMessage({ tone: "error", text: tr(t, `adminOps.error.${code}`, t("adminOps.error.unknown")) });
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  return (
    <>
      {showClose ? (
        <button
          type="button"
          onClick={() => setPending("close")}
          disabled={busy}
          className={`${buttonClass} border-[#F3C9C9] bg-white text-[#C43B3B] hover:bg-[#FDF3F3]`}
        >
          <CircleStop className="size-3.5" aria-hidden="true" />
          {t("adminOps.session.close.button")}
        </button>
      ) : null}
      {showGrade ? (
        <button
          type="button"
          onClick={() => setPending("grade")}
          disabled={busy}
          className={`${buttonClass} border-[#204195] bg-[#204195] text-white hover:bg-[#1A3577]`}
        >
          <ClipboardCheck className="size-3.5" aria-hidden="true" />
          {t("adminOps.session.grade.button")}
        </button>
      ) : null}
      {message ? (
        <span
          role="status"
          className={`text-xs font-semibold ${message.tone === "ok" ? "text-[#1F7A4D]" : "text-[#C43B3B]"}`}
        >
          {message.text}
        </span>
      ) : null}
      <ConfirmDialog
        open={pending !== null}
        title={pending ? t(`adminOps.session.${pending}.title`) : ""}
        body={pending ? t(`adminOps.session.${pending}.body`) : null}
        confirmLabel={pending ? t(`adminOps.session.${pending}.confirm`) : ""}
        cancelLabel={t("adminOps.cancel")}
        tone={pending === "close" ? "danger" : "default"}
        busy={busy}
        onConfirm={() => void run()}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
