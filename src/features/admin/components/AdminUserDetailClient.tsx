"use client";

import Link from "next/link";
import { FileText, GitCompareArrows, MessageSquare, Trophy } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatUserRole } from "@/i18n/roles";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminSection from "./primitives/AdminSection";
import AdminMetricCard from "./primitives/AdminMetricCard";
import AdminEmptyState from "./primitives/AdminEmptyState";
import AdminStatusBadge from "./primitives/AdminStatusBadge";
import { usePolledResource } from "@features/admin/pipeline/hooks/usePolledResource";
import { Chip, Muted, TableShell, Th, type ChipTone } from "@features/admin/pipeline/components/ui";
import { fill, tr } from "@features/admin/pipeline/utils/pipelineFormat";
import { adminOpsService, type UserActivitySession } from "@features/admin/services/adminOps.service";
import BatchGradeButton from "@features/admin/pipeline/components/BatchGradeButton";

function dateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function dateOnly(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("vi-VN");
}

const CV_TONE: Record<string, ChipTone> = { DONE: "good", FAILED: "bad", PARSING: "brand", PENDING: "neutral" };
const RUN_TONE: Record<string, ChipTone> = { done: "good", error: "bad", running: "brand" };

/** What the admin should notice about a session: open, closed without a report, or its score. */
export function sessionState(session: UserActivitySession): { key: string; tone: ChipTone } {
  if (session.status !== "CLOSED") return { key: "open", tone: "brand" };
  if (session.score === null) return { key: "ungraded", tone: "warn" };
  return { key: "graded", tone: "good" };
}

