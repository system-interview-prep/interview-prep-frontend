import Link from "next/link";
import AdminButton from "../../../../components/admin/AdminButton";
import AdminSidebarBrand from "../../../../components/admin/AdminSidebarBrand";
import AdminAuthBadge from "../../../../components/admin/AdminAuthBadge";
import AdminProfilePersonalInfoClient from "../../../../components/admin/AdminProfilePersonalInfoClient";
import { cookies } from "next/headers";
import { getDictionary, normalizeLang } from "../../../i18n/i18n";

export default async function AdminProfilePage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;

  return (
    <div className="bg-surface font-body text-on-surface">
      {/* SideNavBar (consistent shell) */}
      <aside className="h-screen w-72 fixed left-0 top-0 bg-[#f2f4f6] dark:bg-slate-900 flex flex-col py-12 px-6 z-50 font-headline antialiased tracking-tight">
        <AdminSidebarBrand />

        <nav className="flex-1 space-y-2">
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 hover:bg-[#eceef0] dark:hover:bg-slate-800 transition-colors duration-150 ease-in-out"
            href="/admin/dashboard"
          >
            <span className="material-symbols-outlined" data-icon="dashboard">
              dashboard
            </span>
            <span className="font-medium">{t("common.dashboard")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 hover:bg-[#eceef0] dark:hover:bg-slate-800 transition-colors duration-150 ease-in-out"
            href="/admin/interviews"
          >
            <span className="material-symbols-outlined" data-icon="video_chat">
              video_chat
            </span>
            <span className="font-medium">{t("admin.interviews")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 hover:bg-[#eceef0] dark:hover:bg-slate-800 transition-colors duration-150 ease-in-out"
            href="/admin/insights"
          >
            <span className="material-symbols-outlined" data-icon="psychology">
              psychology
            </span>
            <span className="font-medium">{t("admin.aiInsights")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 hover:bg-[#eceef0] dark:hover:bg-slate-800 transition-colors duration-150 ease-in-out"
            href="/admin/knowledge-base"
          >
            <span className="material-symbols-outlined" data-icon="database">
              database
            </span>
            <span className="font-medium">{t("admin.knowledgeBase")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 hover:bg-[#eceef0] dark:hover:bg-slate-800 transition-colors duration-150 ease-in-out"
            href="/admin/practice"
          >
            <span className="material-symbols-outlined" data-icon="fitness_center">
              fitness_center
            </span>
            <span className="font-medium">{t("admin.practice")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 hover:bg-[#eceef0] dark:hover:bg-slate-800 transition-colors duration-150 ease-in-out"
            href="/admin/help"
          >
            <span className="material-symbols-outlined" data-icon="help">
              help
            </span>
            <span className="font-medium">{t("common.helpCenter")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#003d9b] dark:text-blue-400 font-bold border-r-4 border-[#003d9b] bg-[#eceef0] dark:bg-slate-800 transition-colors duration-150 ease-in-out"
            href="/admin/profile"
          >
            <span
              className="material-symbols-outlined"
              data-icon="account_circle"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_circle
            </span>
            <span className="font-bold">{t("common.profile")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 hover:bg-[#eceef0] dark:hover:bg-slate-800 transition-colors duration-150 ease-in-out"
            href="/admin/settings"
          >
            <span className="material-symbols-outlined" data-icon="settings">
              settings
            </span>
            <span className="font-medium">{t("common.settings")}</span>
          </Link>
        </nav>

        <div className="mt-auto pt-8 border-t border-outline-variant/20">
          <AdminAuthBadge roleLabel={t("admin.role.seniorAdmin")} />
        </div>
      </aside>

      {/* TopNavBar */}
      <header className="fixed top-0 right-0 left-72 z-40 bg-[#f7f9fb]/80 dark:bg-slate-950/80 backdrop-blur-xl h-16 px-8 flex justify-between items-center shadow-sm">
        <div className="flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <span
              className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm"
              data-icon="search"
            >
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container-highest rounded-lg text-sm border-none focus:ring-2 focus:ring-surface-tint/20 transition-all"
              placeholder={t("admin.search.settings")}
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button className="relative text-on-surface-variant hover:text-primary-container transition-all">
            <span className="material-symbols-outlined" data-icon="notifications">
              notifications
            </span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full"></span>
          </button>
          <AdminAuthBadge size="sm" roleLabel={t("admin.role.seniorAdmin")} />
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="ml-72 min-h-screen bg-surface px-6 pb-16 pt-24 sm:px-8 lg:px-12">
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
              <AdminButton variant="surface" size="md">
                {t("admin.profile.discardChanges")}
              </AdminButton>
              <AdminButton variant="primary" size="md">
                {t("admin.profile.saveSettings")}
              </AdminButton>
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
                  <AdminButton variant="surface" size="sm">
                    {t("admin.profile.editDetails")}
                  </AdminButton>
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
                        <span className="material-symbols-outlined" data-icon="lock">
                          lock
                        </span>
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
                        <span
                          className="material-symbols-outlined"
                          data-icon="shield_with_heart"
                        >
                          shield_with_heart
                        </span>
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

