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
    <div className="bg-surface font-body text-on-surface min-h-screen">
      <aside className="hidden md:flex md:flex-col h-screen w-64 fixed left-0 top-0 bg-[#f2f4f6] dark:bg-slate-800/50 z-40">
        <div className="flex flex-col h-full p-6 space-y-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl px-2 py-1 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/5"
            aria-label={t("interview.select.backDashboard")}
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-sm">psychology</span>
            </div>
            <div>
              <h1 className="font-headline font-extrabold text-[#191c1e] dark:text-white leading-none">
                {t("userDash.sidebar.brand")}
              </h1>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">
                {t("userDash.sidebar.tagline")}
              </p>
            </div>
          </Link>

          <Link
            href="/interview/select"
            className="w-full py-3 px-4 bg-primary text-on-primary rounded-xl font-headline font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-container transition-all active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            {t("userDash.nav.newInterview")}
          </Link>

          <nav className="flex-1 space-y-2">
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

          <div className="pt-6 border-t border-outline-variant/20 space-y-2">
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

      <div className="ml-0 md:ml-64 min-h-screen pb-28 md:pb-0">{children}</div>

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
