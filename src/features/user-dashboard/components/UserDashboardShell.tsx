"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ComponentType, type ReactNode } from "react";
import {
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  History,
  House,
  LogIn,
  LogOut,
  Menu,
  MessagesSquare,
  Settings,
  Sparkles,
  TrendingUp,
  User,
  UserRound,
  X,
} from "lucide-react";
import { useLocalStorageValue } from "@/hooks/useLocalStorageValue";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatUserRole } from "@/i18n/roles";
import { useAuthProfile } from "@features/auth/hooks/useAuthProfile";
import { useDialogA11y } from "@components/shared/useDialogA11y";
import { BrandLogo } from "@components/shared/BrandLogo";
import { usePageTitle } from "@components/shared/usePageTitle";

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

type NavItem = { href: string; label: string; active: boolean; Icon: ComponentType<{ className?: string }> };

/**
 * Candidate workspace frame. Same layout, sizes and behaviour as the admin
 * console (AdminDashboardShell): fixed brand header, grouped menu that scrolls
 * on its own, a round collapse toggle on the sidebar edge, help + account in
 * the footer, and on phones a top bar with a menu drawer.
 */
export function UserDashboardShell({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuthProfile();
  const [avatarError, setAvatarError] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeLogoutModal = () => setShowLogoutModal(false);
  const closeDrawer = () => setDrawerOpen(false);
  const logoutRef = useDialogA11y<HTMLDivElement>(showLogoutModal, closeLogoutModal);
  const drawerRef = useDialogA11y<HTMLDivElement>(drawerOpen, closeDrawer);

  // Collapsed = a narrow icon rail; remembered per browser, toggled with Ctrl/⌘+B.
  const [collapsedRaw, setCollapsedRaw] = useLocalStorageValue("ui.sidebar_collapsed");
  const collapsed = collapsedRaw === "1";
  const toggleSidebar = () => setCollapsedRaw(collapsed ? "0" : "1");
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "b") {
        const target = event.target as HTMLElement | null;
        if (target?.closest("input, textarea, [contenteditable='true']")) return;
        event.preventDefault();
        setCollapsedRaw(collapsed ? "0" : "1");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [collapsed, setCollapsedRaw]);

  /** Active styles and user profile only after hydration so SSR and first client paint match. */
  const navReady = useIsClient();
  const displayName = navReady ? profile?.name || profile?.email || "" : "";
  const roleLabel = navReady ? formatUserRole(profile?.roles?.[0], t) : "";
  const userPicture = navReady && !avatarError ? profile?.picture : undefined;
  const signedOut = navReady && !profile;

  const is = (prefix: string, exact = false) =>
    exact ? pathname === prefix : pathname === prefix || pathname.startsWith(`${prefix}/`);

  const groups: { title: string; items: NavItem[] }[] = [
    { title: "", items: [{ href: "/dashboard", label: t("userDash.nav.dashboard"), active: is("/dashboard", true), Icon: House }] },
    {
      title: t("uxWs.nav.groupPractice"),
      items: [
        { href: "/interview/select", label: t("userDash.nav.interviews"), active: is("/interview/select") || is("/interview/results"), Icon: MessagesSquare },
        { href: "/dashboard/jobs", label: t("userDash.nav.openRoles"), active: is("/dashboard/jobs") || is("/interview/cv-score"), Icon: BriefcaseBusiness },
        { href: "/dashboard/cvs", label: t("userDash.nav.myCvs"), active: is("/dashboard/cvs"), Icon: FileText },
      ],
    },
    {
      title: t("uxWs.nav.groupResults"),
      items: [
        { href: "/dashboard/history", label: t("userDash.nav.history"), active: is("/dashboard/history"), Icon: History },
        { href: "/dashboard/progress", label: t("practiceProgress.nav"), active: is("/dashboard/progress"), Icon: TrendingUp },
      ],
    },
    {
      title: t("uxWs.nav.groupAccount"),
      items: [
        { href: "/dashboard/profile", label: t("userDash.nav.profile"), active: is("/dashboard/profile"), Icon: User },
        { href: "/dashboard/settings", label: t("userDash.nav.settings"), active: is("/dashboard/settings"), Icon: Settings },
      ],
    },
  ];
  const helpActive = is("/dashboard/help");

  // Browser tab: "<page> | INTERVIA", like the admin console.
  const current = groups.flatMap((group) => group.items).find((item) => item.href === pathname);
  usePageTitle(current?.label ?? (helpActive ? t("userDash.nav.help") : null));

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push("/logout");
  };

  const avatar = (size = "h-8 w-8") =>
    userPicture ? (
      <img
        alt=""
        src={userPicture}
        referrerPolicy="no-referrer"
        onError={() => setAvatarError(true)}
        className={`${size} shrink-0 rounded-full border border-[#DCE4F3] object-cover shadow-2xs`}
      />
    ) : (
      <div
        aria-hidden="true"
        className={`${size} flex shrink-0 items-center justify-center rounded-full border border-[#DCE4F3] bg-[#204195] text-xs font-bold text-[#FCB625] shadow-2xs`}
      >
        {displayName ? initialsFromName(displayName) : "?"}
      </div>
    );

  const navBase = "flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs transition-all duration-150 motion-reduce:transition-none";
  const navInactive = "font-medium text-[#607096] hover:bg-[#F2F5FC] hover:text-[#204195]";
  const navActive = "bg-[#EEF2FD] font-bold text-[#204195] shadow-xs";

  const brand = (rail: boolean, onNavigate?: () => void) =>
    rail ? (
      <div className="flex justify-center">
        <Link href="/dashboard" onClick={onNavigate} className="rounded-xl transition-opacity hover:opacity-90" title="INTERVIA" aria-label="INTERVIA">
          <BrandLogo size={40} />
        </Link>
      </div>
    ) : (
      <div className="flex min-w-0 items-center">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-2.5 rounded-xl px-1 py-1 transition-opacity hover:opacity-90"
          aria-label={t("interview.select.backDashboard")}
        >
          <BrandLogo size={38} />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="truncate font-display text-base font-bold tracking-[0.08em] text-[#14244B]">INTERVIA</span>
              <span className="rounded-full bg-[#F0F4FC] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#204195]">
                {t("uxWs.shell.badge")}
              </span>
            </span>
            <span className="block truncate text-[10.5px] font-medium text-[#607096]">{t("uxWs.shell.console")}</span>
          </span>
        </Link>
      </div>
    );

  const navGroups = (rail: boolean, onNavigate?: () => void) => (
    <nav className="space-y-3 pt-1" aria-label={t("userDash.nav.groupMain")}>
      {groups.map((group, index) => (
        <div key={group.title || "home"}>
          {index > 0 && <div className={`${rail ? "mx-auto my-2 w-6" : "mx-2 my-2"} h-px bg-[#EAEFF8]`} />}
          {!rail && group.title ? (
            <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#8A98B8]">{group.title}</p>
          ) : null}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = navReady && item.active;
              return (
                <li key={item.href}>
                  {rail ? (
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={item.label}
                      aria-label={item.label}
                      aria-current={active ? "page" : undefined}
                      className={`relative mx-auto flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-150 ${
                        active ? "bg-[#EEF2FD] text-[#204195]" : "text-[#667085] hover:bg-[#F2F5FC] hover:text-[#204195]"
                      }`}
                    >
                      <item.Icon className="size-4" />
                    </Link>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`${navBase} ${active ? navActive : navInactive}`}
                    >
                      <item.Icon className="size-3.5 shrink-0" />
                      <span className="flex-1 truncate text-xs">{item.label}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const helpLinkClass = (active: boolean) =>
    active ? "bg-[#204195]/10 text-[#204195]" : "text-[#607096] hover:bg-[#F7F9FD] hover:text-[#204195]";

  const sidebarFooter = (rail: boolean, onNavigate?: () => void) => (
    <div className={`shrink-0 space-y-2 border-t border-[#EAEFF8] bg-white ${rail ? "p-2" : "p-3"}`}>
      {!rail ? (
        <>
          <div className="flex items-center justify-between px-1">
            <Link
              href="/dashboard/help"
              onClick={onNavigate}
              className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold transition-colors ${helpLinkClass(navReady && helpActive)}`}
            >
              <HelpCircle className="size-3.5" />
              <span>{t("common.helpCenter")}</span>
            </Link>
          </div>
          {signedOut ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-[#204195]/20 bg-[#F5F8FF] p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#204195]">
                <Sparkles className="size-3.5 text-[#FCB625]" aria-hidden="true" />
                <span>{t("uxWs.shell.previewTitle")}</span>
              </div>
              <p className="text-[11px] leading-snug text-[#607096]">{t("uxWs.shell.previewDesc")}</p>
              <Link
                href="/login"
                onClick={onNavigate}
                className="inline-flex h-8 items-center justify-center rounded-xl bg-[#204195] text-xs font-semibold text-white shadow-xs transition hover:bg-[#183275]"
              >
                {t("uxWs.shell.signIn")}
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC] p-1.5 transition-colors hover:border-[#C5D2E7] hover:bg-[#FAFBFE]">
              <Link
                href="/dashboard/profile"
                onClick={onNavigate}
                className="group flex min-w-0 flex-1 items-center gap-2 overflow-hidden"
                aria-label={`${t("userDash.nav.profile")}: ${displayName}`}
                title={displayName}
                suppressHydrationWarning
              >
                {avatar()}
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-xs font-bold text-[#14244B] transition-colors group-hover:text-[#204195]">
                    {displayName || t("userDash.profile.guest")}
                  </p>
                  <p className="flex items-center gap-1 truncate text-[10px] font-semibold text-[#204195]">
                    <UserRound className="size-3 shrink-0 text-[#204195]" />
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
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Link
            href="/dashboard/help"
            onClick={onNavigate}
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${helpLinkClass(navReady && helpActive)}`}
            title={t("common.helpCenter")}
            aria-label={t("common.helpCenter")}
          >
            <HelpCircle className="size-4" />
          </Link>
          <div className="my-0.5 h-px w-8 bg-[#EAEFF8]" />
          {signedOut ? (
            <Link
              href="/login"
              className="grid h-9 w-9 place-items-center rounded-xl bg-[#204195] text-white shadow-xs transition hover:bg-[#183275]"
              title={t("uxWs.shell.signIn")}
              aria-label={t("uxWs.shell.signIn")}
            >
              <LogIn className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <>
              <Link
                href="/dashboard/profile"
                className="flex h-9 w-9 items-center justify-center"
                title={displayName}
                aria-label={`${t("userDash.nav.profile")}: ${displayName}`}
                suppressHydrationWarning
              >
                {avatar()}
              </Link>
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#607096] transition-colors hover:bg-[#FDF2F2] hover:text-[#C43B3B]"
                title={t("common.logout")}
                aria-label={t("common.logout")}
              >
                <LogOut className="size-4" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {showLogoutModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#14244B]/35 backdrop-blur-[2px]" onClick={closeLogoutModal} aria-hidden="true" />
          <div
            ref={logoutRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            tabIndex={-1}
            className="anim-pop relative z-10 w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-[0_30px_80px_-30px_rgba(20,36,75,0.45)] outline-none"
          >
            <h2 id="logout-modal-title" className="mb-1.5 text-lg font-bold text-[#14244B]">
              {t("userDash.logoutModal.title")}
            </h2>
            <p className="mb-6 text-sm text-[#607096]">{t("userDash.logoutModal.desc")}</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="h-11 w-full rounded-full bg-[#C43B3B] text-sm font-semibold text-white transition-colors hover:bg-[#A93232]"
              >
                {t("userDash.logoutModal.confirm")}
              </button>
              <button
                type="button"
                onClick={closeLogoutModal}
                data-autofocus
                className="h-11 w-full rounded-full text-sm font-semibold text-[#607096] transition-colors hover:bg-[#F8FAFC] hover:text-[#14244B]"
              >
                {t("userDash.logoutModal.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[#F8FAFC] font-body text-[#14244B]">
        {/* Top bar below 1024px (same as the admin console) */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-[#DCE4F3] bg-white px-4 py-2.5 lg:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={t("fixAdmin.shell.openMenu")}
              aria-expanded={drawerOpen}
              aria-controls="user-mobile-nav"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#14244B] transition-colors hover:bg-[#F0F4FC]"
            >
              <Menu className="size-5" />
            </button>
            {brand(false)}
          </div>
          {signedOut ? (
            <Link
              href="/login"
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-xl bg-[#204195] px-3.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#183275]"
            >
              {t("uxWs.shell.signIn")}
            </Link>
          ) : (
            <Link href="/dashboard/profile" aria-label={t("userDash.nav.profile")} title={displayName} suppressHydrationWarning>
              {avatar()}
            </Link>
          )}
        </header>

        {/* Mobile navigation drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <div className="absolute inset-0 bg-[#14244B]/40" onClick={closeDrawer} aria-hidden="true" />
            <div
              ref={drawerRef}
              id="user-mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label={t("userDash.nav.groupMain")}
              tabIndex={-1}
              className="anim-pop absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col justify-between bg-white shadow-[0_30px_80px_-30px_rgba(20,36,75,0.5)] outline-none"
            >
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#EAEFF8] px-3.5 py-3">
                {brand(false, closeDrawer)}
                <button
                  type="button"
                  onClick={closeDrawer}
                  aria-label={t("fixAdmin.shell.closeMenu")}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#607096] transition-colors hover:bg-[#F0F4FC] hover:text-[#14244B]"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="admin-nav-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain p-3.5">{navGroups(false, closeDrawer)}</div>
              {sidebarFooter(false, closeDrawer)}
            </div>
          </div>
        )}

        {/* Desktop sidebar */}
        <aside
          className={`fixed left-0 top-0 z-40 hidden h-dvh flex-col justify-between border-r border-[#DCE4F3] bg-white transition-[width] duration-300 ease-in-out lg:flex ${
            collapsed ? "w-[72px]" : "w-64"
          }`}
        >
          {/* Floating border toggle pill (same as admin) */}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-expanded={!collapsed}
            className="absolute -right-3.5 top-7 z-50 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-[#DCE4F3] bg-white text-[#607096] shadow-[0_2px_8px_rgba(20,36,75,0.08)] transition-all duration-150 hover:scale-110 hover:border-[#204195] hover:bg-[#F8FAFC] hover:text-[#204195] active:scale-95"
            title={collapsed ? t("userDash.sidebar.expand") : t("userDash.sidebar.collapse")}
            aria-label={collapsed ? t("userDash.sidebar.expand") : t("userDash.sidebar.collapse")}
          >
            {collapsed ? <ChevronRight className="size-3.5 stroke-[2.5]" /> : <ChevronLeft className="size-3.5 stroke-[2.5]" />}
          </button>

          {/* The brand stays put; only the menu scrolls. */}
          <div className={`shrink-0 border-b border-[#EAEFF8] ${collapsed ? "px-2.5 py-3" : "px-3.5 py-3"}`}>{brand(collapsed)}</div>
          <div className={`admin-nav-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain ${collapsed ? "p-2.5" : "p-3.5"}`}>
            {navGroups(collapsed)}
          </div>
          {sidebarFooter(collapsed)}
        </aside>

        <div className={`min-h-screen min-w-0 transition-[margin] duration-300 ease-in-out ${collapsed ? "lg:ml-[72px]" : "lg:ml-64"}`}>
          {children}
        </div>
      </div>
    </>
  );
}
