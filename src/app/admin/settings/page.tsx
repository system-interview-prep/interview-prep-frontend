import Link from "next/link";
import AdminButton from "../../../../components/admin/AdminButton";
import AdminSidebarBrand from "../../../../components/admin/AdminSidebarBrand";
import { cookies } from "next/headers";
import { getDictionary, normalizeLang } from "../../../i18n/i18n";
import LanguageToggleButton from "../../../components/LanguageToggleButton";

type MemberRole = "super_admin" | "senior_interviewer";

type MemberRow = {
  id: string;
  name: string;
  email: string;
  avatarSrc: string;
  role: MemberRole;
};

const members: MemberRow[] = [
  {
    id: "julian",
    name: "Julian D’Arcy",
    email: "julian@thecurator.ai",
    avatarSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAoPWFNJA30iKf8mHI1t95wvGpxY2WE4rSNFqVlBh-_ifj5JC7BXmHdUZ1hB2Ngbxu4JhlauGd6RbAd44MHdy5uCaEg8H8uFrxgnO64N04zViCsCDLPoRL0LIYRwNWBy3wnTN8KQsx7-wNLUliycIgMoX5ok28qZIYbfIdHCcY4vvrFjpNS0aLSwewY7O3gZIwzoFHUtYkB3PUwS2bzXxM_7l90KitmjwzUJsxXbUy8QVPB6nSk9w5sOlPTMqbwr2YAOcjWG7wheM-E",
    role: "super_admin",
  },
  {
    id: "sarah",
    name: "Sarah Vahn",
    email: "sarah.v@thecurator.ai",
    avatarSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBIVo955Kq2o8piSvOLQfomHJEuTVrTXST29hhQYe7aHgDwxjZhTG2yZ0cldFdKSi4i43XvPAzn5XkOMOQh6XePH1FtmZwwGnLDecBWpXlX0Lz9xkF9YXR6skO-GdW2gm_LX6aQx4Diseve9kmYLvmZhk12lNbVknwDjzdXy1yE7Ne_atqDPnXMLE_ovwW2gfGF9nIlwXNdj7UHPRdCpaQ-K0gNjbID0A6N8ymjVoJDHPe3TI5kXj4_CYvAST5iHiXHOfAxwIPF4ryK",
    role: "senior_interviewer",
  },
];

function rolePill(role: MemberRole) {
  if (role === "super_admin") {
    return {
      className:
        "px-3 py-1 bg-primary-container/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider",
      label: "admin.settings.role.superAdmin",
    };
  }
  return {
    className:
      "px-3 py-1 bg-surface-container-high text-on-surface-variant text-[10px] font-bold rounded-full uppercase tracking-wider",
    label: "admin.settings.role.seniorInterviewer",
  };
}

