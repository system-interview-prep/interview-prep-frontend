"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Server, Activity, MessageSquare, Target, ArrowUpRight, RefreshCw, Clock, Cpu, HeartPulse } from "lucide-react";
import { adminApi, AdminOverviewData } from "@/lib/apiClient";
import { jobProfileApi } from "../services/jobProfile.service";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import { useAdminAlerts } from "@features/admin/pipeline/hooks/useAdminAlerts";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminMetricCard from "./primitives/AdminMetricCard";
import { type AdminStatusType } from "./primitives/AdminStatusBadge";
import InterviewTrends from "./InterviewTrends";
import { adminOpsService, type HealthStatus } from "@features/admin/services/adminOps.service";

const HEALTH_PILL: Record<HealthStatus, AdminStatusType> = { ok: "healthy", warn: "warning", down: "error", off: "unavailable" };

const DOT: Partial<Record<AdminStatusType, string>> = {
  healthy: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  unavailable: "bg-zinc-400",
};

/** Compact service state: a pill with a colored dot; the AI pill opens the AI page. */
function ServicePill({
  icon: Icon,
  title,
  status,
  statusLabel,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  status: AdminStatusType;
  statusLabel: string;
  href?: string;
}) {
  const body = (
    <>
      <Icon className="size-3.5 shrink-0 text-[#204195]" />
      <span className="font-semibold text-[#14244B]">{title}</span>
      <span className="text-[#C2CBDD]" aria-hidden="true">·</span>
      <span className={`size-1.5 shrink-0 rounded-full ${DOT[status] ?? "bg-slate-400"}`} aria-hidden="true" />
      <span className="text-[#475569]">{statusLabel}</span>
      {href ? <ArrowUpRight className="size-3 shrink-0 text-[#607096]" aria-hidden="true" /> : null}
    </>
  );
  const cls = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#DCE4F3] bg-white px-3 py-1.5 text-xs shadow-2xs";
  return href ? (
    <Link href={href} className={`${cls} transition-colors hover:border-[#204195]/50`}>
      {body}
    </Link>
  ) : (
    <span className={cls}>{body}</span>
  );
}

/**
 * The single place for platform-wide numbers: service status, interview
 * activity, monthly trend and mode breakdown (formerly the "Phân tích" page),
 * and content counts. Detail lives on the dedicated pages.
 */
