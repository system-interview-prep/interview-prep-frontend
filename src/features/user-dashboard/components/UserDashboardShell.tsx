"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  Plus,
  LayoutDashboard,
  Briefcase,
  FileText,
  MessageSquare,
  GraduationCap,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useAuthProfile } from "@features/auth/hooks/useAuthProfile";
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
  window.addEventListener("dashboard-sidebar-toggle", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("dashboard-sidebar-toggle", callback);
  };
}

function getSidebarSnapshot(): boolean {
  try {
    return localStorage.getItem("dashboard.sidebarCollapsed") === "true";
  } catch {
    return false;
  }
}

function getSidebarServerSnapshot(): boolean {
  return false;
}

export function UserDashboardShell({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuthProfile();
  const [avatarError, setAvatarError] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const isCollapsed = useSyncExternalStore(subscribeSidebar, getSidebarSnapshot, getSidebarServerSnapshot);

  const toggleSidebar = () => {
    try {
      const next = !getSidebarSnapshot();
      localStorage.setItem("dashboard.sidebarCollapsed", String(next));
      window.dispatchEvent(new Event("dashboard-sidebar-toggle"));
    } catch {
      // ignore
    }
  };

  const displayName = profile?.name || profile?.email || "";
  const primaryRole = profile?.roles?.[0];
  const roleLabel = primaryRole ? t(`userDash.role.${primaryRole}`) : t("userDash.roleFallback");

  /** Active styles only after hydration so SSR and first client paint match (avoids usePathname mismatch warnings). */
  const navReady = useIsClient();

  const isActive = useMemo(
    () => ({
      dashboard: pathname === "/dashboard",
      jobs: pathname === "/dashboard/jobs" || pathname.startsWith("/dashboard/jobs/"),
      myCvs: pathname === "/dashboard/cvs" || pathname.startsWith("/dashboard/cvs/"),
      interviews:
        pathname === "/interview" ||
        pathname.startsWith("/interview/"),
      practice: pathname.startsWith("/practice"),
      profile: pathname.startsWith("/dashboard/profile"),
      settings:
        pathname === "/dashboard/settings" ||
        pathname.startsWith("/dashboard/settings/"),
      help:
        pathname === "/dashboard/help" ||
        pathname.startsWith("/dashboard/help/"),
    }),
    [pathname],
  );

  const navBase =
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 motion-reduce:transition-none";
  const navInactive =
    "font-medium text-[#667085] hover:bg-[#F2F5FC] hover:text-[#204195]";
  const navActive =
    "bg-[#EEF2FD] font-semibold text-[#204195]";

  const linkClass = (active: boolean) =>
    `${navBase} ${navReady && active ? navActive : navInactive}`;

  const navGroupMain = [
    { href: "/dashboard",       label: t("userDash.nav.dashboard"),   Icon: LayoutDashboard, active: isActive.dashboard },
    { href: "/dashboard/jobs",  label: t("userDash.nav.openRoles"),   Icon: Briefcase,       active: isActive.jobs },
    { href: "/dashboard/cvs",   label: t("userDash.nav.myCvs"),       Icon: FileText,        active: isActive.myCvs },
    { href: "/interview/select",label: t("userDash.nav.interviews"),  Icon: MessageSquare,   active: isActive.interviews },
    { href: "/practice",        label: t("userDash.nav.practice"),    Icon: GraduationCap,   active: isActive.practice },
  ];

  const navGroupTools = [
    { href: "/dashboard/settings", label: t("userDash.nav.settings"), Icon: Settings, active: isActive.settings },
  ];

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push("/logout");
  };

  return (
    <>
    {/* Logout Confirm Modal */}
    {showLogoutModal && (
      <div
        className="fixed inset-0 z-[999] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-[#14244B]/40 backdrop-blur-sm"
          onClick={() => setShowLogoutModal(false)}
          aria-hidden="true"
        />
        {/* Dialog Card */}
        <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-[0_20px_60px_rgba(20,36,75,0.15)]">
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <LogOut className="size-5 text-red-500" />
          </div>
          {/* Title */}
          <h2
            id="logout-modal-title"
            className="mb-1.5 text-center text-[17px] font-bold text-[#14244B]"
          >
            {t("userDash.logoutModal.title")}
          </h2>
          {/* Desc */}
          <p className="mb-6 text-center text-sm text-[#607096]">
            {t("userDash.logoutModal.desc")}
          </p>
          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 w-full items-center justify-center rounded-xl bg-red-500 text-sm font-semibold text-white transition-all hover:bg-red-600 active:scale-[0.98]"
            >
              {t("userDash.logoutModal.confirm")}
            </button>
            <button
              type="button"
              onClick={() => setShowLogoutModal(false)}
              className="flex h-10 w-full items-center justify-center rounded-xl border border-[#DCE4F3] bg-white text-sm font-medium text-[#607096] transition-all hover:bg-[#F7F9FD] hover:text-[#14244B] active:scale-[0.98]"
            >
              {t("userDash.logoutModal.cancel")}
            </button>
          </div>
        </div>
      </div>
    )}
    <div className="min-h-screen bg-[#F8FAFC] font-body text-[#14244B]">
      {/* Mobile Topbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#DCE4F3] bg-white px-4 py-2.5 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#204195] text-[#FCB625] shadow-xs">
            <Sparkles size={16} />
          </div>
          <span className="font-headline text-base font-extrabold tracking-tight text-[#14244B]">INTERVIA</span>
        </Link>
        <LanguageToggleButton placement="bottom" className="h-9 rounded-xl px-2.5 text-xs" />
      </header>

      {/* Desktop Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 hidden h-dvh flex-col justify-between border-r border-[#DCE4F3] bg-white transition-[width] duration-300 ease-in-out md:flex ${
          isCollapsed ? "w-[72px]" : "w-64"
        }`}
      >
        {/* Floating Border Toggle Pill (Phương án 1) */}
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

        <div className={`flex-1 overflow-y-auto overscroll-contain space-y-4.5 ${isCollapsed ? "p-2.5" : "p-3.5"}`}>
          {/* Header Row */}
          {!isCollapsed ? (
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="flex min-w-0 items-center gap-2.5 rounded-xl px-1 py-1 transition-opacity hover:opacity-90"
                aria-label={t("interview.select.backDashboard")}
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#204195] text-[#FCB625] shadow-xs">
                  <Sparkles size={18} />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-extrabold tracking-tight text-[#14244B]">
                    {t("userDash.sidebar.brand")}
                  </h1>
                  <p className="truncate text-[10.5px] font-medium text-[#607096]">{t("userDash.sidebar.tagline")}</p>
                </div>
              </Link>
            </div>
          ) : (
            <div className="flex justify-center">
              <Link
                href="/dashboard"
                className="grid h-10 w-10 place-items-center rounded-xl bg-[#204195] text-[#FCB625] shadow-xs hover:opacity-90"
                title={t("userDash.sidebar.brand")}
                aria-label={t("userDash.sidebar.brand")}
              >
                <Sparkles size={20} />
              </Link>
            </div>
          )}

          {/* New Interview Button */}
          {!isCollapsed ? (
            <Link
              href="/interview/select"
              className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#204195] hover:bg-[#183275] px-3.5 py-2 text-sm font-bold text-white shadow-xs transition-all hover:shadow-sm active:scale-[0.99]"
            >
              <Plus className="size-4" />
              <span>{t("userDash.nav.newInterview")}</span>
            </Link>
          ) : (
            <Link
              href="/interview/select"
              className="flex h-11 w-11 mx-auto items-center justify-center rounded-xl bg-[#204195] hover:bg-[#183275] text-white shadow-xs transition-all hover:shadow-sm active:scale-[0.99]"
              title={t("userDash.nav.newInterview")}
              aria-label={t("userDash.nav.newInterview")}
            >
              <Plus className="size-5" />
            </Link>
          )}

          {/* Nav Items – grouped (Linear/Supabase style) */}
          <nav className="space-y-4">
            {/* Group: Main */}
            <div>
              <ul className="space-y-0.5">
                {navGroupMain.map((item) => {
                  const active = item.active;
                  if (isCollapsed) {
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          title={item.label}
                          aria-label={item.label}
                          className={`flex h-10 w-10 mx-auto items-center justify-center rounded-lg transition-all duration-150 ${
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
                        <item.Icon className="size-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Divider */}
            <div className={`${isCollapsed ? "mx-auto w-6" : "mx-2"} h-px bg-[#EEF2FD]`} />

            {/* Group: Tools */}
            <div>
              <ul className="space-y-0.5">
                {navGroupTools.map((item) => {
                  const active = item.active;
                  if (isCollapsed) {
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          title={item.label}
                          aria-label={item.label}
                          className={`flex h-10 w-10 mx-auto items-center justify-center rounded-lg transition-all duration-150 ${
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
                        <item.Icon className="size-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className={`shrink-0 border-t border-[#EAEFF8] bg-white space-y-2.5 ${isCollapsed ? "p-2" : "p-3"}`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center justify-between px-1">
                <Link
                  href="/dashboard/help"
                  className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
                    isActive.help
                      ? "bg-[#204195]/10 text-[#204195]"
                      : "text-[#607096] hover:bg-[#F7F9FD] hover:text-[#204195]"
                  }`}
                >
                  <HelpCircle className="size-4" />
                  <span>{t("userDash.nav.help")}</span>
                </Link>

                <LanguageToggleButton placement="top" className="h-7.5 rounded-xl px-2 text-xs" />
              </div>

              {/* User Profile Card */}
              <div className="flex items-center justify-between gap-2 rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-1.5 transition-colors hover:border-[#C5D2E7] hover:bg-[#FAFBFE]">
                <Link
                  href="/dashboard/profile"
                  className="group flex min-w-0 flex-1 items-center gap-2 overflow-hidden"
                  aria-label={t("userDash.nav.profile")}
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
                      {displayName ? initialsFromName(displayName) : "?"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-xs font-bold text-[#14244B] transition-colors group-hover:text-[#204195]">
                      {displayName || t("userDash.profile.guest")}
                    </p>
                    <p className="truncate text-[10.5px] text-[#607096]">{roleLabel}</p>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => setShowLogoutModal(true)}
                  className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg text-[#607096] transition-colors hover:bg-red-50 hover:text-red-600"
                  title={t("userDash.nav.logout")}
                  aria-label={t("userDash.nav.logout")}
                >
                  <LogOut className="size-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Link
                href="/dashboard/help"
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                  isActive.help
                    ? "bg-[#204195]/10 text-[#204195]"
                    : "text-[#607096] hover:bg-[#F7F9FD] hover:text-[#204195]"
                }`}
                title={t("userDash.nav.help")}
                aria-label={t("userDash.nav.help")}
              >
                <HelpCircle className="size-5" />
              </Link>

              <LanguageToggleButton compact placement="top" />

              <div className="w-8 h-px bg-[#EAEFF8] my-1" />

              <Link
                href="/dashboard/profile"
                className="flex h-9 w-9 items-center justify-center"
                title={displayName || t("userDash.nav.profile")}
                aria-label={t("userDash.nav.profile")}
              >
                {profile?.picture && !avatarError ? (
                  <img
                    alt=""
                    src={profile.picture}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                    className="h-9 w-9 shrink-0 rounded-full border border-[#DCE4F3] object-cover shadow-2xs"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#DCE4F3] bg-[#204195] text-xs font-bold text-[#FCB625] shadow-2xs"
                  >
                    {displayName ? initialsFromName(displayName) : "?"}
                  </div>
                )}
              </Link>

              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[#607096] transition-colors hover:bg-red-50 hover:text-red-600"
                title={t("userDash.nav.logout")}
                aria-label={t("userDash.nav.logout")}
              >
                <LogOut className="size-4.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <div
        className={`min-h-screen pb-28 transition-[margin] duration-300 ease-in-out md:pb-0 ${
          isCollapsed ? "md:ml-[72px]" : "md:ml-64"
        }`}
      >
        {children}
      </div>

      <nav className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-around gap-2 rounded-2xl border border-[#DCE4F3] bg-white/95 backdrop-blur-md px-3 py-2 shadow-[0_12px_32px_rgba(20,36,75,0.08)] md:hidden">
        <Link
          href="/dashboard"
          className={`rounded-xl p-2.5 transition-colors ${
            pathname === "/dashboard"
              ? "bg-[#204195]/10 text-[#204195]"
              : "text-[#607096] hover:bg-[#F7F9FD] hover:text-[#204195]"
          }`}
          aria-label={t("userDash.nav.dashboard")}
        >
          <LayoutDashboard className="size-5" />
        </Link>
        <Link
          href="/interview/select"
          className={`rounded-xl bg-[#204195] text-white p-2.5 shadow-sm transition-transform active:scale-95 ${
            pathname.startsWith("/interview") ? "ring-2 ring-[#204195] ring-offset-2" : ""
          }`}
          aria-label={t("userDash.nav.newInterview")}
        >
          <Plus className="size-5" />
        </Link>
        <Link
          href="/practice"
          className={`rounded-xl p-2.5 transition-colors ${
            pathname.startsWith("/practice")
              ? "bg-[#204195]/10 text-[#204195]"
              : "text-[#607096] hover:bg-[#F7F9FD] hover:text-[#204195]"
          }`}
          aria-label={t("userDash.nav.practice")}
        >
          <GraduationCap className="size-5" />
        </Link>
        <Link
          href="/dashboard/cvs"
          className={`rounded-xl p-2.5 transition-colors ${
            pathname.startsWith("/dashboard/cvs")
              ? "bg-[#204195]/10 text-[#204195]"
              : "text-[#607096] hover:bg-[#F7F9FD] hover:text-[#204195]"
          }`}
          aria-label={t("userDash.nav.myCvs")}
        >
          <FileText className="size-5" />
        </Link>
        <Link
          href="/dashboard/profile"
          className={`rounded-xl p-2.5 transition-colors ${
            pathname.startsWith("/dashboard/profile")
              ? "bg-[#204195]/10 text-[#204195]"
              : "text-[#607096] hover:bg-[#F7F9FD] hover:text-[#204195]"
          }`}
          aria-label={t("userDash.nav.profile")}
        >
          <User className="size-5" />
        </Link>
      </nav>
    </div>
    </>
  );
}
