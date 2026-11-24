"use client";

import { CheckCircle2, Circle, CircleSlash, Loader2, XCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { PipelineStage, StageKey, StageStatus } from "../services/pipeline.service";
import { formatMs } from "../utils/pipelineFormat";

const ICONS: Record<StageStatus, { icon: typeof Circle; className: string }> = {
  done: { icon: CheckCircle2, className: "text-[#287A4B]" },
  running: { icon: Loader2, className: "text-[#204195] animate-spin motion-reduce:animate-none" },
  error: { icon: XCircle, className: "text-[#C43B3B]" },
  pending: { icon: Circle, className: "text-[#B6C2DA]" },
  skipped: { icon: CircleSlash, className: "text-stone-500" },
};

const FRAME: Record<StageStatus, string> = {
  done: "border-[#DCE4F3] bg-white",
  running: "border-[#204195] bg-[#F5F8FF] ring-2 ring-[#204195]/15",
  error: "border-[#F3C4C4] bg-[#FFF8F8]",
  pending: "border-dashed border-[#DCE4F3] bg-[#FBFCFE]",
  skipped: "border-stone-200 bg-stone-50",
};

/**
 * Created → match check → plan → questions → interview → grading → report.
 * Each step names its status in text (never color alone) and its duration;
 * clicking a step opens the tab that explains it.
 */
export default function PipelineStepper({
  stages,
  summaries,
  onSelect,
}: {
  stages: PipelineStage[];
  /** The step's result in a few words ("74% · Challenge"); see stageSummary. */
  summaries?: Partial<Record<StageKey, string | null>>;
  onSelect: (key: StageKey) => void;
}) {
  const { t } = useLanguage();
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7" aria-label={t("aiPipeline.title")}>
      {stages.map((stage, index) => {
        const { icon: Icon, className } = ICONS[stage.status];
        return (
          <li key={stage.key} className="relative">
            <button
              type="button"
              onClick={() => onSelect(stage.key)}
              aria-current={stage.status === "running" ? "step" : undefined}
              className={`flex h-full w-full flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors hover:border-[#204195]/50 focus-visible:outline-2 focus-visible:outline-[#204195] ${FRAME[stage.status]}`}
            >
              <span className="flex w-full items-center gap-1.5">
                <Icon className={`size-4 shrink-0 ${className}`} aria-hidden="true" />
                <span className="text-[11px] font-semibold tabular-nums text-[#8A98B8]">{index + 1}</span>
              </span>
              <span className="text-sm font-bold leading-tight text-[#14244B]">{t(`aiPipeline.stage.${stage.key}`)}</span>
              <span className="text-xs font-medium text-[#607096]">
                {t(`aiPipeline.status.${stage.status}`)}
                {stage.durationMs != null ? <span className="tabular-nums"> · {formatMs(stage.durationMs)}</span> : null}
              </span>
              {summaries?.[stage.key] ? (
                <span className="text-[11px] font-semibold leading-snug text-[#204195]">{summaries[stage.key]}</span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
