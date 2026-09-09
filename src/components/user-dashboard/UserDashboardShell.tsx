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
    "flex items-center gap-3 rounded-md px-4 py-3 font-sans text-sm transition-colors";
  const navInactive =
    "text-[#5E5D59] hover:bg-[#F0EEE6] hover:text-[#141413]";
  const navActive =
    "border border-[#E8E6DC] bg-white text-[#141413] font-medium";

  const linkClass = (active: boolean) =>
    `${navBase} ${navReady && active ? navActive : navInactive}`;

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-80 flex-col justify-between overflow-y-auto overscroll-contain border-r border-[#E8E6DC] bg-[#FAF9F5] md:flex xl:w-96">
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
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#141413] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#2A2A28]"
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

      <nav className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-around gap-2 rounded-xl border border-[#E8E6DC] bg-white px-3 py-2 md:hidden">
        <Link
          href="/interview/select"
          className="rounded-md bg-[#141413] p-3 text-white transition-colors"
          aria-label={t("userDash.nav.newInterview")}
        >
          <span className="material-symbols-outlined">add_circle</span>
        </Link>
        <Link
          href="/voice"
          className="rounded-md p-3 text-[#5E5D59] transition-colors hover:bg-[#F0EEE6] hover:text-[#141413]"
          aria-label="Voice"
        >
          <span className="material-symbols-outlined">mic</span>
        </Link>
        <Link
          href="/practice"
          className="rounded-md p-3 text-[#5E5D59] transition-colors hover:bg-[#F0EEE6] hover:text-[#141413]"
          aria-label={t("userDash.nav.practice")}
        >
          <span className="material-symbols-outlined">quiz</span>
        </Link>
        <Link
          href="/dashboard/cvs"
          className="rounded-md p-3 text-[#5E5D59] transition-colors hover:bg-[#F0EEE6] hover:text-[#141413]"
          aria-label={t("userDash.nav.myCvs")}
        >
          <span className="material-symbols-outlined">description</span>
        </Link>
        <Link
          href="/logout"
          className="rounded-md p-3 text-[#5E5D59] transition-colors hover:bg-[#F0EEE6] hover:text-[#141413]"
          aria-label="Logout"
        >
          <span className="material-symbols-outlined">call_end</span>
        </Link>
      </nav>
    </div>
  );
}