export default async function AdminSettingsPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;

  return (
    <div className="bg-surface font-body text-on-surface antialiased">
      {/* SideNavBar */}
      <aside className="h-screen w-72 flex-col fixed left-0 top-0 bg-[#f2f4f6] dark:bg-slate-900 font-headline antialiased tracking-tight flex py-12 px-6 z-50">
        <AdminSidebarBrand />

        <nav className="flex-1 space-y-2">
          <Link
            className="flex items-center gap-3 py-3 px-4 rounded-lg text-[#434654] dark:text-slate-400 font-medium hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-colors duration-200"
            href="/admin/dashboard"
          >
            <span className="material-symbols-outlined" data-icon="dashboard">
              dashboard
            </span>
            <span>{t("common.dashboard")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 py-3 px-4 rounded-lg text-[#434654] dark:text-slate-400 font-medium hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-colors duration-200"
            href="/admin/interviews"
          >
            <span className="material-symbols-outlined" data-icon="video_chat">
              video_chat
            </span>
            <span>{t("admin.interviews")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 py-3 px-4 rounded-lg text-[#434654] dark:text-slate-400 font-medium hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-colors duration-200"
            href="/admin/insights"
          >
            <span className="material-symbols-outlined" data-icon="psychology">
              psychology
            </span>
            <span>{t("admin.aiInsights")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 py-3 px-4 rounded-lg text-[#434654] dark:text-slate-400 font-medium hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-colors duration-200"
            href="/admin/knowledge-base"
          >
            <span className="material-symbols-outlined" data-icon="library_books">
              library_books
            </span>
            <span>{t("admin.knowledgeBase")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 py-3 px-4 rounded-lg text-[#003d9b] dark:text-blue-400 font-bold border-r-4 border-[#003d9b] dark:border-blue-400 bg-white/50 dark:bg-white/5"
            href="/admin/settings"
          >
            <span className="material-symbols-outlined" data-icon="settings">
              settings
            </span>
            <span>{t("common.settings")}</span>
          </Link>
        </nav>

        <div className="mt-auto pt-8 border-t border-outline-variant/10 space-y-2">
          <AdminButton
            variant="gradient"
            size="md"
            icon="auto_awesome"
            iconFill
            className="w-full"
          >
            {t("admin.settings.startAiAnalysis")}
          </AdminButton>
          <Link
            className="flex items-center gap-3 py-3 px-4 rounded-lg text-[#434654] dark:text-slate-400 font-medium hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-colors duration-200"
            href="/admin/help"
          >
            <span className="material-symbols-outlined" data-icon="help">
              help
            </span>
            <span>{t("common.helpCenter")}</span>
          </Link>

          <div className="pt-4 px-4">
            <div className="flex items-center gap-3">
              <img
                alt="Admin User Avatar"
                className="w-8 h-8 rounded-full bg-surface-container-high"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWloaoF6xh9T65yPDXMHRCNt0BHrysWS0rURexBYzcx2PmQeh8WAiqiMkFXRjz7AVDDltbAgSThWWgOSpv0PU43H9pIk2Ka1vraf3u7HJLy-S0h4kc-UAVvjX5_L5ZBxswqRjymnARgSd_cwFlOv4nf8vEsJKYy-vIVQ1-LmVgP-NQuCoppZYnlW3fJNswdht8NiF05Tps-8leMco_BBx8wq02yFrtyFw_Z2shkp8ouGppfta9guibespJjrhBwlieanIIxisIhSZV"
              />
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">{t("admin.userLabel")}</p>
                <p className="text-[10px] text-on-surface-variant truncate">
                  admin@thecurator.ai
                </p>
              </div>
            </div>
            <Link
              href="/logout"
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-error bg-error-container/20 rounded-md hover:bg-error-container/40 transition-colors"
            >
              <span className="material-symbols-outlined text-sm" data-icon="logout">
                logout
              </span>
              {t("common.logout")}
            </Link>
          </div>
        </div>
      </aside>

      {/* TopNavBar */}
      <header className="fixed top-0 right-0 left-72 h-20 bg-[#f7f9fb] dark:bg-slate-950 flex justify-between items-center px-12 z-40">
        <div className="flex items-center gap-8">
          <span className="text-xl font-black text-[#191c1e] dark:text-white font-headline">
            {t("admin.topbar.title")}
          </span>
          <div className="relative group">
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant"
              data-icon="search"
            >
              search
            </span>
            <input
              className="pl-12 pr-4 py-2 bg-surface-container-highest rounded-full w-80 text-sm focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-surface-tint/20 transition-all"
              placeholder={t("admin.search.systemSettings")}
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-[#434654] dark:text-slate-400 hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined" data-icon="notifications">
              notifications
            </span>
          </button>
          <button className="text-[#434654] dark:text-slate-400 hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined" data-icon="chat_bubble">
              chat_bubble
            </span>
          </button>
          <button className="text-[#434654] dark:text-slate-400 hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined" data-icon="apps">
              apps
            </span>
          </button>
          <LanguageToggleButton className="material-symbols-outlined rounded-full p-2 transition-colors hover:bg-surface-container" />
          <div className="h-8 w-px bg-outline-variant/30"></div>
          <Link href="/admin/profile" aria-label="Open profile settings">
            <img
              alt="Administrator Profile"
              className="w-10 h-10 rounded-full border-2 border-primary-container/20"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhfbnMB4IN3pVz6nxXKRL04U6Lds0baHkdt6XphEGauXzc5tiDzogiRg8__75C-vxJu71Tb67r-74smQi4B0Gpx_zGxS4q_69xvu-wpjuJbcLkTRbzJFh_rWFOEtsJIZYWvSYPupsFlFDfONb4Cv6uAHSfTHoDASAkhum3Z33Plc7VHYzT1TS_crLxAe9yZfF95vuePyjGLSFY38mBvkOcNGq7WUWfTIdSwL35V1ni6DOt8VgWsx8kLGWeHj4onqNYqDE11WiftjxC"
            />
          </Link>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="ml-72 pt-20 min-h-screen">
        <div className="max-w-6xl mx-auto px-12 py-16">
          {/* Page Header */}
          <div className="mb-16 flex justify-between items-end">
            <div>
              <h2 className="text-[3.5rem] font-headline font-extrabold text-on-surface leading-tight tracking-tighter mb-2">
                {t("common.settings")}
              </h2>
              <p className="text-on-surface-variant font-body text-lg">
              {t("admin.settings.subtitle")}
              </p>
            </div>
            <div className="flex gap-4">
              <AdminButton variant="surface" size="md">
              {t("admin.settings.discard")}
              </AdminButton>
              <AdminButton variant="gradient" size="md">
              {t("admin.settings.save")}
              </AdminButton>
            </div>
          </div>

          {/* Bento Grid Settings Layout */}
          <div className="grid grid-cols-12 gap-8">
            {/* Left Column: Primary Configs */}
            <div className="col-span-8 space-y-8">
              {/* AI Model Controls */}
              <section className="bg-surface-container-lowest p-8 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-tertiary-container/10 rounded-lg">
                    <span
                      className="material-symbols-outlined text-tertiary"
                      data-icon="bolt"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      bolt
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-headline">{t("admin.settings.aiCoreEngine")}</h3>
                    <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">
                      {t("admin.settings.modelParameters")}
                    </p>
                  </div>
                  <div className="ml-auto w-2 h-2 rounded-full bg-tertiary shadow-[0_0_0_0_rgba(86,0,190,0.4)]"></div>
                </div>

                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold mb-3 text-on-surface">
                        {t("admin.settings.temperature")}
                      </label>
                      <input
                        className="w-full h-2 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary"
                        type="range"
                      />
                      <div className="flex justify-between mt-2 text-[10px] font-bold text-on-surface-variant uppercase">
                        <span>{t("admin.settings.precise")}</span>
                        <span>{t("admin.settings.balanced")}</span>
                        <span>{t("admin.settings.creative")}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-3 text-on-surface">
                        {t("admin.settings.contextLength")}
                      </label>
                      <select className="w-full bg-surface-container-low border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-surface-tint/20">
                        <option>{t("admin.settings.contextOption.4k")}</option>
                        <option>{t("admin.settings.contextOption.8k")}</option>
                        <option>{t("admin.settings.contextOption.32k")}</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold mb-3 text-on-surface">
                        {t("admin.settings.responseVerbosity")}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button className="py-2 bg-primary text-white rounded-lg text-xs font-bold">
                          {t("admin.settings.verbosity.concise")}
                        </button>
                        <button className="py-2 bg-surface-container-low text-on-surface-variant rounded-lg text-xs font-bold hover:bg-surface-container">
                          {t("admin.settings.verbosity.standard")}
                        </button>
                        <button className="py-2 bg-surface-container-low text-on-surface-variant rounded-lg text-xs font-bold hover:bg-surface-container">
                          {t("admin.settings.verbosity.elaborate")}
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-tertiary-container/5 rounded-lg border border-tertiary/10">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-tertiary text-sm" data-icon="info">
                          info
                        </span>
                        <p className="text-[11px] text-tertiary leading-relaxed font-medium">
                          {t("admin.settings.temperatureHint")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* User Role Management */}
              <section className="bg-surface-container-lowest p-8 rounded-xl">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-bold font-headline">{t("admin.settings.accessControl")}</h3>
                    <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">
                      {t("admin.settings.rolesPermissions")}
                    </p>
                  </div>
                  <AdminButton variant="outline" size="sm" icon="person_add">
                    {t("admin.settings.addMember")}
                  </AdminButton>
                </div>

                <div className="space-y-4">
                  {members.map((m) => {
                    const pill = rolePill(m.role);
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-4 bg-surface rounded-xl hover:bg-white transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <img alt="User" className="w-10 h-10 rounded-full" src={m.avatarSrc} />
                          <div>
                            <p className="font-bold text-sm">{m.name}</p>
                            <p className="text-xs text-on-surface-variant">{m.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <span className={pill.className}>{t(pill.label)}</span>
                          <button className="p-2 opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-on-surface transition-all">
                            <span className="material-symbols-outlined" data-icon="more_vert">
                              more_vert
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Right Column: Secondary Configs */}
            <div className="col-span-4 space-y-8">
              {/* Language & Localization */}
              <section className="bg-surface-container-low p-8 rounded-xl border border-outline-variant/10">
                <div className="flex items-center gap-4 mb-6">
                  <span className="material-symbols-outlined text-primary" data-icon="language">
                    language
                  </span>
                  <h3 className="font-bold font-headline">{t("admin.settings.languageSupport")}</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🇺🇸</span>
                      <span className="text-sm font-bold">{t("admin.settings.language.englishEn")}</span>
                    </div>
                    <div className="w-10 h-5 bg-primary rounded-full relative">
                      <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/40 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🇻🇳</span>
                      <span className="text-sm font-bold">{t("admin.settings.language.vietnameseVn")}</span>
                    </div>
                    <div className="w-10 h-5 bg-surface-container-high rounded-full relative">
                      <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <p className="text-[11px] text-on-surface-variant px-1">
                    {t("admin.settings.multiLangBeta")}
                  </p>
                </div>
              </section>

              {/* Admin Profile Snippet */}
              <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/5">
                <h3 className="font-bold font-headline mb-6">{t("admin.settings.adminProfile")}</h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-2">
                      {t("admin.settings.adminProfile.displayName")}
                    </label>
                    <input
                      className="w-full bg-surface-container-low border-none rounded-lg p-3 text-sm focus:ring-1 focus:ring-primary/20"
                      type="text"
                      defaultValue="Julian D’Arcy"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-2">
                      {t("admin.settings.adminProfile.emailAddress")}
                    </label>
                    <input
                      className="w-full bg-surface-container-low border-none rounded-lg p-3 text-sm text-on-surface-variant italic cursor-not-allowed"
                      type="email"
                      readOnly
                      value="julian@thecurator.ai"
                    />
                  </div>
                  <div className="pt-4 flex items-center justify-between">
                    <span className="text-xs font-bold">{t("admin.settings.enable2fa")}</span>
                    <div className="w-10 h-5 bg-primary rounded-full relative">
                      <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              </section>

              {/* System Status Card */}
              <section className="bg-[rgba(112,41,225,0.05)] backdrop-blur-xl p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-tertiary" data-icon="monitoring">
                    monitoring
                  </span>
                  <span className="font-bold text-tertiary">{t("admin.settings.systemHealth")}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">{t("admin.settings.apiLatency")}</span>
                    <span className="font-bold">42ms</span>
                  </div>
                  <div className="w-full h-1 bg-tertiary-container/20 rounded-full overflow-hidden">
                    <div className="w-[85%] h-full bg-tertiary"></div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">{t("admin.settings.storage")}</span>
                    <span className="font-bold">12.4 / 50 GB</span>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Floating AI Analysis Prompt */}
          <div className="fixed bottom-12 right-12 flex items-center gap-4 bg-gradient-to-r from-tertiary to-primary p-1 pl-6 rounded-full shadow-2xl shadow-primary/30 text-white group cursor-pointer">
            <span className="text-sm font-bold">{t("admin.settings.optimizeWithAi")}</span>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-primary transition-all">
              <span className="material-symbols-outlined text-xl" data-icon="auto_awesome">
                auto_awesome
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Ambient backgrounds */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-tertiary/5 blur-[100px] rounded-full"></div>
      </div>
    </div>
  );
}

