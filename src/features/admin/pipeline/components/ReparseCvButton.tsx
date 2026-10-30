"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { ConfirmDialog } from "@components/shared/ConfirmDialog";
import { adminErrorCode, adminOpsService } from "@features/admin/services/adminOps.service";
import { tr } from "../utils/pipelineFormat";

/** "Phân tích lại" for a CV: asks first; the backend refuses a parse still in flight. */
export default function ReparseCvButton({ cvId, onDone }: { cvId: string; onDone: () => void }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const run = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await adminOpsService.reparseCv(cvId);
      setMessage({ tone: "ok", text: t("adminOps.cv.reparse.done") });
      onDone();
    } catch (error) {
      const code = adminErrorCode(error) ?? "unknown";
      setMessage({ tone: "error", text: tr(t, `adminOps.error.${code}`, t("adminOps.error.unknown")) });
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#204195] shadow-2xs transition-colors hover:bg-[#F8FAFC] disabled:opacity-50"
      >
        <RotateCcw className="size-3.5" aria-hidden="true" />
        {t("adminOps.cv.reparse.button")}
      </button>
      {message ? (
        <span role="status" className={`text-xs font-semibold ${message.tone === "ok" ? "text-[#1F7A4D]" : "text-[#C43B3B]"}`}>
          {message.text}
        </span>
      ) : null}
      <ConfirmDialog
        open={open}
        title={t("adminOps.cv.reparse.title")}
        body={t("adminOps.cv.reparse.body")}
        confirmLabel={t("adminOps.cv.reparse.confirm")}
        cancelLabel={t("adminOps.cancel")}
        busy={busy}
        onConfirm={() => void run()}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
