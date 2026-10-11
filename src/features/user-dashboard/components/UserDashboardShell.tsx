"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ComponentType, type ReactNode } from "react";
import {
  BriefcaseBusiness,
  CircleHelp,
  FileText,
  History,
  House,
  LogOut,
  MessagesSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
} from "lucide-react";
import { useLocalStorageValue } from "@/hooks/useLocalStorageValue";
import { cn } from "@/utils";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatUserRole } from "@/i18n/roles";
import { useAuthProfile } from "@features/auth/hooks/useAuthProfile";
import FoxAvatar from "@features/mascot/components/FoxAvatar";
import { useDialogA11y } from "@components/shared/useDialogA11y";

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

/** `icon` only shows on the collapsed rail, where it is the whole control. */
type NavItem = { href: string; label: string; active: boolean; icon?: ComponentType<{ className?: string }> };

export function UserDashboardShell({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuthProfile();
  const [avatarError, setAvatarError] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const closeLogoutModal = () => setShowLogoutModal(false);
  const closeMoreSheet = () => setShowMoreSheet(false);
  const logoutRef = useDialogA11y<HTMLDivElement>(showLogoutModal, closeLogoutModal);
  const moreRef = useDialogA11y<HTMLDivElement>(showMoreSheet, closeMoreSheet);
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

  /** Active styles and user profile only after hydration so SSR and first client paint match (avoids hydration mismatch). */
  const navReady = useIsClient();

  const displayName = navReady ? (profile?.name || profile?.email || "") : "";
  const primaryRole = navReady ? profile?.roles?.[0] : undefined;
  const roleLabel = navReady ? formatUserRole(primaryRole, t) : "";
  const userPicture = navReady && !avatarError ? profile?.picture : undefined;

  const is = (prefix: string, exact = false) =>
    navReady && (exact ? pathname === prefix : pathname === prefix || pathname.startsWith(`${prefix}/`));

  const mainNav: NavItem[] = [
    { href: "/dashboard", label: t("userDash.nav.dashboard"), active: is("/dashboard", true), icon: House },
    { href: "/interview/select", label: t("userDash.nav.interviews"), active: is("/interview/select") || is("/interview/results"), icon: MessagesSquare },
    { href: "/dashboard/jobs", label: t("userDash.nav.openRoles"), active: is("/dashboard/jobs") || is("/interview/cv-score"), icon: BriefcaseBusiness },
    { href: "/dashboard/cvs", label: t("userDash.nav.myCvs"), active: is("/dashboard/cvs"), icon: FileText },
    { href: "/dashboard/history", label: t("userDash.nav.history"), active: is("/dashboard/history"), icon: History },
  ];

  const secondaryNav: NavItem[] = [
    { href: "/dashboard/settings", label: t("userDash.nav.settings"), active: is("/dashboard/settings"), icon: Settings },
    { href: "/dashboard/help", label: t("userDash.nav.help"), active: is("/dashboard/help"), icon: CircleHelp },
  ];

  const mobileNav: NavItem[] = [
    { href: "/dashboard", label: t("userDash.nav.dashboard"), active: is("/dashboard", true) },
    { href: "/dashboard/cvs", label: t("userDash.nav.myCvs"), active: is("/dashboard/cvs") },
    { href: "/interview/select", label: t("userDash.nav.interviews"), active: is("/interview/select") || is("/interview/results") },
    { href: "/dashboard/history", label: t("userDash.nav.history"), active: is("/dashboard/history") },
  ];

  /** Pages that only fit in the mobile "Thêm" sheet. */
  const moreNav: NavItem[] = [
    { href: "/dashboard/profile", label: t("userDash.nav.profile"), active: is("/dashboard/profile") },
    { href: "/dashboard/jobs", label: t("userDash.nav.openRoles"), active: is("/dashboard/jobs") || is("/interview/cv-score") },
    { href: "/dashboard/settings", label: t("userDash.nav.settings"), active: is("/dashboard/settings") },
    { href: "/dashboard/help", label: t("userDash.nav.help"), active: is("/dashboard/help") },
  ];
  const moreActive = moreNav.some((item) => item.active);

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push("/logout");
  };

  const avatar = (size: string) =>
    userPicture ? (
      <img
        alt=""
        src={userPicture}
        referrerPolicy="no-referrer"
        onError={() => setAvatarError(true)}
        className={`${size} shrink-0 rounded-full object-cover`}
      />
    ) : (
      <div
        aria-hidden="true"
        className={`${size} flex shrink-0 items-center justify-center rounded-full bg-[#204195] text-xs font-bold text-white`}
      >
        {displayName ? initialsFromName(displayName) : "?"}
      </div>
    );

  return (
    <>
      {showLogoutModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#14244B]/35 backdrop-blur-[2px]"
            onClick={closeLogoutModal}
            aria-hidden="true"
          />
          <div
            ref={logoutRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            tabIndex={-1}
            className="anim-pop relative z-10 w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-[0_30px_80px_-30px_rgba(20,36,75,0.45)] outline-none"
          >
            <h2 id="logout-modal-title" className="mb-1.5 text-lg font-bold text-[#14244B]">
              {t("userDash.logoutModal.title")}
            </h2>
            <p className="mb-6 text-sm text-[#607096]">{t("userDash.logoutModal.desc")}</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="h-11 w-full rounded-full bg-[#14244B] text-sm font-semibold text-white transition-colors hover:bg-[#C43B3B]"
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
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between bg-[#F8FAFC]/90 px-4 py-2.5 backdrop-blur md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <FoxAvatar size={32} />
            <span className="font-display text-lg font-semibold tracking-tight text-[#14244B]">Intervia</span>
          </Link>
          <Link href="/dashboard/profile" aria-label={t("userDash.nav.profile")} suppressHydrationWarning>
            {avatar("h-8 w-8")}
          </Link>
        </header>

        {/* Desktop sidebar: full width with words, or a collapsed icon rail */}
        <aside
          className={cn(
            "fixed left-0 top-0 z-40 hidden h-dvh flex-col justify-between bg-[#F0F4FC]/60 transition-[width] duration-200 ease-out md:flex",
            collapsed ? "w-[72px]" : "w-60",
          )}
        >
          <div className={cn("flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-4 pt-6", collapsed ? "px-3" : "px-4")}>
            <div className={cn("flex items-center gap-2", collapsed ? "flex-col" : "justify-between")}>
              <Link
                href="/dashboard"
                className="flex min-w-0 items-center gap-2.5 rounded-2xl px-1 py-1 transition-opacity hover:opacity-90"
                aria-label={t("interview.select.backDashboard")}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-[0_6px_16px_-8px_rgba(252,182,37,0.6)]">
                  <FoxAvatar size={42} />
                </span>
                {!collapsed ? (
                  <span className="min-w-0">
                    <span className="block font-display text-[22px] font-semibold leading-none tracking-tight text-[#14244B]">
                      Intervia
                    </span>
                    <span className="mt-1 block truncate text-[11px] text-[#607096]">{t("userDash.sidebar.tagline")}</span>
                  </span>
                ) : null}
              </Link>
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label={t(collapsed ? "uxWs.nav.expand" : "uxWs.nav.collapse")}
                aria-expanded={!collapsed}
                title={t(collapsed ? "uxWs.nav.expand" : "uxWs.nav.collapse")}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[#607096] transition-colors hover:bg-white hover:text-[#14244B] focus-visible:outline-2 focus-visible:outline-[#204195]"
              >
                {collapsed ? <PanelLeftOpen className="size-[18px]" aria-hidden="true" /> : <PanelLeftClose className="size-[18px]" aria-hidden="true" />}
              </button>
            </div>

            <Link
              href="/interview/select"
              title={collapsed ? t("userDash.nav.newInterview") : undefined}
              aria-label={collapsed ? t("userDash.nav.newInterview") : undefined}
              className={cn(
                "mt-7 flex h-11 items-center justify-center rounded-full bg-[#204195] text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(32,65,149,0.8)] transition-all hover:-translate-y-px hover:bg-[#183275]",
                collapsed ? "mx-auto w-11" : "w-full px-4",
              )}
            >
              {collapsed ? <Plus className="size-5" aria-hidden="true" /> : t("userDash.nav.newInterview")}
            </Link>

            <nav className="mt-7" aria-label={t("userDash.nav.groupMain")}>
              <ul className="space-y-0.5">
                {mainNav.map((item) => (
                  <li key={item.href}>
                    <SidebarLink item={item} collapsed={collapsed} />
                  </li>
                ))}
              </ul>
              <ul className="mt-6 space-y-0.5 border-t border-[#DCE4F3] pt-5">
                {secondaryNav.map((item) => (
                  <li key={item.href}>
                    <SidebarLink item={item} quiet collapsed={collapsed} />
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className={cn("shrink-0 pb-5", collapsed ? "px-3" : "px-4")}>
            {collapsed ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl bg-white/80 p-2">
                <Link href="/dashboard/profile" aria-label={t("userDash.nav.profile")} title={displayName} suppressHydrationWarning>
                  {avatar("h-9 w-9")}
                </Link>
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(true)}
                  aria-label={t("userDash.nav.logout")}
                  title={t("userDash.nav.logout")}
                  className="grid h-8 w-8 place-items-center rounded-full text-[#607096] transition-colors hover:bg-[#F0F4FC] hover:text-[#C43B3B]"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
            <div className="flex items-center gap-2.5 rounded-2xl bg-white/80 p-2 pr-3">
              <Link
                href="/dashboard/profile"
                className="group flex min-w-0 flex-1 items-center gap-2.5"
                aria-label={t("userDash.nav.profile")}
                title={displayName}
                suppressHydrationWarning
              >
                {avatar("h-9 w-9")}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-[#14244B] group-hover:text-[#204195]">
                    {displayName || t("userDash.profile.guest")}
                  </span>
                  <span className="block truncate text-[11px] text-[#607096]">{roleLabel}</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold text-[#607096] transition-colors hover:bg-[#F0F4FC] hover:text-[#C43B3B]"
              >
                {t("userDash.nav.logout")}
              </button>
            </div>
            )}
          </div>
        </aside>

        <div className={cn("min-h-screen pb-24 transition-[margin] duration-200 ease-out md:pb-0", collapsed ? "md:ml-[72px]" : "md:ml-60")}>{children}</div>

        {/* Mobile tab bar: words, not icons */}
        <nav
          className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-full bg-white/95 p-1.5 shadow-[0_14px_36px_-14px_rgba(20,36,75,0.45)] backdrop-blur md:hidden"
          aria-label={t("userDash.nav.groupMain")}
        >
          {mobileNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={`truncate rounded-full px-1 py-2 text-center text-[11.5px] font-semibold transition-colors ${
                item.active ? "bg-[#204195] text-white" : "text-[#607096] hover:text-[#14244B]"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setShowMoreSheet(true)}
            aria-haspopup="dialog"
            aria-expanded={showMoreSheet}
            className={`truncate rounded-full px-1 py-2 text-center text-[11.5px] font-semibold transition-colors ${
              moreActive ? "bg-[#204195] text-white" : "text-[#607096] hover:text-[#14244B]"
            }`}
          >
            {t("fixApp.nav.more")}
          </button>
        </nav>

        {/* Mobile "Thêm" sheet: the pages and the logout that don't fit in the tab bar */}
        {showMoreSheet && (
          <div className="fixed inset-0 z-[60] flex items-end md:hidden">
            <div className="absolute inset-0 bg-[#14244B]/35 backdrop-blur-[2px]" onClick={closeMoreSheet} aria-hidden="true" />
            <div
              ref={moreRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="more-sheet-title"
              tabIndex={-1}
              className="anim-pop relative w-full rounded-t-3xl bg-white px-4 pb-6 pt-4 shadow-[0_-20px_60px_-30px_rgba(20,36,75,0.5)] outline-none"
            >
              <div className="flex items-center justify-between gap-3 px-2 pb-2">
                <h2 id="more-sheet-title" className="text-base font-semibold text-[#14244B]">
                  {t("fixApp.nav.moreTitle")}
                </h2>
                <button
                  type="button"
                  onClick={closeMoreSheet}
                  className="rounded-full px-3 py-1.5 text-sm font-semibold text-[#607096] transition-colors hover:bg-[#F0F4FC] hover:text-[#14244B]"
                >
                  {t("fixApp.common.close")}
                </button>
              </div>
              <ul className="space-y-0.5">
                {moreNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeMoreSheet}
                      aria-current={item.active ? "page" : undefined}
                      className={`flex items-center rounded-2xl px-3 py-3 text-[15px] transition-colors ${
                        item.active
                          ? "bg-[#F0F4FC] font-semibold text-[#14244B]"
                          : "font-medium text-[#14244B] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`mr-3 h-1.5 w-1.5 rounded-full ${item.active ? "bg-[#FCB625]" : "bg-transparent"}`}
                      />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-2 border-t border-[#EAEFF8] pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreSheet(false);
                    setShowLogoutModal(true);
                  }}
                  className="flex w-full items-center rounded-2xl px-3 py-3 text-left text-[15px] font-semibold text-[#C43B3B] transition-colors hover:bg-[#FDF2F2]"
                >
                  <span aria-hidden="true" className="mr-3 h-1.5 w-1.5" />
                  {t("userDash.nav.logout")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function SidebarLink({ item, quiet = false, collapsed = false }: { item: NavItem; quiet?: boolean; collapsed?: boolean }) {
  const Icon = item.icon;
  if (collapsed && Icon) {
    return (
      <Link
        href={item.href}
        aria-current={item.active ? "page" : undefined}
        aria-label={item.label}
        title={item.label}
        className={cn(
          "relative mx-auto grid h-11 w-11 place-items-center rounded-xl transition-colors",
          item.active
            ? "bg-white text-[#204195] shadow-[0_4px_14px_-10px_rgba(20,36,75,0.5)]"
            : "text-[#607096] hover:bg-white/60 hover:text-[#14244B]",
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
        {item.active ? <span aria-hidden="true" className="absolute -left-3 h-5 w-1 rounded-r-full bg-[#FCB625]" /> : null}
      </Link>
    );
  }
  return (
    <Link
      href={item.href}
      aria-current={item.active ? "page" : undefined}
      className={`group relative flex items-center rounded-xl px-3 py-2.5 transition-colors ${
        quiet ? "text-[13px]" : "text-[14.5px]"
      } ${
        item.active
          ? "bg-white font-semibold text-[#14244B] shadow-[0_4px_14px_-10px_rgba(20,36,75,0.5)]"
          : "font-medium text-[#607096] hover:bg-white/60 hover:text-[#14244B]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`mr-3 h-1.5 w-1.5 rounded-full transition-colors ${
          item.active ? "bg-[#FCB625]" : "bg-transparent group-hover:bg-[#FCB625]/40"
        }`}
      />
      {item.label}
    </Link>
  );
}
