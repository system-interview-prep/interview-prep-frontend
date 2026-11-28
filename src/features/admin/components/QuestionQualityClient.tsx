"use client";

import { useMemo, useState } from "react";
import { FileQuestion, ListChecks, MessagesSquare, TriangleAlert } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminSection from "./primitives/AdminSection";
import AdminMetricCard from "./primitives/AdminMetricCard";
import AdminEmptyState from "./primitives/AdminEmptyState";
import { usePolledResource } from "@features/admin/pipeline/hooks/usePolledResource";
import { Chip, Muted, TableShell, Th } from "@features/admin/pipeline/components/ui";
import { fill, tr } from "@features/admin/pipeline/utils/pipelineFormat";
import { adminOpsService, type QuestionQualityGroup } from "@features/admin/services/adminOps.service";

const WINDOWS = [7, 30, 90, 0] as const;
type Window = (typeof WINDOWS)[number];

/** Above these a group is worth a look; the numbers are always shown next to the mark. */
export const QUALITY_LIMITS = {
  skippedRate: 0.3,
  overHardTimeRate: 0.3,
  repeatedAcrossSessionsRate: 0.3,
  /** Scores this close together (0–10) do not tell answers apart. */
  minScoreStdDev: 0.5,
  minAskedForSpread: 5,
} as const;

export type QualityIssue = "skipped" | "overTime" | "repeated" | "flatScores" | "duplicate" | "language" | "leak";

export function qualityIssues(group: QuestionQualityGroup): QualityIssue[] {
  const issues: QualityIssue[] = [];
  if (group.leakCount > 0) issues.push("leak");
  if (group.wrongLanguageCount > 0) issues.push("language");
  if (group.duplicateInSessionCount > 0) issues.push("duplicate");
  if ((group.skippedRate ?? 0) > QUALITY_LIMITS.skippedRate) issues.push("skipped");
  if ((group.overHardTimeRate ?? 0) > QUALITY_LIMITS.overHardTimeRate) issues.push("overTime");
  if ((group.repeatedAcrossSessionsRate ?? 0) > QUALITY_LIMITS.repeatedAcrossSessionsRate) issues.push("repeated");
  if (
    group.asked >= QUALITY_LIMITS.minAskedForSpread &&
    group.scoreStdDev !== null &&
    group.scoreStdDev < QUALITY_LIMITS.minScoreStdDev
  ) {
    issues.push("flatScores");
  }
  return issues;
}

const SEVERE: ReadonlySet<QualityIssue> = new Set(["leak", "language", "duplicate"]);

