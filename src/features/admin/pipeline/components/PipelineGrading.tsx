"use client";

import { useLanguage } from "@/i18n/LanguageProvider";
import AdminSection from "@features/admin/components/primitives/AdminSection";
import type { RubricPoint, SessionPipeline } from "../services/pipeline.service";
import { clock, fill, formatScore, tr } from "../utils/pipelineFormat";
import { Chip, type ChipTone, Fact, Muted, ProgressBar, Reason } from "./ui";

const POINT_TONE: Record<string, ChipTone> = { COVERED: "good", PARTIAL: "warn", MISSING: "bad", INCORRECT: "bad" };

function RubricPoints({ points }: { points: RubricPoint[] }) {
  const { t } = useLanguage();
  return (
    <ul className="mt-2 space-y-1.5">
      {points.map((point, index) => {
        const status = String(point.status ?? "").toUpperCase();
        return (
          <li key={`${point.key}-${index}`} className="flex items-start gap-2 text-xs">
            <Chip tone={POINT_TONE[status] ?? "neutral"}>{tr(t, `aiPipeline.grading.point.${status}`, status || "—")}</Chip>
            <span className="min-w-0 text-[#14244B]">
              {point.description ?? point.key}
              {point.quote ? <span className="block text-[#607096]">“{point.quote}”</span> : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** The grading job, live progress while it runs, and each question's verdict. */
export default function PipelineGrading({ pipeline }: { pipeline: SessionPipeline }) {
  const { t } = useLanguage();
  const { evaluation } = pipeline;
  const job = evaluation.job;
  const graded = pipeline.turns.filter((turn) => turn.grade);
  const liveScores = new Map(evaluation.gradedTurns.map((item) => [item.turnIndex, item]));
  return (
    <div className="space-y-6">
      <AdminSection title={t("aiPipeline.grading.title")}>
        {job ? (
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Fact label={t("aiPipeline.grading.job")} hint={fill(t("aiPipeline.grading.attempts"), { n: job.attemptCount })}>
              <Chip tone={job.status === "FAILED" ? "bad" : job.status === "DONE" ? "good" : "brand"}>
                {tr(t, `aiPipeline.grading.job.${job.status}`, job.status)}
              </Chip>
            </Fact>
            <Fact label={t("aiPipeline.grading.overall")}>
              {evaluation.overallScore != null ? <span className="tabular-nums">{formatScore(evaluation.overallScore)}/10</span> : "—"}
            </Fact>
            <Fact label={t("aiPipeline.grading.decision")}>
              {evaluation.decision ? tr(t, `aiPipeline.value.decision.${evaluation.decision}`, evaluation.decision) : "—"}
            </Fact>
            {job.lastError ? (
              <Fact label={t("aiPipeline.grading.lastError")}>
                <span className="text-xs font-medium text-[#C43B3B]">{job.lastError}</span>
              </Fact>
            ) : null}
          </dl>
        ) : (
          <Muted>{t("aiPipeline.grading.notRequested")}</Muted>
        )}
        {job?.status === "PROCESSING" && evaluation.progress?.total ? (
          <div className="mt-5">
            <ProgressBar
              value={evaluation.progress.graded}
              total={evaluation.progress.total}
              label={fill(t("aiPipeline.grading.progress"), {
                graded: evaluation.progress.graded,
                total: evaluation.progress.total,
              })}
            />
          </div>
        ) : null}
        <div className="mt-4 space-y-1">
          {evaluation.decisionCapped ? (
            <Reason tone="warn">
              {fill(t("aiPipeline.grading.capped"), {
                original: evaluation.decisionCapped.originalDecision
                  ? tr(t, `aiPipeline.value.decision.${evaluation.decisionCapped.originalDecision}`, evaluation.decisionCapped.originalDecision)
                  : "—",
                ratio:
                  evaluation.decisionCapped.coverageRatio != null
                    ? `${Math.round(evaluation.decisionCapped.coverageRatio * 100)}%`
                    : "—",
              })}
            </Reason>
          ) : null}
          {evaluation.coverage ? (
            <Reason tone="warn">
              {fill(t("aiPipeline.grading.coverage"), {
                ratio: evaluation.coverage.ratio != null ? `${Math.round(evaluation.coverage.ratio * 100)}%` : "—",
                uncovered: evaluation.coverage.uncovered.map(String).join(", ") || "—",
              })}
            </Reason>
          ) : null}
        </div>
      </AdminSection>

      {graded.length || evaluation.gradedTurns.length ? (
        <ol className="space-y-3">
          {pipeline.turns
            .filter((turn) => turn.grade || liveScores.has(turn.turnIndex))
            .map((turn) => {
              const live = liveScores.get(turn.turnIndex);
              const score = turn.grade?.score ?? live?.score ?? null;
              const outcome = turn.grade?.outcome ?? live?.outcome ?? null;
              return (
                <li key={turn.turnId} className="rounded-xl border border-[#DCE4F3] bg-white p-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Chip tone="brand">{fill(t("aiPipeline.turn.question"), { n: turn.turnIndex + 1 })}</Chip>
                    {score != null ? <Chip tone="good">{fill(t("aiPipeline.turn.grade"), { score: formatScore(score) })}</Chip> : null}
                    {outcome ? (
                      <Chip tone={outcome === "ANSWERED" ? "neutral" : "warn"}>
                        {tr(t, `aiPipeline.grading.outcome.${outcome}`, outcome)}
                      </Chip>
                    ) : null}
                    {live?.method ? <Chip>{tr(t, `aiPipeline.grading.method.${live.method}`, live.method)}</Chip> : null}
                    {live?.at ? <span className="text-xs tabular-nums text-[#8A98B8]">{clock(live.at)}</span> : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-[#14244B]">{turn.questionText}</p>
                  {turn.grade?.rubricPoints.length ? (
                    <>
                      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-[#607096]">
                        {t("aiPipeline.grading.points")}
                      </p>
                      <RubricPoints points={turn.grade.rubricPoints} />
                    </>
                  ) : null}
                  {turn.grade?.feedback ? <p className="mt-2 text-xs leading-5 text-[#475569]">{turn.grade.feedback}</p> : null}
                </li>
              );
            })}
        </ol>
      ) : (
        <Muted>{t("aiPipeline.grading.noTurns")}</Muted>
      )}
    </div>
  );
}
