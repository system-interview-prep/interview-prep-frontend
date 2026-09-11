import Link from "next/link";
import { cookies } from "next/headers";
import AdminDashboardJobNav from "./AdminDashboardJobNav";
import AdminSidebarBrand from "./AdminSidebarBrand";
import AdminAuthBadge from "./AdminAuthBadge";
import { getDictionary, normalizeLang } from "@/i18n/i18n";

export default async function AdminDashboardShell({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;

  return (
    <div className="min-w-0 overflow-x-hidden bg-[#FEF9EE] font-body text-[#234196] selection:bg-[#FCB625]">
      <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-80 shrink-0 flex-col justify-between overflow-y-auto border-r-2 border-[#234196] bg-white p-6 font-body text-sm font-medium overscroll-contain md:flex xl:w-96">
        <div className="space-y-6">
          <AdminSidebarBrand />

          <AdminDashboardJobNav />
        </div>

        <nav className="space-y-1 border-t-2 border-[#234196] pt-6">
          <Link
            className="flex items-center gap-3 rounded-xl border-2 border-transparent px-4 py-2.5 text-[#5A6B8F] transition-colors hover:border-[#234196] hover:bg-[#F0F4FC] hover:text-[#234196]"
            href="/admin/interviews"
          >
            <span className="material-symbols-outlined">forum</span>
            {t("admin.interviews")}
          </Link>
          <Link
            className="flex items-center gap-3 rounded-xl border-2 border-transparent px-4 py-2.5 text-[#5A6B8F] transition-colors hover:border-[#234196] hover:bg-[#F0F4FC] hover:text-[#234196]"
            href="/admin/insights"
          >
            <span className="material-symbols-outlined">psychology</span>
            {t("admin.aiInsights")}
          </Link>
          <Link
            className="flex items-center gap-3 rounded-xl border-2 border-transparent px-4 py-2.5 text-[#5A6B8F] transition-colors hover:border-[#234196] hover:bg-[#F0F4FC] hover:text-[#234196]"
            href="/admin/knowledge-base"
          >
            <span className="material-symbols-outlined">database</span>
            {t("admin.knowledgeBase")}
          </Link>
          <Link
            className="flex items-center gap-3 rounded-xl border-2 border-transparent px-4 py-2.5 text-[#5A6B8F] transition-colors hover:border-[#234196] hover:bg-[#F0F4FC] hover:text-[#234196]"
            href="/admin/settings"
          >
            <span className="material-symbols-outlined">settings</span>
            {t("common.settings")}
          </Link>
        </nav>

        <div className="space-y-1 border-t-2 border-[#234196] pt-6">
          <div className="mb-4 rounded-xl border-2 border-[#234196] bg-[#F0F4FC] p-3 shadow-[2px_2px_0_#234196]">
            <AdminAuthBadge roleLabel={t("admin.role.seniorAdmin")} />
          </div>
          <Link
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[#5A6B8F] transition-colors hover:bg-[#F0F4FC] hover:text-[#234196]"
            href="/admin/help"
          >
            <span className="material-symbols-outlined">help</span>
            {t("common.helpCenter")}
          </Link>
          <Link
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[#D32F2F] transition-colors hover:bg-[#FFEBEE]"
            href="/logout"
          >
            <span className="material-symbols-outlined">logout</span>
            {t("common.logout")}
          </Link>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b-2 border-[#234196] bg-white px-4 py-3 [&>div]:mb-0 md:hidden">
        <AdminSidebarBrand />
        <div className="flex items-center gap-2">
          <Link href="/admin/job-profiles/create" className="chunky-primary min-h-11 px-3 text-xs" aria-label={t("admin.sidebar.createProfile")}><span className="material-symbols-outlined text-xl">add</span></Link>
          <Link href="/admin/settings" className="grid h-11 w-11 place-items-center rounded-xl border-2 border-[#234196] bg-white" aria-label={t("common.settings")}><span className="material-symbols-outlined text-xl">settings</span></Link>
        </div>
      </header>

      <main className="ml-0 min-h-screen min-w-0 overflow-x-hidden px-4 pb-28 pt-8 sm:px-6 md:ml-80 md:px-10 md:pb-12 md:pt-12 lg:px-12 xl:ml-96">
        {children}
      </main>

      <nav className="fixed bottom-4 left-4 right-4 z-50 grid grid-cols-4 rounded-xl border-2 border-[#234196] bg-white p-2 shadow-[4px_4px_0_#234196] md:hidden" aria-label={t("admin.sidebar.jobNavAria")}>
        <Link href="/admin/dashboard" className="flex min-h-12 flex-col items-center justify-center rounded-lg bg-[#FCB625] px-1 text-[9px] font-bold"><span className="material-symbols-outlined text-xl" aria-hidden="true">work</span>{t("admin.sidebar.jobBoard")}</Link>
        <Link href="/admin/job-profiles/create" className="flex min-h-12 flex-col items-center justify-center rounded-lg px-1 text-[9px] font-bold hover:bg-[#F0F4FC]"><span className="material-symbols-outlined text-xl" aria-hidden="true">add</span>{t("admin.sidebar.createProfile")}</Link>
        <Link href="/admin/job-profiles/categories" className="flex min-h-12 flex-col items-center justify-center rounded-lg px-1 text-[9px] font-bold hover:bg-[#F0F4FC]"><span className="material-symbols-outlined text-xl" aria-hidden="true">category</span>{t("admin.sidebar.categories")}</Link>
        <Link href="/admin/profile" className="flex min-h-12 flex-col items-center justify-center rounded-lg px-1 text-[9px] font-bold hover:bg-[#F0F4FC]"><span className="material-symbols-outlined text-xl" aria-hidden="true">person</span>{t("userDash.nav.profile")}</Link>
      </nav>
    </div>
  );
}
