/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  Plus,
  LayoutDashboard,
  Users,
  Briefcase,
  Database,
  FileQuestion,
  ClipboardCheck,
  MessageSquare,
  Cpu,
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
  Menu,
  X,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { ConfirmDialog } from "@components/shared/ConfirmDialog";
import { useDialogA11y } from "@components/shared/useDialogA11y";
import { FoxAvatar } from "@features/mascot/components/FoxAvatar";
import { useAuthProfile } from "@features/auth/hooks/useAuthProfile";
import { performClientLogout } from "@features/auth/services/auth.service";

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
  // Mobile navigation drawer (the desktop sidebar is hidden below md).
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const drawerRef = useDialogA11y<HTMLDivElement>(mobileNavOpen, closeMobileNav);
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

  const displayName = profile?.name || profile?.email || t("fixAdmin.shell.adminBadge");
  const roleLabel = t("admin.role.seniorAdmin");
  const navReady = useIsClient();

  const isActive = useMemo(
    () => ({
      dashboard: pathname === "/admin/dashboard" || pathname === "/admin",
      users: pathname.startsWith("/admin/users"),
      jobProfiles:
        pathname === "/admin/job-descriptions" ||
        pathname === "/admin/job-profiles" ||
        ((pathname.startsWith("/admin/job-descriptions/") || pathname.startsWith("/admin/job-profiles/")) &&
          !pathname.startsWith("/admin/job-descriptions/create") &&
          !pathname.startsWith("/admin/job-profiles/create")),
      createJob:
        pathname.startsWith("/admin/job-descriptions/create") ||
        pathname.startsWith("/admin/job-profiles/create"),
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
    /** Placeholder page: the backend is not connected yet. */
    soon?: boolean;
  };

  const navGroupOverview: NavItem[] = [
    { href: "/admin/dashboard", label: t("admin.sidebar.dashboard"), Icon: LayoutDashboard, active: isActive.dashboard },
  ];

  const navGroupPeople: NavItem[] = [
    { href: "/admin/users", label: t("admin.sidebar.users"), Icon: Users, active: isActive.users },
  ];

  const navGroupContent: NavItem[] = [
    { href: "/admin/job-descriptions", label: t("admin.sidebar.jobBoard"), Icon: Briefcase, active: isActive.jobProfiles },
    { href: "/admin/question-bank", label: t("admin.sidebar.questionBank"), Icon: FileQuestion, active: isActive.questionBank },
    { href: "/admin/taxonomy", label: t("fixAdmin.shell.taxonomy"), Icon: Tags, active: isActive.taxonomy },
    { href: "/admin/rubrics", label: t("admin.sidebar.rubrics"), Icon: ClipboardCheck, active: isActive.rubrics },
    { href: "/admin/knowledge-base", label: t("admin.sidebar.knowledgeBase"), Icon: Database, active: isActive.knowledgeBase },
  ];

  const navGroupInterviews: NavItem[] = [
    { href: "/admin/interviews", label: t("admin.sidebar.interviews"), Icon: MessageSquare, active: isActive.interviews },
  ];

  const navGroupAiOps: NavItem[] = [
    { href: "/admin/ai", label: t("admin.sidebar.aiOverview"), Icon: Cpu, active: isActive.aiOverview, soon: true },
    { href: "/admin/ai/models", label: t("admin.sidebar.aiModels"), Icon: Box, active: isActive.aiModels, soon: true },
    { href: "/admin/ai/prompts", label: t("admin.sidebar.aiPrompts"), Icon: Terminal, active: isActive.aiPrompts, soon: true },
    { href: "/admin/ai/traces", label: t("admin.sidebar.aiTraces"), Icon: Activity, active: isActive.aiTraces, soon: true },
    { href: "/admin/ai/usage", label: t("admin.sidebar.aiUsage"), Icon: Coins, active: isActive.aiUsage, soon: true },
    { href: "/admin/ai/errors", label: t("admin.sidebar.aiErrors"), Icon: AlertOctagon, active: isActive.aiErrors, soon: true },
  ];

  const navGroupEvaluation: NavItem[] = [
    { href: "/admin/evaluation", label: t("admin.sidebar.evalOverview"), Icon: Target, active: isActive.evaluation, soon: true },
    { href: "/admin/evaluation/datasets", label: t("admin.sidebar.evalDatasets"), Icon: Database, active: isActive.evalDatasets, soon: true },
    { href: "/admin/evaluation/experiments", label: t("admin.sidebar.evalExperiments"), Icon: FlaskConical, active: isActive.evalExperiments, soon: true },
    { href: "/admin/evaluation/regression", label: t("admin.sidebar.evalRegression"), Icon: GitCompare, active: isActive.evalRegression, soon: true },
  ];

  const navGroupAnalytics: NavItem[] = [
    { href: "/admin/insights", label: t("admin.sidebar.insights"), Icon: TrendingUp, active: isActive.insights },
  ];

  const navGroupSystem: NavItem[] = [
    { href: "/admin/audit-logs", label: t("admin.sidebar.auditLogs"), Icon: ScrollText, active: isActive.auditLogs, soon: true },
    { href: "/admin/settings", label: t("admin.sidebar.settings"), Icon: Settings, active: isActive.settings },
  ];


  const soonBadge = (
    <span className="rounded-full bg-[#F0F4FC] px-1.5 py-0.5 text-[9px] font-semibold text-[#607096]">
      {t("fixAdmin.shell.soon")}
    </span>
  );

  const brandMark = (collapsed: boolean, onNavigate?: () => void) =>
    collapsed ? (
      <div className="flex justify-center">
        <Link
          href="/admin/dashboard"
          onClick={onNavigate}
          className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-[#DCE4F3] hover:opacity-90"
          title={t("fixAdmin.shell.brandTitle")}
          aria-label={t("fixAdmin.shell.brandTitle")}
        >
          <FoxAvatar size={36} />
        </Link>
      </div>
    ) : (
      <div className="flex min-w-0 items-center">
        <Link
          href="/admin/dashboard"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-2.5 rounded-xl px-1 py-1 transition-opacity hover:opacity-90"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-[#DCE4F3]">
            <FoxAvatar size={34} />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="truncate font-display text-base font-semibold tracking-tight text-[#14244B]">Intervia</span>
              <span className="rounded-full bg-[#F0F4FC] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#204195]">
                {t("fixAdmin.shell.adminBadge")}
              </span>
            </span>
            <span className="block truncate text-[10.5px] font-medium text-[#607096]">{t("fixAdmin.shell.console")}</span>
          </span>
        </Link>
      </div>
    );

  const createButton = (collapsed: boolean, onNavigate?: () => void) =>
    collapsed ? (
      <Link
        href="/admin/job-descriptions/create"
        onClick={onNavigate}
        className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#204195] text-white shadow-xs transition-all hover:bg-[#183275] hover:shadow-sm active:scale-[0.99]"
        title={t("admin.sidebar.createProfile")}
        aria-label={t("admin.sidebar.createProfile")}
      >
        <Plus className="size-4" />
      </Link>
    ) : (
      <Link
        href="/admin/job-descriptions/create"
        onClick={onNavigate}
        className="flex min-h-9 w-full items-center justify-center gap-2 rounded-full bg-[#204195] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#183275] hover:shadow-sm active:scale-[0.99]"
      >
        <Plus className="size-3.5" />
        <span>{t("admin.sidebar.createProfile")}</span>
      </Link>
    );

  const groups = [
    { title: t("admin.sidebar.group.overview"), items: navGroupOverview },
    { title: t("admin.sidebar.group.people"), items: navGroupPeople },
    { title: t("admin.sidebar.group.content"), items: navGroupContent },
    { title: t("admin.sidebar.group.interviews"), items: navGroupInterviews },
    { title: t("admin.sidebar.group.aiOps"), items: navGroupAiOps },
    { title: t("admin.sidebar.group.evaluation"), items: navGroupEvaluation },
    { title: t("admin.sidebar.group.analytics"), items: navGroupAnalytics },
    { title: t("admin.sidebar.group.system"), items: navGroupSystem },
  ];

  const navGroups = (collapsed: boolean, onNavigate?: () => void) => (
    <nav className="space-y-3 pt-1" aria-label={t("fixAdmin.shell.menuTitle")}>
      {groups.map((group, groupIdx) => (
        <div key={group.title}>
          {groupIdx > 0 && <div className={`${collapsed ? "mx-auto my-2 w-6" : "mx-2 my-2"} h-px bg-[#EAEFF8]`} />}
          {!collapsed && (
            <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#8A98B8]">{group.title}</p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.active;
              const label = item.soon ? `${item.label} (${t("fixAdmin.shell.soon")})` : item.label;
              if (collapsed) {
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={label}
                      aria-label={label}
                      aria-current={navReady && active ? "page" : undefined}
                      className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-150 ${
                        navReady && active
                          ? "bg-[#EEF2FD] text-[#204195]"
                          : item.soon
                            ? "text-[#A3AFC8] hover:bg-[#F2F5FC] hover:text-[#607096]"
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
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={navReady && active ? "page" : undefined}
                    className={linkClass(active)}
                  >
                    <item.Icon className="size-3.5 shrink-0" />
                    <span className={`flex-1 truncate text-xs ${item.soon && !(navReady && active) ? "text-[#8A98B8]" : ""}`}>
                      {item.label}
                    </span>
                    {item.soon ? soonBadge : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const avatar = (
    <>
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
    </>
  );

  const sidebarFooter = (collapsed: boolean, onNavigate?: () => void) => (
    <div className={`shrink-0 space-y-2 border-t border-[#EAEFF8] bg-white ${collapsed ? "p-2" : "p-3"}`}>
      {!collapsed ? (
        <>
          <div className="flex items-center justify-between px-1">
            <Link
              href="/admin/help"
              onClick={onNavigate}
              className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold transition-colors ${
                isActive.help ? "bg-[#204195]/10 text-[#204195]" : "text-[#607096] hover:bg-[#F7F9FD] hover:text-[#204195]"
              }`}
            >
              <HelpCircle className="size-3.5" />
              <span>{t("common.helpCenter")}</span>
            </Link>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC] p-1.5 transition-colors hover:border-[#C5D2E7] hover:bg-[#FAFBFE]">
            <Link
              href="/admin/profile"
              onClick={onNavigate}
              className="group flex min-w-0 flex-1 items-center gap-2 overflow-hidden"
              aria-label={`${t("fixAdmin.shell.profile")}: ${displayName}`}
              title={displayName}
            >
              {avatar}
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-xs font-bold text-[#14244B] transition-colors group-hover:text-[#204195]">{displayName}</p>
                <p className="flex items-center gap-1 truncate text-[10px] font-semibold text-[#204195]">
                  <Shield className="size-3 text-[#204195]" />
                  {roleLabel}
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => {
                onNavigate?.();
                setShowLogoutModal(true);
              }}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#607096] transition-colors hover:bg-[#FDF2F2] hover:text-[#C43B3B]"
              title={t("common.logout")}
              aria-label={t("common.logout")}
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Link
            href="/admin/help"
            onClick={onNavigate}
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
              isActive.help ? "bg-[#204195]/10 text-[#204195]" : "text-[#607096] hover:bg-[#F7F9FD] hover:text-[#204195]"
            }`}
            title={t("common.helpCenter")}
            aria-label={t("common.helpCenter")}
          >
            <HelpCircle className="size-4" />
          </Link>

          <div className="my-0.5 h-px w-8 bg-[#EAEFF8]" />

          <Link
            href="/admin/profile"
            onClick={onNavigate}
            className="flex h-9 w-9 items-center justify-center"
            title={displayName}
            aria-label={`${t("fixAdmin.shell.profile")}: ${displayName}`}
          >
            {avatar}
          </Link>

          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#607096] transition-colors hover:bg-[#FDF2F2] hover:text-[#C43B3B]"
            title={t("common.logout")}
            aria-label={t("common.logout")}
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );

  const handleLogout = () => {
    setShowLogoutModal(false);
    performClientLogout("/admin/login");
  };

  return (
    <>
      <ConfirmDialog
        open={showLogoutModal}
        title={t("userDash.logoutModal.title")}
        body={t("fixAdmin.shell.logoutBody")}
        confirmLabel={t("userDash.logoutModal.confirm")}
        cancelLabel={t("userDash.logoutModal.cancel")}
        tone="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      <div className="min-h-screen bg-[#F8FAFC] font-body text-[#14244B]">
        {/* Mobile Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-[#DCE4F3] bg-white px-4 py-2.5 md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label={t("fixAdmin.shell.openMenu")}
              aria-expanded={mobileNavOpen}
              aria-controls="admin-mobile-nav"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#14244B] transition-colors hover:bg-[#F0F4FC]"
            >
              <Menu className="size-5" />
            </button>
            {brandMark(false)}
          </div>
          <Link
            href="/admin/profile"
            aria-label={t("fixAdmin.shell.profile")}
            className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#DCE4F3] bg-[#204195] text-xs font-bold text-[#FCB625]"
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
        </header>

        {/* Mobile navigation drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-[60] md:hidden">
            <div className="absolute inset-0 bg-[#14244B]/40" onClick={closeMobileNav} aria-hidden="true" />
            <div
              ref={drawerRef}
              id="admin-mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label={t("fixAdmin.shell.menuTitle")}
              tabIndex={-1}
              className="anim-pop absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col justify-between bg-white shadow-[0_30px_80px_-30px_rgba(20,36,75,0.5)] outline-none"
            >
              <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-3.5">
                <div className="flex items-center justify-between gap-2">
                  {brandMark(false, closeMobileNav)}
                  <button
                    type="button"
                    onClick={closeMobileNav}
                    aria-label={t("fixAdmin.shell.closeMenu")}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#607096] transition-colors hover:bg-[#F0F4FC] hover:text-[#14244B]"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                {createButton(false, closeMobileNav)}
                {navGroups(false, closeMobileNav)}
              </div>
              {sidebarFooter(false, closeMobileNav)}
            </div>
          </div>
        )}

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
            {brandMark(isCollapsed)}
            {createButton(isCollapsed)}
            {navGroups(isCollapsed)}
          </div>

          {sidebarFooter(isCollapsed)}
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
