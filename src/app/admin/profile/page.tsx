import Link from "next/link";
import AdminButton from "../../../../components/admin/AdminButton";
import AdminSidebarBrand from "../../../../components/admin/AdminSidebarBrand";
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary overflow-hidden">
              <img
                className="w-full h-full object-cover"
                alt="Admin avatar"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDswreDho-Xt41rMSev13rXz-SyUuREDn1yeQM7YeZfHKwcVh9lk_69fZVYNX6vYmJxkyvgRIjJUNV1YPRtF4s9o-91pL-OUF7B6bEVzQMvS8mMEzRtQmpzljCgPRFLAGvVmHy1NIP4GwZDCY4pNo2g5bsEQVAY5chUERTSsNCCtKGaX12tx373MQZG_zCxPzDTyEWwgECSYa0cuFs3leDZ8RaO5c89tntzS0VsfD79VVT1dlUNw-Lrl7eScscCgP_Ye2oSPhpKgNjD"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">Alex Rivera</p>
              <p className="text-xs text-on-surface-variant">{t("admin.role.seniorAdmin")}</p>
            </div>
          </div>
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
          <button className="flex items-center gap-2 text-primary font-medium">
            <span className="material-symbols-outlined" data-icon="account_circle">
              account_circle
            </span>
            <span className="text-sm">{t("admin.profile.adminProfileTitle")}</span>
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="ml-72 pt-24 pb-12 px-12 min-h-screen">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <header className="mb-12">
            <h2 className="text-5xl font-extrabold font-headline tracking-tight text-on-surface mb-2">
              {t("admin.profile.adminProfileTitle")}
            </h2>
            <p className="text-on-surface-variant text-base">
              {t("admin.profile.adminProfileSubtitle")}
            </p>
          </header>

          <div className="grid grid-cols-12 gap-8">
            {/* Left column */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
              {/* Personal Information */}
              <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm transition-all duration-300">
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

                <div className="space-y-8">
                  <div className="flex items-center gap-6 pb-8 border-b border-outline-variant/10">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-surface-container">
                        <img
                          className="w-full h-full object-cover"
                          alt="Profile Avatar"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuD59rjcN2Pi8vcU324CEjgEOEpgA88ek1i8lKoNuET2yytNHi-ZBmikCigvU2zrorRm6KYox35ZZ8RkqSRmU3aUragZu_RdFtUZ0SeHHYV783qyTutqSZiTfY8JlS0dY2l-vatSa_dil1fCT1url-_w42MPEJeWuwxKZnS-wkUmIYOgCsEg7Ls5ikiDtbGzSk5sLUrvtXPuD7WrZ4BIdZWAJrH2I5OetcmqjJW5qPNv8wuCj4t8j0I7qWqNn6luXollEAYbCaWfcEZw"
                        />
                      </div>
                      <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-sm" data-icon="photo_camera">
                          photo_camera
                        </span>
                      </button>
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface">{t("admin.profile.profileAvatar")}</h4>
                      <p className="text-xs text-on-surface-variant mt-1">
                        {t("admin.profile.avatarHint")}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        {t("admin.profile.fullName")}
                      </label>
                      <input
                        className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-surface-tint/20 transition-all"
                        type="text"
                        defaultValue="Alex Rivera"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        {t("admin.profile.emailAddress")}
                      </label>
                      <input
                        className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-surface-tint/20 transition-all"
                        type="email"
                        defaultValue="alex.rivera@synthetix.ai"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        {t("admin.profile.role")}
                      </label>
                      <div className="w-full bg-surface-dim/30 border-none rounded-lg px-4 py-3 text-sm text-on-surface-variant flex items-center gap-2 cursor-not-allowed">
                        <span className="material-symbols-outlined text-sm" data-icon="verified">
                          verified
                        </span>
                        {t("admin.profile.role.seniorAdministrator")}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        {t("admin.profile.timezone")}
                      </label>
                      <select className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-surface-tint/20 transition-all">
                        <option>{t("admin.profile.timezone.ict")}</option>
                        <option>{t("admin.profile.timezone.pst")}</option>
                        <option>{t("admin.profile.timezone.cet")}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* Account Security */}
              <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
                <h3 className="text-xl font-bold font-headline text-on-surface mb-2">
                  {t("admin.profile.accountSecurity")}
                </h3>
                <p className="text-sm text-on-surface-variant mb-8">
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

            {/* Right column */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
              {/* Localization */}
              <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-primary" data-icon="language">
                    language
                  </span>
                  <h3 className="font-bold font-headline text-on-surface">{t("admin.profile.localization")}</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border-2 border-primary bg-primary/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-surface-container">
                        <img
                          className="w-full h-full object-cover"
                          alt="English (US)"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFJGwCgeT9hWuWqG0h43PI44ZINsqi5IkDCCFRkSOBZpaXjoU_DJUD2Aj7naOXeQenh2WIffffjbA05i3EqU376t_gd890NdPLXktUCfLxlPtbqBRhop5ImJApwNkyVo4vYX2zJmEPNrGql8rI8EvBHn5Xr33L6o93xayqf3S3PFWXeKa8y4YAA6Eng2l6Ivz1Y4BDipYG-0G6KjLadjKpNeRxMxNxL0DfiYah-QJitzyduPwLfP-jEO_qsoepRH5PWGLYVP36ASnw"
                        />
                      </div>
                      <span className="text-sm font-bold text-on-surface">
                        {t("admin.profile.language.englishUs")}
                      </span>
                    </div>
                    <span
                      className="material-symbols-outlined text-primary text-sm"
                      data-icon="check_circle"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  </div>
                  <div className="p-4 rounded-xl border border-outline-variant/20 hover:border-outline transition-colors flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-surface-container">
                        <img
                          className="w-full h-full object-cover"
                          alt="Tiếng Việt"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4wM2p0WGhlKFlyEHOjUBqWkGg0LQi5-mIN3D-rxaAwISVgbAAswWVWKHYIOzGfjGKh2XC7v1jQX0L9G9q3t3A7E7JbT-ni3kXZ-c1v6S1wJsK8y1uahvI2OcQwufQhpqYwBzgqDz2Xg5R4Loa5W340z2sn4-DPGH6xQyXavWyaCAECNnlvwr61FQs1wKo_yEthkyCVHow8k5y2nIHvJQC96tnRwmZ9dyWSdXyW8pjvTCoSCWFLTEnljyXT0NbJ_7OorTU2ubaIXrY"
                        />
                      </div>
                      <span className="text-sm text-on-surface">{t("admin.profile.language.vietnamese")}</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Notifications */}
              <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <span
                    className="material-symbols-outlined text-primary"
                    data-icon="notifications_active"
                  >
                    notifications_active
                  </span>
                  <h3 className="font-bold font-headline text-on-surface">{t("admin.profile.notifications")}</h3>
                </div>
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-on-surface">{t("admin.profile.emailNotifications")}</p>
                      <p className="text-xs text-on-surface-variant">
                        {t("admin.profile.dailySummary")}
                      </p>
                    </div>
                    <div className="w-10 h-5 bg-surface-container-highest rounded-full relative p-1 cursor-pointer">
                      <div className="w-3 h-3 bg-white rounded-full transition-transform"></div>
                    </div>
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-on-surface">{t("admin.profile.browserAlerts")}</p>
                      <p className="text-xs text-on-surface-variant">
                        {t("admin.profile.realtimeStatus")}
                      </p>
                    </div>
                    <div className="w-10 h-5 bg-primary rounded-full relative p-1 cursor-pointer">
                      <div className="w-3 h-3 bg-white rounded-full translate-x-5 transition-transform"></div>
                    </div>
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-on-surface">{t("admin.profile.aiInsightsPing")}</p>
                      <p className="text-xs text-on-surface-variant">
                        {t("admin.profile.whenAnalyticsReady")}
                      </p>
                    </div>
                    <div className="w-10 h-5 bg-primary rounded-full relative p-1 cursor-pointer">
                      <div className="w-3 h-3 bg-white rounded-full translate-x-5 transition-transform"></div>
                    </div>
                  </div>
                </div>
              </section>

              {/* AI CTA */}
              <section className="relative overflow-hidden bg-tertiary rounded-2xl p-8 text-white">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
                      AI Assistant
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 block mb-2">
                    {t("admin.profile.aiAssistant")}
                  </span>
                  <h4 className="text-lg font-bold font-headline mb-2">
                    {t("admin.profile.optimizeProfile")}
                  </h4>
                  <p className="text-xs opacity-70 mb-6">
                    {t("admin.profile.optimizeProfileDesc")}
                  </p>
                  <AdminButton variant="surface" size="md" className="w-full">
                    {t("admin.profile.generateSuggestions")}
                  </AdminButton>
                </div>
                <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-tertiary-container rounded-full blur-[60px] opacity-40"></div>
              </section>
            </div>
          </div>

          {/* Action Bar */}
          <footer className="mt-12 pt-8 border-t border-outline-variant/10 flex justify-end gap-4">
            <AdminButton variant="surface" size="md">
              {t("admin.profile.discardChanges")}
            </AdminButton>
            <AdminButton variant="primary" size="md">
              {t("admin.profile.saveSettings")}
            </AdminButton>
          </footer>
        </div>
      </main>

      {/* Glass Mic-Tray */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-3 bg-white/80 backdrop-blur-xl rounded-full shadow-2xl border border-white/40 z-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-tertiary"></div>
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            {t("admin.profile.nexusSystemActive")}
          </span>
        </div>
        <div className="h-4 w-[1px] bg-outline-variant/30"></div>
        <div className="flex gap-4 text-on-surface-variant">
          <span className="material-symbols-outlined text-lg cursor-pointer hover:text-primary transition-colors" data-icon="mic">
            mic
          </span>
          <span className="material-symbols-outlined text-lg cursor-pointer hover:text-primary transition-colors" data-icon="videocam">
            videocam
          </span>
          <span className="material-symbols-outlined text-lg cursor-pointer hover:text-primary transition-colors" data-icon="monitor_heart">
            monitor_heart
          </span>
        </div>
      </div>
    </div>
  );
}