/** One account in the product: CVs, interviews with scores, matching runs, reported real interviews. */
export default function AdminUserDetailClient({ userId }: { userId: string }) {
  const { t } = useLanguage();
  const { state, refresh } = usePolledResource(() => adminOpsService.userActivity(userId), () => null, [userId]);

  const header = (title: string, description: string) => (
    <AdminPageHeader
      title={title}
      description={description}
      breadcrumbs={[
        { label: t("fixAdmin.detail.breadcrumbAdmin"), href: "/admin/dashboard" },
        { label: t("admin.sidebar.users"), href: "/admin/users" },
        { label: title },
      ]}
      primaryAction={
        state.status === "ready" ? (
          <BatchGradeButton userId={userId} pending={state.data.summary.ungraded} onFinished={() => void refresh()} />
        ) : undefined
      }
      statusBadge={
        state.status === "ready" ? (
          <AdminStatusBadge
            status={state.data.user.isActive ? "healthy" : "unavailable"}
            label={state.data.user.isActive ? t("fixAdmin.ops.users.status.active") : t("fixAdmin.ops.users.status.inactive")}
          />
        ) : undefined
      }
    />
  );

  if (state.status !== "ready") {
    return (
      <div className="space-y-6">
        {header(t("adminOps.user.title"), t("adminOps.user.subtitle"))}
        {state.status === "loading" ? (
          <div className="h-60 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none" role="status">
            <span className="sr-only">{t("admin.common.loading")}</span>
          </div>
        ) : (
          <AdminEmptyState
            variant="error"
            title={state.httpStatus === 404 ? t("adminOps.user.notFound") : t("adminOps.user.loadError")}
            description=""
            onRetry={state.httpStatus === 404 ? undefined : () => void refresh()}
          />
        )}
      </div>
    );
  }

  const { user, summary, cvs, sessions, matchingRuns, realReports, limits } = state.data;

  return (
    <div className="space-y-6">
      {header(user.name || user.email, user.email)}

      <AdminSection title={t("adminOps.user.account")}>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-[#607096]">{t("adminOps.user.roles")}</dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {user.roles.length
                ? user.roles.map((role) => (
                    <span key={role} className="rounded-full bg-[#EEF2FD] px-2 py-0.5 text-[10px] font-bold text-[#204195]">
                      {formatUserRole(role, t)}
                    </span>
                  ))
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[#607096]">{t("adminOps.user.provider")}</dt>
            <dd className="mt-1 font-semibold text-[#14244B]">{user.provider ? tr(t, `fixAdmin.ops.users.provider.${user.provider.toLowerCase()}`, user.provider) : "—"}</dd>
          </div>
          <div>
            <dt className="text-[#607096]">{t("adminOps.user.createdAt")}</dt>
            <dd className="mt-1 font-semibold text-[#14244B]">{dateTime(user.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-[#607096]">{t("adminOps.user.weeklyGoal")}</dt>
            <dd className="mt-1 font-semibold text-[#14244B]">
              {user.weeklyGoal ? fill(t("adminOps.user.weeklyGoalValue"), { n: user.weeklyGoal }) : "—"}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-[11px] text-[#607096]">{t("adminOps.user.privacy")}</p>
      </AdminSection>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          title={t("adminOps.user.metric.sessions")}
          value={String(summary.sessions)}
          subtitle={fill(t("adminOps.user.metric.sessionsSub"), { closed: summary.closed, open: summary.open })}
          icon={MessageSquare}
        />
        <AdminMetricCard
          title={t("adminOps.user.metric.score")}
          value={summary.avgScore !== null ? `${summary.avgScore}/10` : "—"}
          subtitle={
            summary.bestScore !== null
              ? fill(t("adminOps.user.metric.scoreSub"), { best: summary.bestScore, n: summary.graded })
              : t("adminOps.user.metric.noScore")
          }
          icon={Trophy}
        />
        <AdminMetricCard
          title={t("adminOps.user.metric.cvs")}
          value={String(summary.cvs)}
          subtitle={fill(t("adminOps.user.metric.cvsSub"), { n: summary.cvsFailed })}
          icon={FileText}
        />
        <AdminMetricCard
          title={t("adminOps.user.metric.matching")}
          value={String(summary.matchingRuns)}
          subtitle={fill(t("adminOps.user.metric.reportsSub"), { n: summary.realReports })}
          icon={GitCompareArrows}
        />
      </div>

      <AdminSection
        title={t("adminOps.user.sessions")}
        description={
          [
            summary.ungraded ? fill(t("adminOps.user.sessionsUngraded"), { n: summary.ungraded }) : null,
            summary.sessions > summary.listed ? fill(t("adminOps.user.sessionsListed"), { n: summary.listed, total: summary.sessions }) : null,
          ]
            .filter(Boolean)
            .join(" ") || undefined
        }
      >
        {sessions.length ? (
          <TableShell minWidth={720}>
            <thead>
              <tr>
                <Th>{t("adminOps.user.col.started")}</Th>
                <Th>{t("adminOps.user.col.job")}</Th>
                <Th>{t("adminOps.user.col.mode")}</Th>
                <Th>{t("adminOps.user.col.state")}</Th>
                <Th align="right">{t("adminOps.user.col.score")}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8]">
              {sessions.map((session) => {
                const stateOf = sessionState(session);
                return (
                  <tr key={session.id}>
                    <td className="py-2 pr-4 text-xs tabular-nums">
                      <Link href={`/admin/interviews/${encodeURIComponent(session.id)}`} className="font-semibold text-[#204195] hover:underline">
                        {dateTime(session.startedAt)}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-[#14244B]">{session.jobTitle ?? "—"}</td>
                    <td className="py-2 pr-4 text-xs">{tr(t, `aiPipeline.mode.${session.mode}`, session.mode)}</td>
                    <td className="py-2 pr-4">
                      <Chip tone={stateOf.tone}>{t(`adminOps.user.sessionState.${stateOf.key}`)}</Chip>
                      {session.endReason ? (
                        <span className="block text-[11px] text-[#607096]">
                          {tr(t, `aiPipeline.endReason.${session.endReason}`, session.endReason)}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 text-right font-semibold tabular-nums text-[#14244B]">
                      {session.score !== null ? session.score.toFixed(1) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        ) : (
          <Muted>{t("adminOps.user.noSessions")}</Muted>
        )}
      </AdminSection>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AdminSection title={t("adminOps.user.cvs")} description={fill(t("adminOps.user.latest"), { n: limits.cvs })}>
          {cvs.length ? (
            <ul className="divide-y divide-[#EAEFF8] text-xs">
              {cvs.map((cv) => (
                <li key={cv.id} className="flex items-start justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <Link href={`/admin/cv-parsing/${encodeURIComponent(cv.id)}`} className="font-semibold text-[#204195] [overflow-wrap:anywhere] hover:underline">
                      {cv.fileName ?? cv.id.slice(0, 8)}
                    </Link>
                    <span className="block text-[11px] text-[#607096]">{dateTime(cv.createdAt)}</span>
                    {cv.error ? <span className="block text-[11px] text-[#C43B3B] [overflow-wrap:anywhere]">{cv.error}</span> : null}
                  </div>
                  <Chip tone={CV_TONE[cv.status] ?? "neutral"}>{tr(t, `adminOps.cvStatus.${cv.status}`, cv.status)}</Chip>
                </li>
              ))}
            </ul>
          ) : (
            <Muted>{t("adminOps.user.noCvs")}</Muted>
          )}
        </AdminSection>

        <AdminSection title={t("adminOps.user.matching")} description={fill(t("adminOps.user.latest"), { n: limits.matchingRuns })}>
          {matchingRuns.length ? (
            <ul className="divide-y divide-[#EAEFF8] text-xs">
              {matchingRuns.map((run) => (
                <li key={run.runId} className="flex items-start justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <Link href={`/admin/matching/${encodeURIComponent(run.runId)}`} className="font-semibold text-[#204195] hover:underline">
                      {run.jobTitle ?? run.runId.slice(0, 8)}
                    </Link>
                    <span className="block text-[11px] text-[#607096]">{dateTime(run.startedAt)}</span>
                  </div>
                  <Chip tone={RUN_TONE[run.status]}>{t(`adminOps.user.runStatus.${run.status}`)}</Chip>
                </li>
              ))}
            </ul>
          ) : (
            <Muted>{t("adminOps.user.noMatching")}</Muted>
          )}
        </AdminSection>
      </div>

      <AdminSection title={t("adminOps.user.realReports")} description={t("adminOps.user.realReportsNote")}>
        {realReports.length ? (
          <TableShell minWidth={520}>
            <thead>
              <tr>
                <Th>{t("adminOps.user.col.date")}</Th>
                <Th>{t("adminOps.user.col.company")}</Th>
                <Th>{t("adminOps.user.col.round")}</Th>
                <Th>{t("adminOps.user.col.result")}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8]">
              {realReports.map((report) => (
                <tr key={report.id}>
                  <td className="py-2 pr-4 text-xs tabular-nums">{dateOnly(report.date)}</td>
                  <td className="py-2 pr-4 text-[#14244B]">{report.company ?? "—"}</td>
                  <td className="py-2 pr-4 text-xs">{tr(t, `adminOps.realStage.${report.stage}`, report.stage)}</td>
                  <td className="py-2 text-xs">{tr(t, `adminOps.realResult.${report.result}`, report.result)}</td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <Muted>{t("adminOps.user.noReports")}</Muted>
        )}
      </AdminSection>
    </div>
  );
}
