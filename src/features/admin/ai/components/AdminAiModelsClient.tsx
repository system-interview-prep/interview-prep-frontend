"use client";

import { useEffect, useState } from "react";
import { Box, Lock, Info } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminMetricCard from "@features/admin/components/primitives/AdminMetricCard";
import { aiOpsService } from "../services/aiOps.service";
import { AIModelConfig } from "../types/aiOps.types";

/** Vietnamese label for a capability code; falls back to the service's English label. */
function capabilityLabel(t: (key: string) => string, m: AIModelConfig) {
  const key = `adminMisc.ai.capability.${m.capability}`;
  const value = t(key);
  return value && value !== key ? value : m.capabilityLabel;
}

function environmentLabel(t: (key: string) => string, env: string) {
  const key = `adminMisc.ai.env.${env}`;
  const value = t(key);
  return value && value !== key ? value : env;
}

export default function AdminAiModelsClient() {
  const { t } = useLanguage();
  const [models, setModels] = useState<AIModelConfig[]>([]);

  useEffect(() => {
    async function load() {
      const list = await aiOpsService.getModels();
      setModels(list);
    }
    load();
  }, []);

  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title={t("admin.ai.models.title")}
        description={t("admin.ai.models.subtitle")}
        breadcrumbs={[
          { label: t("fixAdmin.detail.breadcrumbAdmin"), href: "/admin/dashboard" },
          { label: t("admin.sidebar.aiOverview"), href: "/admin/ai" },
          { label: t("adminMisc.ai.models.crumb") },
        ]}
        statusBadge={
          <AdminStatusBadge status="info" label={t("admin.common.readOnly")} />
        }
      />

      {/* Backend Required Warning (Rule 28) */}
      <div className="rounded-2xl border border-[#DCE4F3] bg-[#EEF2FD] p-4 flex items-start gap-3">
        <Info className="size-5 text-[#204195] shrink-0 mt-0.5" />
        <div className="min-w-0 text-xs text-[#14244B]">
          <p className="font-bold">{t("fixAdmin.ai.models.safetyTitle")}</p>
          <p className="mt-0.5 text-[#607096] leading-relaxed">
            {t("admin.ai.models.safetyRule")}
          </p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricCard
          title={t("fixAdmin.ai.models.activeCapabilities")}
          value={models.length}
          unit={t("fixAdmin.ai.models.unitCapabilities")}
          subtitle={t("fixAdmin.ai.models.activeCapabilitiesSub")}
          icon={Box}
          status="healthy"
        />
        <AdminMetricCard
          title={t("fixAdmin.ai.models.mainProvider")}
          value="Google Vertex"
          subtitle="Gemini 2.5 Flash và Pro"
          icon={Box}
          status="healthy"
        />
        <AdminMetricCard
          title={t("fixAdmin.ai.models.environment")}
          value={environmentLabel(t, "PRODUCTION")}
          subtitle={t("fixAdmin.ai.models.environmentSub")}
          icon={Lock}
          status="healthy"
        />
      </div>

      {/* Models Table (Rule 26 & 27: Only real proven capabilities) */}
      <div className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAEFF8] px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#14244B]">{t("fixAdmin.ai.models.assignmentTitle")}</h3>
            <p className="text-xs text-[#607096] mt-0.5">{t("fixAdmin.ai.models.assignmentDesc")}</p>
          </div>
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
            {fmt(t("fixAdmin.ai.models.capabilityCount"), { n: models.length })}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAEFF8] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#607096]">
                <th className="px-6 py-4">{t("admin.ai.models.table.capability")}</th>
                <th className="px-6 py-4">{t("admin.ai.models.table.provider")}</th>
                <th className="px-6 py-4">{t("admin.ai.models.table.model")}</th>
                <th className="px-6 py-4 text-center">{t("admin.ai.models.table.env")}</th>
                <th className="px-6 py-4 text-center">{t("admin.ai.models.table.version")}</th>
                <th className="px-6 py-4 text-center">{t("admin.ai.models.table.status")}</th>
                <th className="px-6 py-4 text-right">{t("admin.ai.models.table.edit")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8] text-xs">
              {models.map((m) => (
                <tr key={m.id} className="transition-colors hover:bg-[#F8FAFC]">
                  <td className="px-6 py-4">
                    <span className="block font-bold text-[#14244B]">{capabilityLabel(t, m)}</span>
                    <span className="text-[10.5px] font-mono text-[#607096]">{m.capability}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-[#14244B]">{m.provider}</td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-[#204195] bg-[#EEF2FD] px-2 py-0.5 rounded">
                      {m.modelName}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                      {environmentLabel(t, m.environment)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-medium text-[#607096]">
                    {m.version}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <AdminStatusBadge
                      status="active"
                      label={m.status === "ACTIVE" ? t("adminMisc.status.inUse") : m.status}
                      size="sm"
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#8A98B8] font-medium" title={t("fixAdmin.ai.models.readOnlyHint")}>
                      <Lock className="size-3" />
                      {t("fixAdmin.ai.models.readOnly")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
