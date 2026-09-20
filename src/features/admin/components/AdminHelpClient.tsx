"use client";

import {
  Search,
  BookOpen,
  Terminal,
  ShieldAlert,
  Headphones,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Mail,
  FileCode,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "./primitives/AdminPageHeader";

type SupportCategory = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  titleKey: string;
  descriptionKey: string;
};

type FeaturedArticle = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  titleKey: string;
};

type SystemStatusItem = {
  id: string;
  labelKey: string;
  status: "operational" | "degraded";
};

const categories: SupportCategory[] = [
  {
    id: "scoring",
    icon: BookOpen,
    titleKey: "admin.help.cat.scoring",
    descriptionKey: "admin.help.cat.scoring.desc",
  },
  {
    id: "webhooks",
    icon: Terminal,
    titleKey: "admin.help.cat.webhooks",
    descriptionKey: "admin.help.cat.webhooks.desc",
  },
  {
    id: "compliance",
    icon: ShieldAlert,
    titleKey: "admin.help.cat.compliance",
    descriptionKey: "admin.help.cat.compliance.desc",
  },
  {
    id: "troubleshooting",
    icon: Headphones,
    titleKey: "admin.help.cat.troubleshooting",
    descriptionKey: "admin.help.cat.troubleshooting.desc",
  },
];

const articles: FeaturedArticle[] = [
  {
    id: "calibrate",
    icon: FileCode,
    iconClass: "text-[#234196]",
    titleKey: "admin.help.article.calibrate",
  },
  {
    id: "latency",
    icon: Zap,
    iconClass: "text-amber-600",
    titleKey: "admin.help.article.latency",
  },
  {
    id: "export-pdf",
    icon: FileCode,
    iconClass: "text-[#234196]",
    titleKey: "admin.help.article.exportPdf",
  },
];

const statuses: SystemStatusItem[] = [
  { id: "ai-core", labelKey: "admin.help.system.aiCoreEngine", status: "operational" },
  { id: "api", labelKey: "admin.help.system.apiServices", status: "operational" },
  { id: "indexing", labelKey: "admin.help.system.indexingPipeline", status: "degraded" },
];

export default function AdminHelpClient() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.help.title") || "Trợ giúp & Tài liệu Kỹ thuật"}
        description={t("admin.help.subtitle") || "Tra cứu hướng dẫn kỹ thuật, tài liệu vận hành AI và liên hệ đội ngũ hỗ trợ"}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.help") || "Trợ giúp & Tài liệu" },
        ]}
      />

      {/* Hero Banner */}
      <div className="rounded-2xl border border-[#204195]/20 bg-gradient-to-r from-[#204195] to-[#14244B] p-8 text-white shadow-xs">
        <div className="max-w-2xl">
          <h2 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {t("admin.help.heroTitle") || "Chúng tôi có thể hỗ trợ gì cho bạn?"}
          </h2>
          <p className="mt-2 text-sm text-white/80">
            {t("admin.help.heroSubtitle") || "Tìm kiếm tài liệu, hướng dẫn huấn luyện AI và tài liệu xử lý sự cố hệ thống."}
          </p>

          <div className="relative mt-6 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#607096] pointer-events-none" />
            <input
              className="w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-11 pr-28 text-xs font-medium text-white placeholder-white/60 focus:bg-white focus:text-[#14244B] focus:outline-none transition-colors"
              placeholder={t("admin.help.searchExample") || "Tìm kiếm 'RAG Latency', 'Chu kỳ thanh toán', 'Token usage'..."}
              type="text"
            />
            <button
              type="button"
              className="absolute right-1.5 top-1.5 rounded-lg bg-[#204195] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#183377] transition-all cursor-pointer"
            >
              {t("admin.help.searchCta") || "TÌM KIẾM"}
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Support Topics & Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Knowledge Topics */}
        <div className="space-y-6 lg:col-span-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {categories.map((c) => {
              const IconComp = c.icon;
              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs hover:border-[#204195]/40 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FD] text-[#204195] mb-4">
                    <IconComp className="size-5" />
                  </div>
                  <h3 className="font-headline text-base font-bold text-[#14244B]">
                    {t(c.titleKey)}
                  </h3>
                  <p className="mt-1 text-xs text-[#607096] leading-relaxed">
                    {t(c.descriptionKey)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Featured Guides */}
          <div className="rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs">
            <h3 className="font-headline text-base font-bold text-[#14244B] mb-4">
              {t("admin.help.featuredArticles") || "Tài liệu & Hướng dẫn nổi bật"}
            </h3>
            <div className="divide-y divide-[#EAEFF8]">
              {articles.map((art) => {
                const Icon = art.icon;
                return (
                  <div
                    key={art.id}
                    className="flex items-center justify-between py-3.5 hover:bg-[#F8FAFC] px-2 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`size-4 ${art.iconClass}`} />
                      <span className="text-xs font-semibold text-[#14244B] group-hover:text-[#204195] transition-colors">
                        {t(art.titleKey)}
                      </span>
                    </div>
                    <ChevronRight className="size-4 text-[#607096] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: System Status & Support Contact */}
        <div className="space-y-6 lg:col-span-4">
          {/* System Health */}
          <div className="rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs">
            <h3 className="font-headline text-sm font-bold text-[#14244B] mb-4">
              {t("admin.help.systemHealth") || "Trạng thái Hệ thống"}
            </h3>
            <div className="space-y-3">
              {statuses.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs py-2 border-b border-[#EAEFF8] last:border-b-0">
                  <span className="text-[#607096]">{t(s.labelKey)}</span>
                  {s.status === "operational" ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                      <CheckCircle className="size-3.5 text-emerald-600" />
                      {t("admin.help.status.operational") || "HOẠT ĐỘNG TỐT"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                      <AlertCircle className="size-3.5 text-amber-600" />
                      {t("admin.help.status.degraded") || "BỊ CHẬM / SUY GIẢM"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Support Card */}
          <div className="rounded-2xl border border-[#DCE4F3] bg-gradient-to-br from-[#EEF2FD] to-white p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="size-5 text-[#204195]" />
              <h4 className="font-headline text-sm font-bold text-[#14244B]">
                {t("admin.help.supportChannelTitle") || "Kênh Hỗ trợ Kỹ thuật"}
              </h4>
            </div>
            <p className="text-xs text-[#607096] leading-relaxed mb-4">
              {t("admin.help.supportChannelDesc") || "Cần hỗ trợ tích hợp API, mở rộng quota LLM hoặc cấu hình Docker? Liên hệ đội ngũ kỹ sư vận hành INTERVIA."}
            </p>
            <a
              href={`mailto:${t("admin.help.supportEmail") || "support@intervia.io"}`}
              className="inline-block w-full rounded-xl bg-[#204195] py-2.5 text-center text-xs font-semibold text-white shadow-xs hover:bg-[#183377] transition-all"
            >
              {t("admin.help.supportEmail") || "support@intervia.io"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
