"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Info, Settings, ShieldCheck, SlidersHorizontal } from "lucide-react";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminStatusBadge from "./primitives/AdminStatusBadge";
import AdminSection from "./primitives/AdminSection";
import SystemConfigPanel from "./SystemConfigPanel";
import { useLanguage } from "@/i18n/LanguageProvider";

type SettingsTab = "config" | "general" | "security";

export default function AdminSettingsClient() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<SettingsTab>("config");

  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title={t("admin.settings.title")}
        description={t("admin.settings.subtitle")}
        breadcrumbs={[
          { label: t("fixAdmin.detail.breadcrumbAdmin"), href: "/admin/dashboard" },
          { label: t("admin.sidebar.settings") },
        ]}
        statusBadge={
          <AdminStatusBadge status="info" label={t("admin.settings.badge")} />
        }
      />

      {/* AI monitoring, models and evaluation have their own pages; settings no longer repeats them. */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC] p-4 text-xs text-[#607096]">
        <Info className="mt-0.5 size-4 shrink-0 text-[#204195]" aria-hidden="true" />
        <div className="min-w-0">
          <p>{t("settings2.movedNote")}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/admin/ai" className="inline-flex items-center gap-1 font-semibold text-[#204195] hover:underline">
              {t("admin.sidebar.aiOverview")}
              <ArrowUpRight className="size-3" aria-hidden="true" />
            </Link>
            <Link href="/admin/ai/models" className="inline-flex items-center gap-1 font-semibold text-[#204195] hover:underline">
              {t("admin.sidebar.aiModels")}
              <ArrowUpRight className="size-3" aria-hidden="true" />
            </Link>
            <Link href="/admin/evaluation" className="inline-flex items-center gap-1 font-semibold text-[#204195] hover:underline">
              {t("admin.sidebar.evalOverview")}
              <ArrowUpRight className="size-3" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#DCE4F3] pb-2 overflow-x-auto">
        {[
          { id: "config" as const, label: t("adminOps.config.tab"), icon: SlidersHorizontal },
          { id: "general" as const, label: t("admin.settings.tab.general"), icon: Settings },
          { id: "security" as const, label: t("admin.settings.tab.security"), icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-[#204195] text-white shadow-xs"
                  : "text-[#607096] hover:bg-[#F2F5FC] hover:text-[#204195]"
              }`}
            >
              <Icon className="size-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "config" && <SystemConfigPanel />}

      {/* Tab: Security */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <AdminSection
            title={t("admin.settings.sec.title")}
            description={t("admin.settings.sec.desc")}
          >
            <div className="space-y-4 text-xs text-[#607096]">
              <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
                <p className="font-bold text-[#14244B] text-sm mb-1">{t("admin.settings.sec.rbacTitle")}</p>
                <p>{t("admin.settings.sec.rbacDesc")}</p>
              </div>
              <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
                <p className="font-bold text-[#14244B] text-sm mb-1">{t("admin.settings.sec.piiTitle")}</p>
                <p>{t("admin.settings.sec.piiDesc")}</p>
              </div>
            </div>
          </AdminSection>
        </div>
      )}

      {/* Tab: General */}
      {activeTab === "general" && (
        <div className="space-y-6">
          <AdminSection
            title={t("admin.settings.gen.title")}
            description={t("admin.settings.gen.desc")}
          >
            <div className="divide-y divide-[#F1F5F9] text-xs">
              <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <span className="text-[#607096]">{t("admin.settings.gen.system")}</span>
                <span className="font-bold text-[#14244B]">{t("adminMisc.settings.systemName")}</span>
              </div>
              <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <span className="text-[#607096]">{t("admin.settings.gen.consoleVersion")}</span>
                <span className="font-mono font-semibold text-[#204195]">{t("adminMisc.settings.consoleVersionValue")}</span>
              </div>
            </div>
          </AdminSection>
        </div>
      )}
    </div>
  );
}
