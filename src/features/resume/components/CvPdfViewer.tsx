"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { userCvApi } from "../services/userCv.service";

type PreviewState =
  | { status: "loading" }
  | { status: "ready"; url: string }
  | { status: "error"; reason: "load" | "not-pdf" };

export default function CvPdfViewer({
  cvId,
  fileName,
  onClose,
}: {
  cvId: string;
  fileName: string;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [preview, setPreview] = useState<PreviewState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    void userCvApi.download(cvId).then(({ buffer, contentType }) => {
      if (!active) return;
      const isPdf = contentType.toLowerCase().includes("pdf") || fileName.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        setPreview({ status: "error", reason: "not-pdf" });
        return;
      }

      objectUrl = URL.createObjectURL(new Blob([buffer], { type: "application/pdf" }));
      setPreview({ status: "ready", url: objectUrl });
    }).catch(() => {
      if (active) setPreview({ status: "error", reason: "load" });
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      active = false;
      window.removeEventListener("keydown", onKeyDown);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [cvId, fileName, onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#101B32]/75 p-2 sm:p-5" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cv-pdf-viewer-title"
        onClick={(event) => event.stopPropagation()}
        className="flex h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:h-[92dvh]"
      >
        <header className="flex min-h-14 items-center justify-between gap-3 border-b border-[#DCE4F3] px-3 py-2.5 sm:px-5">
          <div className="min-w-0">
            <h2 id="cv-pdf-viewer-title" className="truncate text-sm font-bold text-[#14244B] sm:text-base">{fileName}</h2>
            <p className="text-xs text-[#607096]">{t("userDash.myCvs.pdfViewerTitle")}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {preview.status === "ready" ? (
              <>
                <a
                  href={preview.url}
                  download={fileName}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#DCE4F3] px-3 text-sm font-semibold text-[#204195] hover:bg-[#F0F4FC]"
                >
                  <Download className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{t("userDash.myCvs.pdfDownload")}</span>
                </a>
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-[#DCE4F3] text-[#204195] hover:bg-[#F0F4FC]"
                  aria-label={t("userDash.myCvs.pdfOpenNewTab")}
                  title={t("userDash.myCvs.pdfOpenNewTab")}
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                </a>
              </>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              aria-label={t("common.close")}
              className="inline-flex size-9 items-center justify-center rounded-lg text-[#607096] hover:bg-[#F0F4FC] hover:text-[#14244B]"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 bg-[#E8EEF8]">
          {preview.status === "ready" ? (
            <iframe title={fileName} src={`${preview.url}#toolbar=1&navpanes=0`} className="size-full border-0" />
          ) : preview.status === "loading" ? (
            <div role="status" className="flex size-full items-center justify-center p-6 text-sm font-medium text-[#52627D]">
              {t("userDash.myCvs.pdfLoading")}
            </div>
          ) : (
            <div role="alert" className="flex size-full items-center justify-center p-6 text-center text-sm font-medium text-[#9B2C2C]">
              {t(preview.reason === "not-pdf" ? "userDash.myCvs.pdfUnsupported" : "userDash.myCvs.pdfLoadError")}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
