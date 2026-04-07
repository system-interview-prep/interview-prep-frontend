"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useSyncExternalStore, type ReactNode } from "react";
import { useLanguage } from "../../i18n/LanguageProvider";

const subscribeNothing = () => () => {};

function useIsClient() {
  return useSyncExternalStore(subscribeNothing, () => true, () => false);
}

export function UserDashboardShell({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const pathname = usePathname();
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
      settings: pathname.startsWith("/pricing"),
      help: pathname.startsWith("/resources"),
    }),
    [pathname],
  );

  const navBase =
    "flex items-center gap-3 px-4 py-3 rounded-md hover:translate-x-1 transition-transform duration-200";
  const navInactive =
    "text-[#434654] dark:text-slate-400 hover:bg-[#e0e3e5] dark:hover:bg-slate-700/50";
  const navActive =
    "bg-white dark:bg-slate-700 text-[#003d9b] dark:text-blue-300 shadow-sm font-semibold";

  const linkClass = (active: boolean) =>
    `${navBase} ${navReady && active ? navActive : navInactive}`;

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-80 flex-col justify-between overflow-y-auto overscroll-contain bg-[#f2f4f6] dark:bg-slate-800/50 md:flex xl:w-96">
        <div className="space-y-6 p-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl px-2 py-1 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/5"
            aria-label={t("interview.select.backDashboard")}
          >
            <div className="w-10 h-10 overflow-hidden rounded-lg flex items-center justify-center">
              <img src="/logo.jpg" alt="INTERVIA" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tighter text-[#191c1e] dark:text-white">
                {t("userDash.sidebar.brand")}
              </h1>
              <p className="text-xs text-on-surface-variant">AI Interview Suite</p>
            </div>
          </Link>

          <Link
            href="/interview/select"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-headline text-sm font-bold text-on-primary shadow-sm transition-all active:scale-95 hover:bg-primary-container"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            {t("userDash.nav.newInterview")}
          </Link>

          <nav className="space-y-2">
            <Link
              href="/dashboard"
              className={linkClass(isActive.dashboard)}
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span className="font-inter text-sm font-medium">{t("userDash.nav.dashboard")}</span>
            </Link>
            <Link
              href="/dashboard/jobs"
              className={linkClass(isActive.jobs)}
            >
              <span className="material-symbols-outlined">work</span>
              <span className="font-inter text-sm font-medium">{t("userDash.nav.openRoles")}</span>
            </Link>
            <Link
              href="/dashboard/cvs"
              className={linkClass(isActive.myCvs)}
            >
              <span className="material-symbols-outlined">description</span>
              <span className="font-inter text-sm font-medium">{t("userDash.nav.myCvs")}</span>
            </Link>
            <Link
              href="/interview/select"
              className={linkClass(isActive.interviews)}
            >
              <span className="material-symbols-outlined">forum</span>
              <span className="font-inter text-sm font-medium">{t("userDash.nav.interviews")}</span>
            </Link>
            <Link
              href="/practice"
              className={linkClass(isActive.practice)}
            >
              <span className="material-symbols-outlined">school</span>
              <span className="font-inter text-sm font-medium">{t("userDash.nav.practice")}</span>
            </Link>
            <Link
              href="/dashboard/profile"
              className={linkClass(isActive.profile)}
            >
              <span className="material-symbols-outlined">person</span>
              <span className="font-inter text-sm font-medium">{t("userDash.nav.profile")}</span>
            </Link>
            <Link
              href="/pricing"
              className={linkClass(isActive.settings)}
            >
              <span className="material-symbols-outlined">settings</span>
              <span className="font-inter text-sm font-medium">{t("userDash.nav.settings")}</span>
            </Link>
          </nav>

          <div className="border-t border-outline-variant/20 pt-6 space-y-2">
            <Link
              href="/resources"
              className={linkClass(isActive.help)}
            >
              <span className="material-symbols-outlined">help</span>
              <span className="font-inter text-sm font-medium">{t("userDash.nav.help")}</span>
            </Link>
            <Link
              href="/logout"
              className={`${navBase} text-error hover:bg-error-container/20`}
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-inter text-sm font-medium">{t("userDash.nav.logout")}</span>
            </Link>
          </div>
        </div>
      </aside>

      <div className="ml-0 min-h-screen pb-28 md:ml-80 md:pb-0 xl:ml-96">{children}</div>

      <nav className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 rounded-full px-6 py-3 w-fit min-w-[280px] max-w-[calc(100vw-2rem)] bg-[#7029e1]/85 backdrop-blur-xl flex items-center justify-around gap-4 z-50 shadow-[0_40px_60px_rgba(25,28,30,0.04)] border border-[#c3c6d6]/20">
        <Link
          href="/interview/select"
          className="bg-white/20 rounded-full p-3 text-white transition-transform hover:scale-110 active:scale-90"
          aria-label={t("userDash.nav.newInterview")}
        >
          <span className="material-symbols-outlined">add_circle</span>
        </Link>
        <Link
          href="/voice"
          className="text-white/70 hover:text-white p-3 transition-transform hover:scale-110 active:scale-90 rounded-full"
          aria-label="Voice"
        >
          <span className="material-symbols-outlined">mic</span>
        </Link>
        <Link
          href="/practice"
          className="text-white/70 hover:text-white p-3 transition-transform hover:scale-110 active:scale-90 rounded-full"
          aria-label={t("userDash.nav.practice")}
        >
          <span className="material-symbols-outlined">quiz</span>
        </Link>
        <Link
          href="/dashboard/cvs"
          className="text-white/70 hover:text-white p-3 transition-transform hover:scale-110 active:scale-90 rounded-full"
          aria-label={t("userDash.nav.myCvs")}
        >
          <span className="material-symbols-outlined">description</span>
        </Link>
        <Link
          href="/logout"
          className="text-white/70 hover:text-white p-3 transition-transform hover:scale-110 active:scale-90 rounded-full"
          aria-label="Logout"
        >
          <span className="material-symbols-outlined">call_end</span>
        </Link>
      </nav>
    </div>
  );
}
