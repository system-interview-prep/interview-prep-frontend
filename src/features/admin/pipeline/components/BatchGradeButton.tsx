"use client";

import { useEffect, useRef, useState } from "react";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { ConfirmDialog } from "@components/shared/ConfirmDialog";
import { adminErrorCode, adminOpsService, type GradingBatch } from "@features/admin/services/adminOps.service";
import { fill, tr } from "../utils/pipelineFormat";

const POLL_MS = 4000;

/**
 * "Chấm các buổi chưa có báo cáo": grades them one after another in the
 * background (at most 50 a time) and shows the progress, of one user or of
 * everyone. The count on the button comes from the backend (`eligible`): only
 * sessions with at least one answered main question can be graded, so it can
 * be lower than the page's "chưa có báo cáo".
 */
export default function BatchGradeButton({
  userId,
  pending,
  onFinished,
}: {
  userId?: string;
  /** Closed sessions without a report, as counted by the page; refetches the count when it changes. */
  pending: number;
  onFinished: () => void;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [batch, setBatch] = useState<GradingBatch | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [eligible, setEligible] = useState<number | null>(null);
  const finished = useRef(onFinished);
  finished.current = onFinished;

  // The gradable count, and a batch that is already running (page reloaded mid-way).
  useEffect(() => {
    let cancelled = false;
    void adminOpsService
      .gradingBatch(userId)
      .then((state) => {
        if (cancelled) return;
        setEligible(state.eligible);
        if (state.batch?.running) setBatch(state.batch);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [userId, pending]);

  useEffect(() => {
    if (!batch?.running) return;
    const timer = window.setInterval(() => {
      void adminOpsService
        .gradingBatch(userId)
        .then((state) => {
          setBatch(state.batch);
          setEligible(state.eligible);
          if (state.batch && !state.batch.running) finished.current();
        })
        .catch(() => undefined);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [batch?.running, userId]);

  const start = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const { queued } = await adminOpsService.gradePending(userId);
      setBatch({ total: queued, graded: 0, failed: 0, skipped: 0, running: true, startedAt: new Date().toISOString(), finishedAt: null });
    } catch (error) {
      const code = adminErrorCode(error) ?? "unknown";
      setMessage(tr(t, `adminOps.error.${code}`, t("adminOps.error.unknown")));
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  // Older backend without `eligible`: fall back to the page's count.
  const count = eligible ?? pending;
  if (!count && !batch) return null;
  const done = batch ? batch.graded + batch.failed + batch.skipped : 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {batch?.running ? (
        <span role="status" className="inline-flex items-center gap-2 text-xs font-semibold text-[#204195]">
          <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {fill(t("adminOps.batch.progress"), { done, total: batch.total, failed: batch.failed })}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={busy || !count}
          title={t("adminOps.batch.hint")}
          className="inline-flex items-center gap-2 rounded-full border border-[#204195] bg-[#204195] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#1A3577] disabled:opacity-50"
        >
          <ClipboardCheck className="size-3.5" aria-hidden="true" />
          {fill(t("adminOps.batch.button"), { n: count })}
        </button>
      )}
      {batch && !batch.running ? (
        <span role="status" className="text-xs font-semibold text-[#1F7A4D]">
          {fill(t("adminOps.batch.done"), { graded: batch.graded, failed: batch.failed })}
        </span>
      ) : null}
      {message ? <span className="text-xs font-semibold text-[#C43B3B]">{message}</span> : null}
      <ConfirmDialog
        open={open}
        title={t("adminOps.batch.title")}
        body={fill(t("adminOps.batch.body"), { n: count, limit: Math.min(count, 50) })}
        confirmLabel={t("adminOps.batch.confirm")}
        cancelLabel={t("adminOps.cancel")}
        busy={busy}
        onConfirm={() => void start()}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
