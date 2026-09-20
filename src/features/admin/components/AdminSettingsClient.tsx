"use client";

import { useState } from "react";
import {
  Settings,
  Cpu,
  Sparkles,
  Target,
  ShieldCheck,
  Lock,
} from "lucide-react";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminStatusBadge from "./primitives/AdminStatusBadge";
import AdminSection from "./primitives/AdminSection";
import { useLanguage } from "@/i18n/LanguageProvider";

type SettingsTab = "general" | "ai" | "observability" | "evaluation" | "security";

export default function AdminSettingsClient() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<SettingsTab>("observability");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.settings.title")}
        description={t("admin.settings.subtitle")}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.settings") },
        ]}
        statusBadge={
          <AdminStatusBadge status="info" label={t("admin.settings.badge")} />
        }
      />

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#DCE4F3] pb-2 overflow-x-auto">
        {[
          { id: "observability" as const, label: t("admin.settings.tab.observability"), icon: Sparkles },
          { id: "ai" as const, label: t("admin.settings.tab.ai"), icon: Cpu },
          { id: "evaluation" as const, label: t("admin.settings.tab.evaluation"), icon: Target },
          { id: "security" as const, label: t("admin.settings.tab.security"), icon: ShieldCheck },
          { id: "general" as const, label: t("admin.settings.tab.general"), icon: Settings },
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

      {/* Tab: Observability (Rules 53, 54) */}
      {activeTab === "observability" && (
        <div className="space-y-6">
          <AdminSection
            title={t("admin.settings.obs.title")}
            description={t("admin.settings.obs.desc")}
          >
            <div className="space-y-5">
              {/* Security Rule 4 Alert */}
              <div className="rounded-2xl border border-blue-200 bg-[#EEF2FD] p-4 text-xs text-[#14244B] flex items-start gap-3">
                <Lock className="size-4 text-[#204195] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{t("admin.settings.obs.secRuleTitle")}</p>
                  <p className="mt-0.5 text-[#607096] leading-relaxed">
                    {t("admin.settings.obs.secRuleDesc")}
                  </p>
                </div>
              </div>

              {/* Status Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#607096]">{t("admin.settings.obs.providerTitle")}</p>
                  <p className="mt-2 text-lg font-black text-[#14244B]">{t("admin.settings.obs.providerValue")}</p>
                  <p className="text-[11px] text-[#607096] mt-1">{t("admin.settings.obs.providerSubtitle")}</p>
                </div>

                <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#607096]">{t("admin.settings.obs.connTitle")}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <AdminStatusBadge status="warning" label={t("admin.settings.obs.notConnected")} size="md" />
                  </div>
                  <p className="text-[11px] text-[#607096] mt-1">{t("admin.settings.obs.connSubtitle")}</p>
                </div>
              </div>

              {/* Integration Instructions */}
              <div className="rounded-xl border border-[#DCE4F3] bg-white p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#14244B]">
                  {t("admin.settings.obs.guideTitle")}
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-xs text-[#607096] leading-relaxed">
                  <li>
                    {t("admin.settings.obs.step1")}
                    <pre className="mt-1.5 rounded-lg bg-[#14244B] p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto">
{`# Langfuse Self-hosted hoặc Cloud:
LANGFUSE_PUBLIC_KEY="pk-lf-..."
LANGFUSE_SECRET_KEY="sk-lf-..."
LANGFUSE_HOST="https://cloud.langfuse.com"`}
                    </pre>
                  </li>
                  <li>{t("admin.settings.obs.step2")}</li>
                  <li>{t("admin.settings.obs.step3")}</li>
                </ol>
              </div>
            </div>
          </AdminSection>
        </div>
      )}

      {/* Tab: AI Engine */}
      {activeTab === "ai" && (
        <div className="space-y-6">
          <AdminSection
            title={t("admin.settings.ai.title")}
            description={t("admin.settings.ai.desc")}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
                <p className="text-xs font-bold text-[#607096] uppercase tracking-wider">{t("admin.settings.ai.liveModel")}</p>
                <p className="mt-2 text-base font-bold text-[#14244B]">Google Gemini 2.5 Pro</p>
                <p className="text-[11px] text-[#607096] mt-1">{t("admin.settings.ai.liveModelDesc")}</p>
              </div>
              <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
                <p className="text-xs font-bold text-[#607096] uppercase tracking-wider">{t("admin.settings.ai.rubricModel")}</p>
                <p className="mt-2 text-base font-bold text-[#14244B]">Google Gemini 2.5 Pro</p>
                <p className="text-[11px] text-[#607096] mt-1">{t("admin.settings.ai.rubricModelDesc")}</p>
              </div>
              <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
                <p className="text-xs font-bold text-[#607096] uppercase tracking-wider">{t("admin.settings.ai.cvModel")}</p>
                <p className="mt-2 text-base font-bold text-[#14244B]">Google Gemini 2.5 Flash</p>
                <p className="text-[11px] text-[#607096] mt-1">{t("admin.settings.ai.cvModelDesc")}</p>
              </div>
              <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
                <p className="text-xs font-bold text-[#607096] uppercase tracking-wider">{t("admin.settings.ai.qgenModel")}</p>
                <p className="mt-2 text-base font-bold text-[#14244B]">Google Gemini 2.5 Pro</p>
                <p className="text-[11px] text-[#607096] mt-1">{t("admin.settings.ai.qgenModelDesc")}</p>
              </div>
            </div>
          </AdminSection>
        </div>
      )}

      {/* Tab: Evaluation */}
      {activeTab === "evaluation" && (
        <div className="space-y-6">
          <AdminSection
            title={t("admin.settings.eval.title")}
            description={t("admin.settings.eval.desc")}
          >
            <div className="space-y-4 text-xs text-[#607096]">
              <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
                <p className="font-bold text-[#14244B] text-sm mb-1">{t("admin.settings.eval.regrTitle")}</p>
                <p>{t("admin.settings.eval.regrDesc")}</p>
              </div>
              <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
                <p className="font-bold text-[#14244B] text-sm mb-1">{t("admin.settings.eval.goldenTitle")}</p>
                <p>{t("admin.settings.eval.goldenDesc")}</p>
              </div>
            </div>
          </AdminSection>
        </div>
      )}

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
              <div className="py-3 flex justify-between items-center">
                <span className="text-[#607096]">{t("admin.settings.gen.system")}</span>
                <span className="font-bold text-[#14244B]">INTERVIA AI Interview Preparation Platform</span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="text-[#607096]">{t("admin.settings.gen.consoleVersion")}</span>
                <span className="font-mono font-semibold text-[#204195]">v2.0 (Product & AI Ops)</span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="text-[#607096]">{t("admin.settings.gen.backendCore")}</span>
                <span className="font-mono text-[#14244B]">FastAPI + PostgreSQL + Celery + Qdrant</span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="text-[#607096]">{t("admin.settings.gen.frontend")}</span>
                <span className="font-mono text-[#14244B]">Next.js 15 (App Router) + Tailwind CSS</span>
              </div>
            </div>
          </AdminSection>
        </div>
      )}
    </div>
  );
}
