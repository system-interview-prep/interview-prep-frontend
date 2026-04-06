import Link from "next/link";
import { cookies } from "next/headers";
import AdminDashboardJobNav from "./AdminDashboardJobNav";
import AdminSidebarBrand from "./AdminSidebarBrand";
import { getDictionary, normalizeLang } from "@/i18n/i18n";

export default async function AdminDashboardShell({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;

  return (
    <div className="min-w-0 overflow-x-hidden bg-surface font-body text-on-surface selection:bg-primary-fixed">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 shrink-0 flex-col space-y-8 bg-surface-container-low p-6 font-body text-sm font-medium">
        <AdminSidebarBrand />

        <AdminDashboardJobNav />

        <nav className="flex-grow space-y-1 border-t border-outline-variant/20 pt-6">
          <Link
            className="flex items-center gap-3 rounded-md px-4 py-3 text-on-surface-variant transition-transform duration-200 hover:translate-x-1 hover:bg-surface-variant"
            href="/admin/interviews"
          >
            <span className="material-symbols-outlined">forum</span>
            {t("admin.interviews")}
          </Link>
          <Link
            className="flex items-center gap-3 rounded-md px-4 py-3 text-on-surface-variant transition-transform duration-200 hover:translate-x-1 hover:bg-surface-variant"
            href="/admin/insights"
          >
            <span className="material-symbols-outlined">psychology</span>
            {t("admin.aiInsights")}
          </Link>
          <Link
            className="flex items-center gap-3 rounded-md px-4 py-3 text-on-surface-variant transition-transform duration-200 hover:translate-x-1 hover:bg-surface-variant"
            href="/admin/knowledge-base"
          >
            <span className="material-symbols-outlined">database</span>
            {t("admin.knowledgeBase")}
          </Link>
          <Link
            className="flex items-center gap-3 rounded-md px-4 py-3 text-on-surface-variant transition-transform duration-200 hover:translate-x-1 hover:bg-surface-variant"
            href="/admin/settings"
          >
            <span className="material-symbols-outlined">settings</span>
            {t("common.settings")}
          </Link>
        </nav>

        <div className="space-y-1 border-t border-outline-variant/20 pt-6">
          <Link
            className="flex items-center gap-3 rounded-md px-4 py-3 text-on-surface-variant transition-colors hover:bg-surface-variant"
            href="/admin/help"
          >
            <span className="material-symbols-outlined">help</span>
            {t("common.helpCenter")}
          </Link>
          <Link
            className="flex items-center gap-3 rounded-md px-4 py-3 text-on-surface-variant transition-colors hover:bg-surface-variant"
            href="/logout"
          >
            <span className="material-symbols-outlined">logout</span>
            {t("common.logout")}
          </Link>
        </div>
      </aside>

      <main className="ml-64 min-h-screen w-[calc(100%-16rem)] min-w-0 overflow-x-hidden px-4 pb-10 pt-8 sm:px-6 md:px-10 md:pb-12 md:pt-12 lg:px-12">
        {children}
      </main>

      <footer className="ml-64 w-[calc(100%-16rem)] min-w-0 border-t border-outline-variant/20 bg-surface py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-12 md:flex-row">
          <div className="flex items-center gap-4">
            <span className="font-headline text-lg font-bold text-on-surface">Curator AI</span>
            <span className="text-xs text-on-surface-variant">
              © 2024 Curator AI Platform. Editorial Intelligence for HR.
            </span>
          </div>
          <div className="flex gap-8">
            <Link className="text-xs text-on-surface-variant hover:underline" href="/admin/settings">
              {t("footer.privacy")}
            </Link>
            <Link className="text-xs text-on-surface-variant hover:underline" href="/admin/settings">
              {t("footer.terms")}
            </Link>
            <Link className="text-xs text-on-surface-variant hover:underline" href="/admin/settings">
              {t("footer.cookies")}
            </Link>
            <Link className="text-xs text-on-surface-variant hover:underline" href="/admin/settings">
              {t("footer.security")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
