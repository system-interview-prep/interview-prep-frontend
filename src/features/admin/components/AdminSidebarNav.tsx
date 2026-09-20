"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Brain,
  Plus,
  Database,
  MessageSquare,
  Settings,
  HelpCircle,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

interface NavItem {
  href: string;
  labelKey: string;
  defaultLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: string;
}

interface NavSection {
  titleKey: string;
  defaultTitle: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    titleKey: "admin.nav.section.overview",
    defaultTitle: "Tổng quan",
    items: [
      {
        href: "/admin/dashboard",
        labelKey: "admin.sidebar.jobBoard",
        defaultLabel: "Mô tả công việc (JD)",
        icon: LayoutDashboard,
        exact: true,
      },
      {
        href: "/admin/insights",
        labelKey: "admin.aiInsights",
        defaultLabel: "Phân tích AI",
        icon: Brain,
        badge: "Mock",
      },
    ],
  },
  {
    titleKey: "admin.nav.section.content",
    defaultTitle: "Nghiệp vụ & Dữ liệu",
    items: [
      {
        href: "/admin/job-descriptions/create",
        labelKey: "admin.sidebar.createProfile",
        defaultLabel: "Tạo Job Description",
        icon: Plus,
      },
      {
        href: "/admin/knowledge-base",
        labelKey: "admin.knowledgeBase",
        defaultLabel: "Cơ sở tri thức (RAG)",
        icon: Database,
      },
    ],
  },
  {
    titleKey: "admin.nav.section.interviews",
    defaultTitle: "Phỏng vấn & Ứng viên",
    items: [
      {
        href: "/admin/interviews",
        labelKey: "admin.interviews",
        defaultLabel: "Phiên phỏng vấn",
        icon: MessageSquare,
        badge: "Mock",
      },
    ],
  },
  {
    titleKey: "admin.nav.section.system",
    defaultTitle: "Hệ thống",
    items: [
      {
        href: "/admin/settings",
        labelKey: "common.settings",
        defaultLabel: "Cài đặt",
        icon: Settings,
      },
      {
        href: "/admin/help",
        labelKey: "common.helpCenter",
        defaultLabel: "Trợ giúp",
        icon: HelpCircle,
      },
    ],
  },
];

export default function AdminSidebarNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const isActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <nav className="flex-1 space-y-6" aria-label="Admin Navigation">
      {NAV_SECTIONS.map((section) => (
        <div key={section.defaultTitle} className="space-y-1.5">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#8A98B8]">
            {t(section.titleKey) !== section.titleKey ? t(section.titleKey) : section.defaultTitle}
          </p>
          <div className="space-y-1">
            {section.items.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              const label = t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.defaultLabel;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center justify-between rounded-xl border-2 px-3 py-2 text-xs font-semibold transition-all ${
                    active
                      ? "border-[#234196] bg-[#FCB625] text-[#234196] shadow-[2px_2px_0_#234196]"
                      : "border-transparent text-[#5A6B8F] hover:border-[#234196] hover:bg-[#F0F4FC] hover:text-[#234196]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`size-4 shrink-0 transition-transform group-hover:scale-105 ${
                        active ? "text-[#234196]" : "text-[#5A6B8F] group-hover:text-[#234196]"
                      }`}
                    />
                    <span className="truncate">{label}</span>
                  </div>
                  {item.badge ? (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                        active
                          ? "bg-[#234196] text-white"
                          : "border border-amber-300 bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
