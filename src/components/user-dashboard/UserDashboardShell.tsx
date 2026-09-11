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
    "flex items-center gap-3 rounded-xl border-2 border-transparent px-4 py-3 font-sans text-sm transition-all duration-150 motion-reduce:transition-none";
  const navInactive =
    "text-[#5A6B8F] hover:border-[#234196] hover:bg-[#F0F4FC] hover:text-[#234196]";
  const navActive =
    "border-[#234196] bg-[#FCB625] font-bold text-[#234196] shadow-[2px_2px_0_#234196]";

  const linkClass = (active: boolean) =>
    `${navBase} ${navReady && active ? navActive : navInactive}`;

  return (
    <div className="min-h-screen bg-white font-body text-[#234196]">
      <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-80 flex-col justify-between overflow-y-auto overscroll-contain border-r-2 border-[#234196] bg-white md:flex xl:w-96">
        <div className="space-y-6 p-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl px-2 py-1 transition-colors hover:bg-[#F0F4FC]"
            aria-label={t("interview.select.backDashboard")}
          >
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border-2 border-[#234196]">
              <img src="/logo.jpg" alt="INTERVIA" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tighter text-[#234196]">
                {t("userDash.sidebar.brand")}
              </h1>
              <p className="text-xs text-[#5A6B8F]">{t("userDash.sidebar.tagline")}</p>
            </div>
          </Link>

          <Link
            href="/interview/select"
            className="chunky-primary flex min-h-12 w-full items-center justify-center gap-2 px-4 py-3 text-sm"
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

          <div className="space-y-2 border-t-2 border-[#234196] pt-6">
            <Link
              href="/resources"
              className={linkClass(isActive.help)}
            >
              <span className="material-symbols-outlined">help</span>
              <span className="font-inter text-sm font-medium">{t("userDash.nav.help")}</span>
            </Link>
            <Link
              href="/logout"
              className={`${navBase} text-[#D32F2F] hover:border-[#D32F2F] hover:bg-[#FFEBEE]`}
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-inter text-sm font-medium">{t("userDash.nav.logout")}</span>
            </Link>
          </div>
        </div>
      </aside>

      <div className="ml-0 min-h-screen pb-28 md:ml-80 md:pb-0 xl:ml-96">{children}</div>

      <nav className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-around gap-2 rounded-xl border-2 border-[#234196] bg-white px-3 py-2 shadow-[4px_4px_0_#234196] md:hidden">
        <Link
          href="/interview/select"
          className="rounded-lg border-2 border-[#234196] bg-[#FCB625] p-3 text-[#234196] transition-colors"
          aria-label={t("userDash.nav.newInterview")}
        >
          <span className="material-symbols-outlined">add_circle</span>
        </Link>
        <Link
          href="/voice"
          className="rounded-lg p-3 text-[#5A6B8F] transition-colors hover:bg-[#F0F4FC] hover:text-[#234196]"
          aria-label={t("userDash.mode.voice.title")}
        >
          <span className="material-symbols-outlined">mic</span>
        </Link>
        <Link
          href="/practice"
          className="rounded-lg p-3 text-[#5A6B8F] transition-colors hover:bg-[#F0F4FC] hover:text-[#234196]"
          aria-label={t("userDash.nav.practice")}
        >
          <span className="material-symbols-outlined">quiz</span>
        </Link>
        <Link
          href="/dashboard/cvs"
          className="rounded-lg p-3 text-[#5A6B8F] transition-colors hover:bg-[#F0F4FC] hover:text-[#234196]"
          aria-label={t("userDash.nav.myCvs")}
        >
          <span className="material-symbols-outlined">description</span>
        </Link>
        <Link
          href="/logout"
          className="rounded-lg p-3 text-[#D32F2F] transition-colors hover:bg-[#FFEBEE]"
          aria-label={t("userDash.nav.logout")}
        >
          <span className="material-symbols-outlined">call_end</span>
        </Link>
      </nav>
    </div>
  );
}
