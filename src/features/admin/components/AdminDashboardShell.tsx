/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  Plus,
  LayoutDashboard,
  Users,
  Briefcase,
  Database,
  FileQuestion,
  ClipboardCheck,
  MessageSquare,
  Sparkles,
  Box,
  Terminal,
  Activity,
  Coins,
  AlertOctagon,
  Target,
  FlaskConical,
  GitCompare,
  TrendingUp,
  ScrollText,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Tags,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useAuthProfile } from "@features/auth/hooks/useAuthProfile";
import { performClientLogout } from "@features/auth/services/auth.service";
import LanguageToggleButton from "@components/shared/LanguageToggleButton";

const subscribeNothing = () => () => {};

function useIsClient() {
  return useSyncExternalStore(subscribeNothing, () => true, () => false);
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function subscribeSidebar(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("admin-sidebar-toggle", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("admin-sidebar-toggle", callback);
  };
}

function getSidebarSnapshot(): boolean {
  try {
    return localStorage.getItem("admin.sidebarCollapsed") === "true";
  } catch {
    return false;
  }
}

function getSidebarServerSnapshot(): boolean {
  return false;
}

export default function AdminDashboardShell({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const pathname = usePathname();

  const { profile } = useAuthProfile();
  const [avatarError, setAvatarError] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const isCollapsed = useSyncExternalStore(subscribeSidebar, getSidebarSnapshot, getSidebarServerSnapshot);

  const toggleSidebar = () => {
    try {
      const next = !getSidebarSnapshot();
      localStorage.setItem("admin.sidebarCollapsed", String(next));
      window.dispatchEvent(new Event("admin-sidebar-toggle"));
    } catch {
      // ignore
    }
  };

  const displayName = profile?.name || profile?.email || "Admin";
  const roleLabel = t("admin.role.seniorAdmin") || "Senior Administrator";
  const navReady = useIsClient();

  const isActive = useMemo(
    () => ({
      dashboard: pathname === "/admin/dashboard" || pathname === "/admin",
      users: pathname.startsWith("/admin/users"),
      jobProfiles: pathname === "/admin/job-profiles" || (pathname.startsWith("/admin/job-profiles/") && !pathname.startsWith("/admin/job-profiles/create")),
      createJob: pathname.startsWith("/admin/job-profiles/create"),
      questionBank: pathname.startsWith("/admin/question-bank"),
      taxonomy: pathname.startsWith("/admin/taxonomy"),
      rubrics: pathname.startsWith("/admin/rubrics"),
      knowledgeBase: pathname.startsWith("/admin/knowledge-base"),
      interviews: pathname.startsWith("/admin/interviews"),
      aiOverview: pathname === "/admin/ai",
      aiModels: pathname.startsWith("/admin/ai/models"),
      aiPrompts: pathname.startsWith("/admin/ai/prompts"),
      aiTraces: pathname.startsWith("/admin/ai/traces"),
      aiUsage: pathname.startsWith("/admin/ai/usage"),
      aiErrors: pathname.startsWith("/admin/ai/errors"),
      evaluation: pathname === "/admin/evaluation",
      evalDatasets: pathname.startsWith("/admin/evaluation/datasets"),
      evalExperiments: pathname.startsWith("/admin/evaluation/experiments"),
      evalRegression: pathname.startsWith("/admin/evaluation/regression"),
      insights: pathname.startsWith("/admin/insights"),
      auditLogs: pathname.startsWith("/admin/audit-logs"),
      settings: pathname.startsWith("/admin/settings"),
      help: pathname.startsWith("/admin/help"),
      profile: pathname.startsWith("/admin/profile"),
    }),
    [pathname]
  );

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const navBase =
    "flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs transition-all duration-150 motion-reduce:transition-none";
  const navInactive =
    "font-medium text-[#607096] hover:bg-[#F2F5FC] hover:text-[#204195]";
  const navActive =
    "bg-[#EEF2FD] font-bold text-[#204195] shadow-xs";

  const linkClass = (active: boolean) =>
    `${navBase} ${navReady && active ? navActive : navInactive}`;

  type NavItem = {
    href: string;
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    active: boolean;
    badge?: string;
  };

  const navGroupOverview: NavItem[] = [
    { href: "/admin/dashboard", label: t("admin.sidebar.dashboard") || "Dashboard Overview", Icon: LayoutDashboard, active: isActive.dashboard },
  ];

  const navGroupPeople: NavItem[] = [
    { href: "/admin/users", label: t("admin.sidebar.users") || "Users & Candidates", Icon: Users, active: isActive.users },
  ];

  const navGroupContent: NavItem[] = [
    { href: "/admin/job-profiles", label: t("admin.sidebar.jobBoard") || "Job Descriptions (JD)", Icon: Briefcase, active: isActive.jobProfiles },
    { href: "/admin/question-bank", label: t("admin.sidebar.questionBank") || "Question Bank", Icon: FileQuestion, active: isActive.questionBank },
    { href: "/admin/taxonomy", label: "Taxonomy", Icon: Tags, active: isActive.taxonomy },
    { href: "/admin/rubrics", label: t("admin.sidebar.rubrics") || "Scoring Rubrics", Icon: ClipboardCheck, active: isActive.rubrics },
    { href: "/admin/knowledge-base", label: t("admin.sidebar.knowledgeBase") || "Knowledge Base (RAG)", Icon: Database, active: isActive.knowledgeBase },
  ];

  const navGroupInterviews: NavItem[] = [
    { href: "/admin/interviews", label: t("admin.sidebar.interviews") || "Interview Sessions", Icon: MessageSquare, active: isActive.interviews },
  ];

  const navGroupAiOps: NavItem[] = [
    { href: "/admin/ai", label: t("admin.sidebar.aiOverview") || "AI Overview", Icon: Sparkles, active: isActive.aiOverview },
    { href: "/admin/ai/models", label: t("admin.sidebar.aiModels") || "Model Registry", Icon: Box, active: isActive.aiModels },
    { href: "/admin/ai/prompts", label: t("admin.sidebar.aiPrompts") || "Prompt Management", Icon: Terminal, active: isActive.aiPrompts },
    { href: "/admin/ai/traces", label: t("admin.sidebar.aiTraces") || "Traces & Logs", Icon: Activity, active: isActive.aiTraces },
    { href: "/admin/ai/usage", label: t("admin.sidebar.aiUsage") || "Token & Cost Usage", Icon: Coins, active: isActive.aiUsage },
    { href: "/admin/ai/errors", label: t("admin.sidebar.aiErrors") || "AI Incidents & Errors", Icon: AlertOctagon, active: isActive.aiErrors },
  ];

  const navGroupEvaluation: NavItem[] = [
    { href: "/admin/evaluation", label: t("admin.sidebar.evalOverview") || "Evaluation Overview", Icon: Target, active: isActive.evaluation },
    { href: "/admin/evaluation/datasets", label: t("admin.sidebar.evalDatasets") || "Test Datasets", Icon: Database, active: isActive.evalDatasets },
    { href: "/admin/evaluation/experiments", label: t("admin.sidebar.evalExperiments") || "A/B Experiments", Icon: FlaskConical, active: isActive.evalExperiments },
    { href: "/admin/evaluation/regression", label: t("admin.sidebar.evalRegression") || "Regression Testing", Icon: GitCompare, active: isActive.evalRegression },
  ];

  const navGroupAnalytics: NavItem[] = [
    { href: "/admin/insights", label: t("admin.sidebar.insights") || "Operational Analytics", Icon: TrendingUp, active: isActive.insights },
  ];

  const navGroupSystem: NavItem[] = [
    { href: "/admin/audit-logs", label: t("admin.sidebar.auditLogs") || "Audit Logs", Icon: ScrollText, active: isActive.auditLogs },
    { href: "/admin/settings", label: t("admin.sidebar.settings") || "System Settings", Icon: Settings, active: isActive.settings },
  ];

  const handleLogout = () => {
    setShowLogoutModal(false);
    performClientLogout("/admin/login");
  };

  return (
    <>
      {/* Logout Confirm Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-logout-modal-title"
        >
          <div
            className="absolute inset-0 bg-[#14244B]/40 backdrop-blur-sm"
            onClick={() => setShowLogoutModal(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-[0_20px_60px_rgba(20,36,75,0.15)]">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <LogOut className="size-5 text-red-500" />
            </div>
            <h2
              id="admin-logout-modal-title"
              className="mb-1.5 text-center text-[17px] font-bold text-[#14244B]"
            >
              {t("userDash.logoutModal.title") || "Đăng xuất tài trị?"}
            </h2>
            <p className="mb-6 text-center text-sm text-[#607096]">
              {t("userDash.logoutModal.desc") || "Bạn có chắc chắn muốn đăng xuất khỏi trang quản trị INTERVIA?"}
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-10 w-full items-center justify-center rounded-xl bg-red-500 text-sm font-semibold text-white transition-all hover:bg-red-600 active:scale-[0.98] cursor-pointer"
              >
                {t("userDash.logoutModal.confirm") || "Đăng xuất"}
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex h-10 w-full items-center justify-center rounded-xl border border-[#DCE4F3] bg-white text-sm font-medium text-[#607096] transition-all hover:bg-[#F7F9FD] hover:text-[#14244B] active:scale-[0.98] cursor-pointer"
              >
                {t("userDash.logoutModal.cancel") || "Hủy"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[#F8FAFC] font-body text-[#14244B]">
        {/* Mobile Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#DCE4F3] bg-white px-4 py-2.5 md:hidden">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#204195] text-[#FCB625] shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="font-headline text-base font-extrabold tracking-tight text-[#14244B]">INTERVIA</span>
              <span className="ml-1 rounded bg-[#EEF2FD] px-1.5 py-0.5 text-[9px] font-black uppercase text-[#204195]">Admin</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/profile"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#DCE4F3] bg-[#204195] text-xs font-bold text-[#FCB625] overflow-hidden"
              title={displayName}
            >
              {profile?.picture && !avatarError ? (
                <img
                  alt=""
                  src={profile.picture}
                  className="h-8 w-8 rounded-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                initialsFromName(displayName)
              )}
            </Link>
            <div className="h-4 w-px bg-[#DCE4F3]" />
            <LanguageToggleButton placement="bottom" className="h-8 rounded-xl px-2 text-xs" />
          </div>
        </header>

        {/* Desktop Sidebar */}
        <aside
          className={`fixed left-0 top-0 z-40 hidden h-dvh flex-col justify-between border-r border-[#DCE4F3] bg-white transition-[width] duration-300 ease-in-out md:flex ${
            isCollapsed ? "w-[72px]" : "w-64"
          }`}
        >
          {/* Floating Border Toggle Pill */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="absolute -right-3.5 top-7 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-[#DCE4F3] bg-white text-[#607096] shadow-[0_2px_8px_rgba(20,36,75,0.08)] transition-all duration-150 hover:scale-110 hover:border-[#204195] hover:bg-[#F8FAFC] hover:text-[#204195] active:scale-95 cursor-pointer"
            title={isCollapsed ? t("userDash.sidebar.expand") : t("userDash.sidebar.collapse")}
            aria-label={isCollapsed ? t("userDash.sidebar.expand") : t("userDash.sidebar.collapse")}
          >
            {isCollapsed ? (
              <ChevronRight className="size-3.5 stroke-[2.5]" />
            ) : (
              <ChevronLeft className="size-3.5 stroke-[2.5]" />
            )}
          </button>

          <div className={`flex-1 overflow-y-auto overscroll-contain space-y-4 ${isCollapsed ? "p-2.5" : "p-3.5"}`}>
            {/* Header / Brand */}
            {!isCollapsed ? (
              <div className="flex items-center">
                <Link
                  href="/admin/dashboard"
                  className="flex min-w-0 items-center gap-2.5 rounded-xl px-1 py-1 transition-opacity hover:opacity-90"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#204195] text-[#FCB625] shadow-xs">
                    <Sparkles size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h1 className="truncate text-base font-extrabold tracking-tight text-[#14244B]">
                        INTERVIA
                      </h1>
                      <span className="rounded bg-[#EEF2FD] px-1.5 py-0.5 text-[9px] font-black uppercase text-[#204195]">
                        Admin
                      </span>
                    </div>
                    <p className="truncate text-[10.5px] font-medium text-[#607096]">Operations Console</p>
                  </div>
                </Link>
              </div>
            ) : (
              <div className="flex justify-center">
                <Link
                  href="/admin/dashboard"
                  className="grid h-10 w-10 place-items-center rounded-xl bg-[#204195] text-[#FCB625] shadow-xs hover:opacity-90"
                  title="INTERVIA Admin"
                >
                  <Sparkles size={20} />
                </Link>
              </div>
            )}

            {/* Quick Action: New Job Profile */}
            {!isCollapsed ? (
              <Link
                href="/admin/job-profiles/create"
                className="flex min-h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#204195] hover:bg-[#183275] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:shadow-sm active:scale-[0.99]"
              >
                <Plus className="size-3.5" />
                <span>{t("admin.sidebar.createProfile") || "Tạo Job Profile"}</span>
              </Link>
            ) : (
              <Link
                href="/admin/job-profiles/create"
                className="flex h-9 w-9 mx-auto items-center justify-center rounded-xl bg-[#204195] hover:bg-[#183275] text-white shadow-xs transition-all hover:shadow-sm active:scale-[0.99]"
                title={t("admin.sidebar.createProfile") || "Tạo Job Profile"}
              >
                <Plus className="size-4" />
              </Link>
            )}

            {/* Grouped Nav Items */}
            <nav className="space-y-3 pt-1">
              {[
                { title: t("admin.sidebar.group.overview") || "Overview", items: navGroupOverview },
                { title: t("admin.sidebar.group.people") || "People", items: navGroupPeople },
                { title: t("admin.sidebar.group.content") || "Interview Content", items: navGroupContent },
                { title: t("admin.sidebar.group.interviews") || "Interview Operations", items: navGroupInterviews },
                { title: t("admin.sidebar.group.aiOps") || "AI Operations", items: navGroupAiOps },
                { title: t("admin.sidebar.group.evaluation") || "AI Evaluation (Eval)", items: navGroupEvaluation },
                { title: t("admin.sidebar.group.analytics") || "Product Analytics", items: navGroupAnalytics },
                { title: t("admin.sidebar.group.system") || "System", items: navGroupSystem },
              ].map((group, groupIdx) => (
                <div key={group.title}>
                  {groupIdx > 0 && (
                    <div className={`${isCollapsed ? "mx-auto w-6 my-2" : "mx-2 my-2"} h-px bg-[#EAEFF8]`} />
                  )}
                  {!isCollapsed && (
                    <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#8A98B8]">
                      {group.title}
                    </p>
                  )}
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = item.active;
                      if (isCollapsed) {
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              title={item.label}
                              aria-label={item.label}
                              className={`flex h-9 w-9 mx-auto items-center justify-center rounded-lg transition-all duration-150 ${
                                active
                                  ? "bg-[#EEF2FD] text-[#204195]"
                                  : "text-[#667085] hover:bg-[#F2F5FC] hover:text-[#204195]"
                              }`}
                            >
                              <item.Icon className="size-4" />
                            </Link>
                          </li>
                        );
                      }
                      return (
                        <li key={item.href}>
                          <Link href={item.href} className={linkClass(active)}>
                            <item.Icon className="size-3.5 shrink-0" />
                            <span className="flex-1 truncate text-xs">{item.label}</span>
                            {item.badge ? (
                              <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-black uppercase text-amber-800">
                                {item.badge}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className={`shrink-0 border-t border-[#EAEFF8] bg-white space-y-2 ${isCollapsed ? "p-2" : "p-3"}`}>
            {!isCollapsed ? (
              <>
                {/* 1. Utility row: [Help] | [Language] */}
                <div className="flex items-center justify-between px-1">
                  <Link
                    href="/admin/help"
                    className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
                      isActive.help
                        ? "bg-[#204195]/10 text-[#204195]"
                        : "text-[#607096] hover:bg-[#F7F9FD] hover:text-[#204195]"
                    }`}
                  >
                    <HelpCircle className="size-3.5" />
                    <span>{t("common.helpCenter") || "Trợ giúp"}</span>
                  </Link>

                  <LanguageToggleButton placement="top" className="h-7 rounded-xl px-2 text-xs" />
                </div>

                {/* 2. Admin Profile Card */}
                <div className="flex items-center justify-between gap-2 rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-1.5 transition-colors hover:border-[#C5D2E7] hover:bg-[#FAFBFE]">
                  <Link
                    href="/admin/profile"
                    className="group flex min-w-0 flex-1 items-center gap-2 overflow-hidden"
                    aria-label={t("userDash.nav.profile") || "Hồ sơ"}
                    title={displayName}
                  >
                    {profile?.picture && !avatarError ? (
                      <img
                        alt=""
                        src={profile.picture}
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarError(true)}
                        className="h-8 w-8 shrink-0 rounded-full border border-[#DCE4F3] object-cover shadow-2xs"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#DCE4F3] bg-[#204195] text-xs font-bold text-[#FCB625] shadow-2xs"
                      >
                        {displayName ? initialsFromName(displayName) : "A"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-xs font-bold text-[#14244B] transition-colors group-hover:text-[#204195]">
                        {displayName}
                      </p>
                      <p className="truncate text-[10px] font-semibold text-[#204195] flex items-center gap-1">
                        <Shield className="size-3 text-[#204195]" />
                        {roleLabel}
                      </p>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setShowLogoutModal(true)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#607096] transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
                    title={t("common.logout") || "Đăng xuất"}
                    aria-label={t("common.logout") || "Đăng xuất"}
                  >
                    <LogOut className="size-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                {/* 1. LANGUAGE AND HELP */}
                <LanguageToggleButton compact placement="top" />

                <Link
                  href="/admin/help"
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                    isActive.help
                      ? "bg-[#204195]/10 text-[#204195]"
                      : "text-[#607096] hover:bg-[#F7F9FD] hover:text-[#204195]"
                  }`}
                  title={t("common.helpCenter") || "Trợ giúp"}
                >
                  <HelpCircle className="size-4" />
                </Link>

                <div className="w-8 h-px bg-[#EAEFF8] my-0.5" />

                {/* 2. PROFILE SECOND */}
                <Link
                  href="/admin/profile"
                  className="flex h-9 w-9 items-center justify-center"
                  title={displayName}
                >
                  {profile?.picture && !avatarError ? (
                    <img
                      alt=""
                      src={profile.picture}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
                      className="h-8 w-8 shrink-0 rounded-full border border-[#DCE4F3] object-cover shadow-2xs"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#DCE4F3] bg-[#204195] text-xs font-bold text-[#FCB625] shadow-2xs"
                    >
                      {displayName ? initialsFromName(displayName) : "A"}
                    </div>
                  )}
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main
          className={`min-h-screen transition-[margin] duration-300 ease-in-out px-4 py-8 sm:px-6 md:px-8 lg:px-10 ${
            isCollapsed ? "md:ml-[72px]" : "md:ml-64"
          }`}
        >
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </>
  );
}
