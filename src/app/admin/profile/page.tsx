import Link from "next/link";
import Button from "@components/ui/Button";
import AdminSidebarBrand from "@features/admin/components/AdminSidebarBrand";
import AdminAuthBadge from "@features/admin/components/AdminAuthBadge";
import AdminProfilePersonalInfoClient from "@features/admin/components/AdminProfilePersonalInfoClient";
import { cookies } from "next/headers";
import { getDictionary, normalizeLang } from "@/i18n/i18n";
import {
  LayoutDashboard,
  Video,
  Brain,
  Database,
  Dumbbell,
  HelpCircle,
  User,
  Settings,
  Search,
  Bell,
  Lock,
  ShieldCheck,
} from "lucide-react";

export default async function AdminProfilePage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;

  return (
    <div className="bg-surface font-body text-on-surface">
      {/* SideNavBar (consistent shell) */}
      <aside className="fixed left-0 top-0 z-50 flex h-dvh w-80 flex-col overflow-y-auto overscroll-contain bg-[#f2f4f6] px-6 py-12 font-headline antialiased tracking-tight dark:bg-slate-900 xl:w-96">
        <AdminSidebarBrand />

        <nav className="flex-1 space-y-2">
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 hover:bg-[#eceef0] dark:hover:bg-slate-800 transition-colors duration-150 ease-in-out"
            href="/admin/dashboard"
          >
            <LayoutDashboard className="size-5 shrink-0" />
            <span className="font-medium">{t("common.dashboard")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 hover:bg-[#eceef0] dark:hover:bg-slate-800 transition-colors duration-150 ease-in-out"
            href="/admin/interviews"
          >
            <Video className="size-5 shrink-0" />
            <span className="font-medium">{t("admin.interviews")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 hover:bg-[#eceef0] dark:hover:bg-slate-800 transition-colors duration-150 ease-in-out"
            href="/admin/insights"
          >
            <Brain className="size-5 shrink-0" />
            <span className="font-medium">{t("admin.aiInsights")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 hover:bg-[#eceef0] dark:hover:bg-slate-800 transition-colors duration-150 ease-in-out"
            href="/admin/knowledge-base"
          >
            <Database className="size-5 shrink-0" />
            <span className="font-medium">{t("admin.knowledgeBase")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 hover:bg-[#eceef0] dark:hover:bg-slate-800 transition-colors duration-150 ease-in-out"
            href="/admin/practice"
          >
            <Dumbbell className="size-5 shrink-0" />
            <span className="font-medium">{t("admin.practice")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 hover:bg-[#eceef0] dark:hover:bg-slate-800 transition-colors duration-150 ease-in-out"
            href="/admin/help"
          >
            <HelpCircle className="size-5 shrink-0" />
            <span className="font-medium">{t("common.helpCenter")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#003d9b] dark:text-blue-400 font-bold border-r-4 border-[#003d9b] bg-[#eceef0] dark:bg-slate-800 transition-colors duration-150 ease-in-out"
            href="/admin/profile"
          >
            <User className="size-5 shrink-0" />
            <span className="font-bold">{t("common.profile")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 hover:bg-[#eceef0] dark:hover:bg-slate-800 transition-colors duration-150 ease-in-out"
            href="/admin/settings"
          >
            <Settings className="size-5 shrink-0" />
            <span className="font-medium">{t("common.settings")}</span>
          </Link>
        </nav>

        <div className="mt-auto pt-8 border-t border-outline-variant/20">
          <AdminAuthBadge roleLabel={t("admin.role.seniorAdmin")} />
        </div>
      </aside>

      {/* TopNavBar */}
      <header className="fixed top-0 right-0 left-80 z-40 flex h-16 items-center justify-between bg-[#f7f9fb]/80 px-8 shadow-sm backdrop-blur-xl dark:bg-slate-950/80 xl:left-96">
        <div className="flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant size-4" />
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container-highest rounded-lg text-sm border-none focus:ring-2 focus:ring-surface-tint/20 transition-all"
              placeholder={t("admin.search.settings")}
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button className="relative text-on-surface-variant hover:text-primary-container transition-all">
            <Bell className="size-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full"></span>
          </button>
          <AdminAuthBadge size="sm" roleLabel={t("admin.role.seniorAdmin")} />
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="ml-80 min-h-screen bg-surface px-6 pb-16 pt-24 sm:px-8 lg:px-12 xl:ml-96">
        <div className="mx-auto w-full max-w-6xl">
          {/* Page Header */}
          <header className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
              {t("admin.profile.adminProfileTitle")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-on-surface-variant sm:text-base">
                {t("admin.profile.adminProfileSubtitle")}
              </p>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-3">
              <Button variant="surface" size="md">
                {t("admin.profile.discardChanges")}
              </Button>
              <Button variant="primary" size="md">
                {t("admin.profile.saveSettings")}
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
            {/* Personal Information */}
            <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm sm:p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold font-headline text-on-surface">
                      {t("admin.profile.personalInfo")}
                    </h3>
                    <p className="text-sm text-on-surface-variant">
                      {t("admin.profile.personalInfoDesc")}
                    </p>
                  </div>
                  <Button variant="surface" size="sm">
                    {t("admin.profile.editDetails")}
                  </Button>
                </div>

                <AdminProfilePersonalInfoClient
                  avatarTitle={t("admin.profile.profileAvatar")}
                  avatarHint=""
                  fullNameLabel={t("admin.profile.fullName")}
                  emailLabel={t("admin.profile.emailAddress")}
                  roleLabel={t("admin.profile.role")}
                  roleValue={t("admin.profile.role.seniorAdministrator")}
                />
            </section>

            {/* Account Security */}
            <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm sm:p-8">
                <h3 className="mb-2 font-headline text-xl font-bold text-on-surface">
                  {t("admin.profile.accountSecurity")}
                </h3>
                <p className="mb-6 text-sm text-on-surface-variant">
                  {t("admin.profile.accountSecurityDesc")}
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low group hover:bg-surface-container-high transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Lock className="size-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-on-surface">{t("admin.profile.changePassword")}</p>
                        <p className="text-xs text-on-surface-variant">
                          {t("admin.profile.lastChangedMonthsAgo")}
                        </p>
                      </div>
                    </div>
                    <button className="text-primary font-bold text-xs hover:underline">
                      {t("admin.profile.update")}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low group hover:bg-surface-container-high transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
                        <ShieldCheck className="size-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-on-surface">
                          {t("admin.profile.twoFactor")}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {t("admin.profile.recommendedHighSecurity")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-10 h-5 bg-primary rounded-full relative p-1 cursor-pointer">
                        <div className="w-3 h-3 bg-white rounded-full translate-x-5 transition-transform"></div>
                      </div>
                    </div>
                  </div>
                </div>
            </section>
          </div>
        </div>
      </main>

    </div>
  );
}
