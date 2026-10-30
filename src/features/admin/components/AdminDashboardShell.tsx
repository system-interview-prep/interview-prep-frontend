/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AdminAlertsBanner, { AdminAlertsNavBadge } from "@features/admin/pipeline/components/AdminAlertsBanner";
import AdminNotificationBell from "@features/admin/notifications/AdminNotificationBell";
import AdminNotificationToasts from "@features/admin/notifications/AdminNotificationToasts";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileQuestion,
  ClipboardCheck,
  MessageSquare,
  MessageSquareQuote,
  Cpu,
  Box,
  Activity,
  Target,
  ScrollText,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Shield,
  Tags,
  Menu,
  X,
  GitCompareArrows,
  FileScan,
  ChartColumn,
  CalendarCheck,
  HeartPulse,
  BookOpenCheck,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { ConfirmDialog } from "@components/shared/ConfirmDialog";
import { useDialogA11y } from "@components/shared/useDialogA11y";
import { BrandLogo } from "@components/shared/BrandLogo";
import { usePageTitle } from "@components/shared/usePageTitle";
import { useAuthProfile } from "@features/auth/hooks/useAuthProfile";
import { performClientLogout } from "@features/auth/services/auth.service";
import { adminHomePath, canOpenAdminPath, isFullAdmin, primaryAdminRole } from "@features/admin/access";
import { formatUserRole } from "@/i18n/roles";

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
  const router = useRouter();

  const { profile } = useAuthProfile();
  const [avatarError, setAvatarError] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  // Mobile navigation drawer (the desktop sidebar is hidden below md).
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [soonOpen, setSoonOpen] = useState(false);
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

  const navReady = useIsClient();
  // The profile comes from browser storage: read it only after hydration so the
  // server and first client render match (no hydration mismatch on name/initials).
  const clientProfile = navReady ? profile : null;
  const displayName = clientProfile?.name || clientProfile?.email || t("fixAdmin.shell.adminBadge");
  // Question authors and reviewers use the console too (access.ts): their menu,
  // home page and role badge follow their roles. Null until hydrated.
  const roles = clientProfile?.roles ?? null;
  const fullAdmin = !roles || roles.length === 0 || isFullAdmin(roles);
  const homePath = adminHomePath(roles);
  const mainRole = primaryAdminRole(roles);
  const roleLabel = mainRole && mainRole !== "ADMIN" ? formatUserRole(mainRole, t) : t("admin.role.seniorAdmin");
  const pageAllowed = canOpenAdminPath(pathname, roles);
  useEffect(() => {
    // The dashboard is where login and "/admin" land; send other roles to their own home.
    if (!pageAllowed && (pathname === "/admin/dashboard" || pathname === "/admin")) router.replace(homePath);
  }, [pageAllowed, pathname, homePath, router]);

  const isActive = useMemo(
    () => ({
      dashboard: pathname === "/admin/dashboard" || pathname === "/admin",
      users: pathname.startsWith("/admin/users"),
      jobProfiles: pathname.startsWith("/admin/job-descriptions") || pathname.startsWith("/admin/job-profiles"),
      questionBank: pathname.startsWith("/admin/question-bank"),
      questionQuality: pathname.startsWith("/admin/question-quality"),
      practice: pathname.startsWith("/admin/practice"),
      systemHealth: pathname.startsWith("/admin/system"),
      taxonomy: pathname.startsWith("/admin/taxonomy"),
      rubrics: pathname.startsWith("/admin/rubrics"),
      knowledgeBase: pathname.startsWith("/admin/knowledge-base"),
      interviews: pathname.startsWith("/admin/interviews"),
      matching: pathname.startsWith("/admin/matching"),
      cvParsing: pathname.startsWith("/admin/cv-parsing"),
      aiOverview: pathname === "/admin/ai",
      aiModels: pathname.startsWith("/admin/ai/models"),
      aiPrompts: pathname.startsWith("/admin/ai/prompts"),
      aiTraces: pathname.startsWith("/admin/ai/traces"),
      aiSpeech: pathname.startsWith("/admin/ai/speech"),
      aiPlaybook: pathname.startsWith("/admin/ai/playbook"),
      evaluation: pathname === "/admin/evaluation",
      evalDatasets: pathname.startsWith("/admin/evaluation/datasets"),
      evalExperiments: pathname.startsWith("/admin/evaluation/experiments"),
      evalRegression: pathname.startsWith("/admin/evaluation/regression"),
      auditLogs: pathname.startsWith("/admin/audit-logs"),
      settings: pathname.startsWith("/admin/settings"),
      help: pathname.startsWith("/admin/help"),
      profile: pathname.startsWith("/admin/profile"),
    }),
    [pathname]
  );

  // Browser tab "<menu item> | INTERVIA" on menu pages; nested pages keep their own metadata.
  const TAB_TITLE_KEYS: Record<string, string> = {
    "/admin/dashboard": "admin.sidebar.dashboard",
    "/admin/users": "admin.sidebar.users",
    "/admin/job-descriptions": "admin.sidebar.jobBoard",
    "/admin/question-bank": "admin.sidebar.questionBank",
    "/admin/question-quality": "adminOps.quality.title",
    "/admin/practice": "adminOps.practice.title",
    "/admin/system": "adminOps.health.title",
    "/admin/taxonomy": "fixAdmin.shell.taxonomy",
    "/admin/rubrics": "admin.sidebar.rubrics",
    "/admin/knowledge-base": "admin.sidebar.knowledgeBase",
    "/admin/interviews": "admin.sidebar.interviews",
    "/admin/cv-parsing": "cvParse.title",
    "/admin/matching": "matching.title",
    "/admin/ai": "admin.sidebar.aiOverview",
    "/admin/ai/traces": "admin.sidebar.aiTraces",
    "/admin/ai/speech": "admin.sidebar.aiSpeech",
    "/admin/ai/playbook": "playbook.title",
    "/admin/ai/models": "admin.sidebar.aiModels",
    "/admin/ai/prompts": "admin.sidebar.aiPrompts",
    "/admin/evaluation": "admin.sidebar.evalOverview",
    "/admin/evaluation/datasets": "admin.sidebar.evalDatasets",
    "/admin/evaluation/experiments": "admin.sidebar.evalExperiments",
    "/admin/evaluation/regression": "admin.sidebar.evalRegression",
    "/admin/audit-logs": "admin.sidebar.auditLogs",
    "/admin/settings": "admin.sidebar.settings",
    "/admin/help": "common.helpCenter",
    "/admin/profile": "fixAdmin.shell.profile",
  };
  const tabKey = TAB_TITLE_KEYS[pathname];
  usePageTitle(tabKey ? t(tabKey) : null);

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
    /** Live count shown next to the label (active alerts on the AI overview). */
    badge?: ReactNode;
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
    { href: "/admin/question-quality", label: t("adminOps.quality.title"), Icon: ChartColumn, active: isActive.questionQuality },
    { href: "/admin/taxonomy", label: t("fixAdmin.shell.taxonomy"), Icon: Tags, active: isActive.taxonomy },
    { href: "/admin/rubrics", label: t("admin.sidebar.rubrics"), Icon: ClipboardCheck, active: isActive.rubrics },
    // Knowledge base (/admin/knowledge-base) hidden 26/10: it needs a separate RAG service that is not
    // part of this stack, and nothing in interviews, grading or matching reads it. The page still exists.
  ];

  const navGroupInterviews: NavItem[] = [
    { href: "/admin/interviews", label: t("admin.sidebar.interviews"), Icon: MessageSquare, active: isActive.interviews },
    { href: "/admin/practice", label: t("adminOps.practice.title"), Icon: CalendarCheck, active: isActive.practice },
    { href: "/admin/cv-parsing", label: t("cvParse.title"), Icon: FileScan, active: isActive.cvParsing },
    { href: "/admin/matching", label: t("matching.title"), Icon: GitCompareArrows, active: isActive.matching },
  ];

  const navGroupAiOps: NavItem[] = [
    { href: "/admin/ai", label: t("admin.sidebar.aiOverview"), Icon: Cpu, active: isActive.aiOverview, badge: <AdminAlertsNavBadge /> },
    { href: "/admin/ai/traces", label: t("admin.sidebar.aiTraces"), Icon: Activity, active: isActive.aiTraces },
    { href: "/admin/ai/speech", label: t("admin.sidebar.aiSpeech"), Icon: MessageSquareQuote, active: isActive.aiSpeech },
    { href: "/admin/ai/playbook", label: t("playbook.title"), Icon: BookOpenCheck, active: isActive.aiPlaybook },
    { href: "/admin/evaluation", label: t("admin.sidebar.evalOverview"), Icon: Target, active: isActive.evaluation },
    { href: "/admin/ai/models", label: t("admin.sidebar.aiModels"), Icon: Box, active: isActive.aiModels },
  ];

  /** Placeholder pages (no backend yet), kept together in one collapsed group. */
  // 25/10: the former "coming soon" pages are either real (models, evaluation)
  // or handled in Langfuse (prompts, datasets, experiments, regression), so
  // the group is empty and not shown.
  const navGroupSoon: NavItem[] = [];

  const navGroupSystem: NavItem[] = [
    { href: "/admin/system", label: t("adminOps.health.title"), Icon: HeartPulse, active: isActive.systemHealth },
    { href: "/admin/audit-logs", label: t("admin.sidebar.auditLogs"), Icon: ScrollText, active: isActive.auditLogs },
    { href: "/admin/settings", label: t("admin.sidebar.settings"), Icon: Settings, active: isActive.settings },
  ];



  const brandMark = (collapsed: boolean, onNavigate?: () => void) =>
    collapsed ? (
      <div className="flex justify-center">
        <Link
          href={homePath}
          onClick={onNavigate}
          className="rounded-xl transition-opacity hover:opacity-90"
          title={t("fixAdmin.shell.brandTitle")}
          aria-label={t("fixAdmin.shell.brandTitle")}
        >
          <BrandLogo size={40} />
        </Link>
      </div>
    ) : (
      <div className="flex min-w-0 items-center">
        <Link
          href={homePath}
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-2.5 rounded-xl px-1 py-1 transition-opacity hover:opacity-90"
        >
          <BrandLogo size={38} />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="truncate font-display text-base font-bold tracking-[0.08em] text-[#14244B]">INTERVIA</span>
              <span className="rounded-full bg-[#F0F4FC] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#204195]">
                {t("fixAdmin.shell.adminBadge")}
              </span>
            </span>
            <span className="block truncate text-[10.5px] font-medium text-[#607096]">{t("fixAdmin.shell.console")}</span>
          </span>
        </Link>
      </div>
    );

  // Fewer, larger groups: single-item groups only repeated their item's name.
  const groups: { title: string; items: NavItem[]; collapsible?: boolean }[] = [
    { title: "", items: navGroupOverview },
    { title: t("admin.sidebar.group.content"), items: navGroupContent },
    { title: t("admin.sidebar.group.operations"), items: [...navGroupInterviews, ...navGroupAiOps] },
    { title: t("admin.sidebar.group.system"), items: [...navGroupPeople, ...navGroupSystem] },
    { title: t("admin.sidebar.group.soon"), items: navGroupSoon, collapsible: true },
  ]
    .map((group) => ({ ...group, items: group.items.filter((item) => canOpenAdminPath(item.href, roles)) }))
    .filter((group) => group.items.length > 0);


  const renderNavItem = (item: NavItem, collapsed: boolean, onNavigate?: () => void) => {
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
            className={`relative mx-auto flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-150 ${
              navReady && active
                ? "bg-[#EEF2FD] text-[#204195]"
                : item.soon
                  ? "text-[#A3AFC8] hover:bg-[#F2F5FC] hover:text-[#607096]"
                  : "text-[#667085] hover:bg-[#F2F5FC] hover:text-[#204195]"
            }`}
          >
            <item.Icon className="size-4" />
            {item.badge ? <span className="absolute -right-1 -top-1">{item.badge}</span> : null}
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
          {item.badge ?? null}
        </Link>
      </li>
    );
  };

  const navGroups = (collapsed: boolean, onNavigate?: () => void) => (
    <nav className="space-y-3 pt-1" aria-label={t("fixAdmin.shell.menuTitle")}>
      {groups.map((group, groupIdx) => {
        const groupActive = navReady && group.items.some((item) => item.active);
        // The "coming soon" group stays folded (one row) unless opened or one of its pages is open.
        const folded = group.collapsible && !soonOpen && !groupActive;
        if (group.collapsible && collapsed && !groupActive) return null;
        return (
          <div key={group.title || "home"}>
            {groupIdx > 0 && <div className={`${collapsed ? "mx-auto my-2 w-6" : "mx-2 my-2"} h-px bg-[#EAEFF8]`} />}
            {!collapsed && group.collapsible ? (
              <button
                type="button"
                onClick={() => setSoonOpen((open) => !open)}
                aria-expanded={!folded}
                className="flex w-full items-center gap-1.5 rounded-lg px-2.5 pb-1 text-left text-[10px] font-bold uppercase tracking-wider text-[#8A98B8] hover:text-[#607096]"
              >
                <span className="flex-1">{group.title}</span>
                <span className="rounded-full bg-[#F0F4FC] px-1.5 py-0.5 text-[9px] font-semibold normal-case tracking-normal text-[#607096]">
                  {group.items.length}
                </span>
                <ChevronDown className={`size-3 transition-transform ${folded ? "" : "rotate-180"}`} aria-hidden="true" />
              </button>
            ) : !collapsed && group.title ? (
              <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#8A98B8]">{group.title}</p>
            ) : null}
            {folded ? null : (
              <ul className="space-y-0.5">{group.items.map((item) => renderNavItem(item, collapsed, onNavigate))}</ul>
            )}
          </div>
        );
      })}
    </nav>
  );

  const avatar = (
    <>
      {clientProfile?.picture && !avatarError ? (
        <img
          alt=""
          src={clientProfile.picture}
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
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-[#DCE4F3] bg-white px-4 py-2.5 lg:hidden">
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
          <div className="flex shrink-0 items-center gap-2">
            {fullAdmin ? <AdminNotificationBell /> : null}
            <Link
              href="/admin/profile"
              aria-label={t("fixAdmin.shell.profile")}
              className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#DCE4F3] bg-[#204195] text-xs font-bold text-[#FCB625]"
              title={displayName}
            >
              {clientProfile?.picture && !avatarError ? (
                <img
                  alt=""
                  src={clientProfile.picture}
                  className="h-8 w-8 rounded-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                initialsFromName(displayName)
              )}
            </Link>
          </div>
        </header>

        {fullAdmin ? <AdminNotificationToasts /> : null}

        {/* Mobile navigation drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
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
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#EAEFF8] px-3.5 py-3">
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
              <div className="admin-nav-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain p-3.5">
                {navGroups(false, closeMobileNav)}
              </div>
              {sidebarFooter(false, closeMobileNav)}
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <aside
          className={`fixed left-0 top-0 z-40 hidden h-dvh flex-col justify-between border-r border-[#DCE4F3] bg-white transition-[width] duration-300 ease-in-out lg:flex ${
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

          {/* The brand stays put; only the menu (from "Bảng tổng quan" down) scrolls. */}
          <div className={`shrink-0 border-b border-[#EAEFF8] ${isCollapsed ? "px-2.5 py-3" : "px-3.5 py-3"}`}>
            {brandMark(isCollapsed)}
          </div>
          <div className={`admin-nav-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain ${isCollapsed ? "p-2.5" : "p-3.5"}`}>
            {navGroups(isCollapsed)}
          </div>

          {sidebarFooter(isCollapsed)}
        </aside>

        {/* Main Content Area */}
        <main
          className={`min-h-screen transition-[margin] duration-300 ease-in-out px-4 py-8 sm:px-6 md:px-8 lg:px-10 ${
            isCollapsed ? "lg:ml-[72px]" : "lg:ml-64"
          }`}
        >
          <div className="mx-auto max-w-7xl">
            {/* Desktop: notifications bell (mobile has it in the top bar). */}
            {fullAdmin ? (
              <div className="-mt-4 mb-3 hidden justify-end lg:flex">
                <AdminNotificationBell />
              </div>
            ) : null}
            {/* Incidents get the full banner only where they are acted on; elsewhere the bell and the menu count carry them. */}
            {fullAdmin && (isActive.dashboard || isActive.aiOverview) ? <AdminAlertsBanner /> : null}
            {pageAllowed ? (
              children
            ) : (
              <div role="alert" className="mx-auto max-w-lg rounded-3xl border border-[#DCE4F3] bg-white p-8 text-center shadow-xs">
                <h1 className="text-lg font-bold text-[#14244B]">{t("adminRoles.noAccess.title")}</h1>
                <p className="mt-2 text-sm text-[#607096]">{t("adminRoles.noAccess.body")}</p>
                <Link
                  href={homePath}
                  className="mt-5 inline-flex rounded-full bg-[#204195] px-4 py-2 text-xs font-semibold text-white hover:bg-[#183275]"
                >
                  {t("adminRoles.noAccess.home")}
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