export default function AdminOverviewDashboard() {
  const { t } = useLanguage();
  const { errorCount, warningCount } = useAdminAlerts();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [overviewData, setOverviewData] = useState<AdminOverviewData | null>(null);
  const [jobProfileCount, setJobProfileCount] = useState<number | null>(null);
  const [backendStatus, setBackendStatus] = useState<"healthy" | "unavailable" | "unknown">("unknown");
  const [infra, setInfra] = useState<HealthStatus | null>(null);

  const loadDashboardData = async () => {
    try {
      const overviewRes = await adminApi.getOverview();
      if (overviewRes.data?.success && overviewRes.data.overview) {
        setOverviewData(overviewRes.data.overview);
        setBackendStatus("healthy");
      } else {
        setBackendStatus("unavailable");
      }
    } catch {
      setBackendStatus("unavailable");
    }
    try {
      setInfra((await adminOpsService.systemHealth()).overall);
    } catch {
      setInfra(null);
    }
    try {
      const jpRes = await jobProfileApi.list({ limit: 1 });
      setJobProfileCount(jpRes.data.total ?? jpRes.data.items?.length ?? 0);
    } catch {
      setJobProfileCount(null);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadDashboardData();
  };

  const healthy = backendStatus === "healthy";
  const aiStatus: AdminStatusType = errorCount ? "error" : warningCount ? "warning" : "healthy";
  const aiLabel = errorCount
    ? fmt(t("overview2.ai.errors"), { n: errorCount })
    : warningCount
      ? fmt(t("overview2.ai.warnings"), { n: warningCount })
      : t("overview2.ai.ok");
  const pending = loading || overviewData === null;

  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title={t("fixAdmin.overview.title")}
        description={t("overview2.subtitle")}
        breadcrumbs={[{ label: t("fixAdmin.detail.breadcrumbAdmin"), href: "/admin/dashboard" }, { label: t("admin.sidebar.group.overview") }]}
        primaryAction={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-full border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#14244B] shadow-2xs transition-all hover:bg-[#F8FAFC] disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin motion-reduce:animate-none" : ""}`} />
            <span>{t("admin.dashboard.refresh")}</span>
          </button>
        }
      />

      {/* Service state as one compact row; only services with a real check are shown. */}
      <div className="-mt-2 flex flex-wrap items-center gap-2" aria-label={t("overview2.services.title")}>
        <ServicePill
          icon={Server}
          title={t("overview2.services.backend")}
          status={healthy ? "healthy" : backendStatus === "unknown" ? "unknown" : "unavailable"}
          statusLabel={healthy ? t("fixAdmin.status.healthy") : backendStatus === "unknown" ? t("admin.common.loading") : t("fixAdmin.status.offline")}
        />
        <ServicePill icon={Cpu} title={t("overview2.services.ai")} status={aiStatus} statusLabel={aiLabel} href="/admin/ai" />
        <ServicePill
          icon={HeartPulse}
          title={t("adminOps.health.pill")}
          status={infra ? HEALTH_PILL[infra] : "unknown"}
          statusLabel={infra ? t(`adminOps.health.overall.${infra}`) : loading ? t("admin.common.loading") : t("adminOps.health.unknown")}
          href="/admin/system"
        />
      </div>


      <section aria-label={t("overview2.activity.title")} className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#14244B]">{t("overview2.activity.title")}</h2>
            <p className="mt-0.5 text-xs text-[#607096]">{t("overview2.activity.desc")}</p>
          </div>
          <Link href="/admin/interviews" className="inline-flex items-center gap-1 text-xs font-semibold text-[#204195] hover:underline">
            {t("overview2.activity.open")}
            <ArrowUpRight className="size-3" aria-hidden="true" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <AdminMetricCard
            title={t("admin.dashboard.totalSessions")}
            value={overviewData?.totalSessions}
            unit={t("admin.interviews.sessionUnit")}
            subtitle={t("admin.dashboard.totalSessionsSub")}
            icon={MessageSquare}
            isPending={pending}
            pendingText={t("admin.common.loading")}
          />
          <AdminMetricCard
            title={t("admin.dashboard.activeSessions")}
            value={overviewData?.activeSessions}
            unit={t("admin.interviews.sessionUnit")}
            subtitle={t("overview2.activity.activeSub")}
            icon={Activity}
            isPending={pending}
            pendingText={t("admin.common.loading")}
          />
          <AdminMetricCard
            title={t("adminOps.overview.ended")}
            value={overviewData?.completedSessions}
            unit={t("admin.interviews.sessionUnit")}
            subtitle={
              overviewData?.gradedSessions !== undefined
                ? fmt(t("adminOps.overview.endedSub"), {
                    graded: overviewData.gradedSessions,
                    ungraded: Math.max(0, overviewData.completedSessions - overviewData.gradedSessions),
                  })
                : t("admin.dashboard.completedSessionsSub")
            }
            icon={Clock}
            isPending={pending}
            pendingText={t("admin.common.loading")}
          />
          <AdminMetricCard
            title={t("admin.dashboard.averageScore")}
            value={overviewData?.averageScore ? `${overviewData.averageScore.toFixed(1)}/100` : null}
            subtitle={overviewData?.averageScore ? t("admin.dashboard.averageScoreSub") : t("admin.dashboard.averageScoreEmpty")}
            icon={Target}
            isPending={pending}
            pendingText={t("admin.common.noData")}
          />
        </div>
      </section>

      <section id="trends" aria-label={t("overview2.trends.title")} className="scroll-mt-6 space-y-3">
        <div>
          <h2 className="text-base font-bold text-[#14244B]">{t("overview2.trends.title")}</h2>
          <p className="mt-0.5 text-xs text-[#607096]">{t("overview2.trends.desc")}</p>
        </div>
        <InterviewTrends data={overviewData} />
      </section>

      <section aria-label={t("overview2.content.title")} className="space-y-3">
        <div>
          <h2 className="text-base font-bold text-[#14244B]">{t("overview2.content.title")}</h2>
          <p className="mt-0.5 text-xs text-[#607096]">{t("overview2.content.desc")}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Link
            href="/admin/job-descriptions"
            className="group flex items-center justify-between gap-3 rounded-xl border border-[#DCE4F3] bg-white px-4 py-3 shadow-2xs transition-colors hover:border-[#204195]/50"
          >
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-[#607096]">{t("admin.sidebar.jobBoard")}</span>
              <span className="mt-0.5 flex items-baseline gap-1">
                <span className="text-xl font-bold tabular-nums text-[#14244B]">
                  {jobProfileCount !== null ? jobProfileCount : loading ? "…" : "—"}
                </span>
                <span className="text-xs text-[#607096]">{t("admin.jobProfile.unit")}</span>
              </span>
            </span>
            <ArrowUpRight className="size-4 shrink-0 text-[#607096] transition-colors group-hover:text-[#204195]" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
