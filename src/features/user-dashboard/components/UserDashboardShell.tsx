"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useSyncExternalStore, type ReactNode } from "react";
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
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

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
    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-sans text-sm transition-all duration-150 motion-reduce:transition-none";
  const navInactive =
    "text-[#607096] hover:bg-[#F7F9FD] hover:text-[#204195] font-medium";
  const navActive =
    "bg-[#204195]/10 text-[#204195] font-bold shadow-xs";

  const linkClass = (active: boolean) =>
    `${navBase} ${navReady && active ? navActive : navInactive}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body text-[#14244B]">
      <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-80 flex-col justify-between overflow-y-auto overscroll-contain border-r border-[#DCE4F3] bg-white md:flex xl:w-80">
        <div className="space-y-6 p-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl px-2 py-1 transition-opacity hover:opacity-90"
            aria-label={t("interview.select.backDashboard")}
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#204195] text-[#FCB625] shadow-xs">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-[#14244B]">
                {t("userDash.sidebar.brand")}
              </h1>
              <p className="text-[11px] font-medium text-[#607096]">{t("userDash.sidebar.tagline")}</p>
            </div>
          </Link>

          <Link
            href="/interview/select"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#204195] hover:bg-[#183275] px-4 py-2.5 text-sm font-extrabold text-white shadow-xs transition-all hover:shadow-sm active:scale-[0.99]"
          >
            <Plus className="size-4" />
            <span>{t("userDash.nav.newInterview")}</span>
          </Link>

          <nav className="space-y-1">
            <Link
              href="/dashboard"
              className={linkClass(isActive.dashboard)}
            >
              <LayoutDashboard className="size-5" />
              <span className="font-inter text-sm">{t("userDash.nav.dashboard")}</span>
            </Link>
            <Link
              href="/dashboard/jobs"
              className={linkClass(isActive.jobs)}
            >
              <Briefcase className="size-5" />
              <span className="font-inter text-sm">{t("userDash.nav.openRoles")}</span>
            </Link>
            <Link
              href="/dashboard/cvs"
              className={linkClass(isActive.myCvs)}
            >
              <FileText className="size-5" />
              <span className="font-inter text-sm">{t("userDash.nav.myCvs")}</span>
            </Link>
            <Link
              href="/interview/select"
              className={linkClass(isActive.interviews)}
            >
              <MessageSquare className="size-5" />
              <span className="font-inter text-sm">{t("userDash.nav.interviews")}</span>
            </Link>
            <Link
              href="/practice"
              className={linkClass(isActive.practice)}
            >
              <GraduationCap className="size-5" />
              <span className="font-inter text-sm">{t("userDash.nav.practice")}</span>
            </Link>
            <Link
              href="/dashboard/profile"
              className={linkClass(isActive.profile)}
            >
              <User className="size-5" />
              <span className="font-inter text-sm">{t("userDash.nav.profile")}</span>
            </Link>
            <Link
              href="/dashboard/settings"
              className={linkClass(isActive.settings)}
            >
              <Settings className="size-5" />
              <span className="font-inter text-sm">{t("userDash.nav.settings")}</span>
            </Link>
          </nav>

          <div className="space-y-1 border-t border-[#EAEFF8] pt-4">
            <Link
              href="/dashboard/help"
              className={linkClass(isActive.help)}
            >
              <HelpCircle className="size-5" />
              <span className="font-inter text-sm">{t("userDash.nav.help")}</span>
            </Link>
            <Link
              href="/logout"
              className={`${navBase} text-[#C43B3B] hover:bg-[#FEF2F2] hover:text-[#DC2626] font-medium`}
            >
              <LogOut className="size-5" />
              <span className="font-inter text-sm">{t("userDash.nav.logout")}</span>
            </Link>
          </div>
        </div>
      </aside>

      <div className="ml-0 min-h-screen pb-28 md:ml-80 md:pb-0">{children}</div>

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
  );
}