function pct(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function sinceOf(days: Window): string | undefined {
  if (!days) return undefined;
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

/** Asked questions grouped by stage and source: answered, skipped, scores, follow-ups, repeats, leaks. */
export default function QuestionQualityClient() {
  const { t } = useLanguage();
  const [days, setDays] = useState<Window>(30);
  const [includeDemo, setIncludeDemo] = useState(false);
  const { state, refresh } = usePolledResource(
    () => adminOpsService.questionQuality({ since: sinceOf(days), includeDemo }),
    () => null,
    [days, includeDemo],
  );

  const stageLabel = (stage: string) => tr(t, `aiPipeline.qstage.${stage}`, stage);
  const sourceLabel = (source: string) => {
    // "~name": the source was inferred for turns stored before questionSource was recorded.
    const inferred = source.startsWith("~");
    const label = tr(t, `adminPlan.source.${source.replace(/^~/, "")}`, source);
    return inferred ? fill(t("adminPlan.source.inferred"), { label }) : label;
  };

  const rows = useMemo(
    () =>
      state.status === "ready"
        ? state.data.groups
            .map((group) => ({ group, issues: qualityIssues(group) }))
            .sort((a, b) => b.issues.length - a.issues.length || b.group.asked - a.group.asked)
        : [],
    [state],
  );

  const filters = (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <label className="flex items-center gap-2 font-semibold text-[#14244B]">
        {t("adminOps.quality.window")}
        <select
          value={days}
          onChange={(event) => setDays(Number(event.target.value) as Window)}
          className="rounded-lg border border-[#DCE4F3] bg-white px-2 py-1.5 text-xs"
        >
          {WINDOWS.map((value) => (
            <option key={value} value={value}>
              {value ? fill(t("adminOps.quality.days"), { n: value }) : t("adminOps.quality.allTime")}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-[#607096]">
        <input type="checkbox" checked={includeDemo} onChange={(event) => setIncludeDemo(event.target.checked)} />
        {t("adminOps.quality.includeDemo")}
      </label>
    </div>
  );

  const header = (
    <AdminPageHeader
      title={t("adminOps.quality.title")}
      description={t("adminOps.quality.subtitle")}
      breadcrumbs={[
        { label: t("fixAdmin.detail.breadcrumbAdmin"), href: "/admin/dashboard" },
        { label: t("adminOps.quality.title") },
      ]}
      primaryAction={filters}
    />
  );

  if (state.status !== "ready") {
    return (
      <div className="space-y-6">
        {header}
        {state.status === "loading" ? (
          <div className="h-60 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none" role="status">
            <span className="sr-only">{t("admin.common.loading")}</span>
          </div>
        ) : (
          <AdminEmptyState variant="error" title={t("adminOps.quality.loadError")} description="" onRetry={() => void refresh()} />
        )}
      </div>
    );
  }

  const data = state.data;
  const flagged = rows.filter((row) => row.issues.length > 0);
  const sourceTotal = Object.values(data.sourceMix).reduce((sum, n) => sum + n, 0);

  return (
    <div className="space-y-6">
      {header}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricCard title={t("adminOps.quality.sessions")} value={String(data.sessions)} subtitle={t("adminOps.quality.sessionsSub")} icon={MessagesSquare} />
        <AdminMetricCard title={t("adminOps.quality.asked")} value={String(data.askedTurns)} subtitle={t("adminOps.quality.askedSub")} icon={FileQuestion} />
        <AdminMetricCard
          title={t("adminOps.quality.flaggedGroups")}
          value={`${flagged.length}/${rows.length}`}
          subtitle={t("adminOps.quality.flaggedGroupsSub")}
          icon={flagged.length ? TriangleAlert : ListChecks}
        />
      </div>

      <AdminSection title={t("adminOps.quality.groups")} description={t("adminOps.quality.groupsNote")}>
        {rows.length ? (
          <TableShell minWidth={940}>
            <thead>
              <tr>
                <Th>{t("adminOps.quality.col.group")}</Th>
                <Th align="right">{t("adminOps.quality.col.asked")}</Th>
                <Th align="right">{t("adminOps.quality.col.answered")}</Th>
                <Th align="right">{t("adminOps.quality.col.skipped")}</Th>
                <Th align="right">{t("adminOps.quality.col.score")}</Th>
                <Th align="right">{t("adminOps.quality.col.time")}</Th>
                <Th align="right">{t("adminOps.quality.col.probes")}</Th>
                <Th align="right">{t("adminOps.quality.col.repeated")}</Th>
                <Th>{t("adminOps.quality.col.issues")}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8]">
              {rows.map(({ group, issues }) => (
                <tr key={`${group.stage}-${group.source}`}>
                  <td className="min-w-[170px] py-2 pr-4">
                    <span className="font-semibold text-[#14244B]">{stageLabel(group.stage)}</span>
                    <span className="block text-[11px] text-[#607096]">{sourceLabel(group.source)}</span>
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">{group.asked}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{pct(group.answeredRate)}</td>
                  <td className={`py-2 pr-4 text-right tabular-nums ${issues.includes("skipped") ? "font-semibold text-[#8A5A00]" : ""}`}>
                    {pct(group.skippedRate)}
                  </td>
                  <td className={`py-2 pr-4 text-right tabular-nums ${issues.includes("flatScores") ? "font-semibold text-[#8A5A00]" : ""}`}>
                    {group.meanScore ?? "—"}
                    {group.scoreStdDev !== null ? <span className="text-[11px] text-[#607096]"> ±{group.scoreStdDev}</span> : null}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {group.meanAnswerSeconds !== null ? `${Math.round(group.meanAnswerSeconds)}s` : "—"}
                    <span className={`block text-[11px] ${issues.includes("overTime") ? "font-semibold text-[#8A5A00]" : "text-[#607096]"}`}>
                      {fill(t("adminOps.quality.overTime"), { rate: pct(group.overHardTimeRate) })}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {group.probesPerTurn !== null ? group.probesPerTurn.toFixed(2) : "—"}
                    <span className="block text-[11px] text-[#607096]">
                      {fill(t("adminOps.quality.llmShare"), { rate: pct(group.llmProbeShare) })}
                    </span>
                  </td>
                  <td className={`py-2 pr-4 text-right tabular-nums ${issues.includes("repeated") ? "font-semibold text-[#8A5A00]" : ""}`}>
                    {pct(group.repeatedAcrossSessionsRate)}
                  </td>
                  <td className="min-w-[240px] py-2">
                    {issues.length ? (
                      <div className="flex max-w-[280px] flex-wrap gap-1">
                        {issues.map((issue) => (
                          <Chip key={issue} tone={SEVERE.has(issue) ? "bad" : "warn"}>
                            {fill(t(`adminOps.quality.issue.${issue}`), {
                              n:
                                issue === "leak"
                                  ? group.leakCount
                                  : issue === "language"
                                    ? group.wrongLanguageCount
                                    : group.duplicateInSessionCount,
                            })}
                          </Chip>
                        ))}
                      </div>
                    ) : (
                      <Chip tone="good">{t("adminOps.quality.ok")}</Chip>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <Muted>{t("adminOps.quality.empty")}</Muted>
        )}
      </AdminSection>

      <AdminSection title={t("adminOps.quality.sourceMix")} description={t("adminOps.quality.sourceMixNote")}>
        {sourceTotal ? (
          <ul className="space-y-2 text-xs">
            {Object.entries(data.sourceMix).map(([source, count]) => (
              <li key={source} className="flex items-center gap-3">
                <span className="w-56 shrink-0 truncate text-[#14244B]">{sourceLabel(source)}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#EEF2FD]">
                  <span className="block h-full rounded-full bg-[#204195]" style={{ width: `${(count / sourceTotal) * 100}%` }} />
                </span>
                <span className="w-20 shrink-0 text-right tabular-nums text-[#607096]">
                  {count} · {Math.round((count / sourceTotal) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Muted>{t("adminOps.quality.empty")}</Muted>
        )}
      </AdminSection>

      <p className="text-[11px] text-[#607096]">{t("adminOps.quality.legend")}</p>
    </div>
  );
}
