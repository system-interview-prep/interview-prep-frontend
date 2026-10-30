"use client";

import { Info } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminSection from "./primitives/AdminSection";
import AdminEmptyState from "./primitives/AdminEmptyState";
import { usePolledResource } from "@features/admin/pipeline/hooks/usePolledResource";
import { tr } from "@features/admin/pipeline/utils/pipelineFormat";
import { adminOpsService, type ConfigItem } from "@features/admin/services/adminOps.service";

/** Keys whose boolean means "configured" rather than "on". */
const PRESENCE_KEYS = new Set(["openaiKey", "langfuseEnabled", "langfuseReviewQueue"]);
const PERCENT_KEYS = new Set(["minMatchPercent", "lowFitPercent", "challengePercent"]);
const SHARE_KEYS = new Set(["langfuseTextSampleRate", "langfuseReviewRandomRate"]);

type Translate = (key: string) => string;

export function formatConfigValue(item: Pick<ConfigItem, "key" | "value">, t: Translate): string {
  const { key, value } = item;
  if (value === null || value === "") return "—";
  if (typeof value === "boolean") {
    if (PRESENCE_KEYS.has(key)) return t(value ? "adminOps.config.set" : "adminOps.config.notSet");
    return t(value ? "adminOps.config.on" : "adminOps.config.off");
  }
  if (typeof value === "number" && PERCENT_KEYS.has(key)) return `${value}%`;
  if (typeof value === "number" && SHARE_KEYS.has(key)) return `${Math.round(value * 100)}%`;
  return tr(t, `adminOps.config.value.${key}.${value}`, String(value));
}

/** The settings the backend runs with, grouped; read-only (they come from .env or the code). */
export default function SystemConfigPanel() {
  const { t } = useLanguage();
  const { state, refresh } = usePolledResource(() => adminOpsService.systemConfig(), () => null, []);

  if (state.status === "loading") {
    return (
      <div className="h-60 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none" role="status">
        <span className="sr-only">{t("admin.common.loading")}</span>
      </div>
    );
  }
  if (state.status !== "ready") {
    return <AdminEmptyState variant="error" title={t("adminOps.config.loadError")} description="" onRetry={() => void refresh()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC] p-4 text-xs text-[#607096]">
        <Info className="mt-0.5 size-4 shrink-0 text-[#204195]" aria-hidden="true" />
        <p>{t("adminOps.config.readOnly")}</p>
      </div>
      {state.data.groups.map((group) => (
        <AdminSection
          key={group.key}
          title={tr(t, `adminOps.config.group.${group.key}`, group.key)}
          description={tr(t, `adminOps.config.groupNote.${group.key}`, "")}
        >
          <dl className="divide-y divide-[#F1F5F9] text-xs">
            {group.items.map((item) => (
              <div key={item.key} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <dt className="min-w-0">
                  <span className="font-semibold text-[#14244B]">{tr(t, `adminOps.config.item.${item.key}`, item.key)}</span>
                  <span className="block text-[11px] text-[#607096]">{tr(t, `adminOps.config.note.${item.key}`, "")}</span>
                </dt>
                <dd className="shrink-0 text-left sm:text-right">
                  <span className={`font-semibold text-[#204195] ${typeof item.value === "boolean" ? "" : "font-mono"}`}>
                    {formatConfigValue(item, t)}
                  </span>
                  {item.changed ? (
                    <span className="ml-2 rounded bg-[#FFF4E0] px-1.5 py-0.5 text-[10px] font-semibold text-[#8A5A00]">
                      {t("adminOps.config.changed")}
                    </span>
                  ) : null}
                  <span className={`block text-[10px] text-[#8A98B8] ${item.env ? "font-mono" : ""}`}>
                    {item.env ?? t("adminOps.config.inCode")}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </AdminSection>
      ))}
    </div>
  );
}
