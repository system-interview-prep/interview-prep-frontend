import Link from "next/link";
import AdminButton from "../../../../components/admin/AdminButton";
import AdminSidebarBrand from "../../../../components/admin/AdminSidebarBrand";
import { cookies } from "next/headers";
import { getDictionary, normalizeLang } from "../../../i18n/i18n";

type Category = {
  id: string;
  icon: string;
  iconFill?: boolean;
  iconWrapClass: string;
  iconClass: string;
  title: string;
  description: string;
};

type Article = {
  id: string;
  icon: string;
  iconClass: string;
  title: string;
};

type SystemStatus = {
  id: string;
  label: string;
  status: "operational" | "degraded";
};

const categories: Category[] = [
  {
    id: "getting-started",
    icon: "rocket_launch",
    iconWrapClass: "bg-primary-fixed text-primary",
    iconClass: "text-3xl",
    title: "admin.help.category.gettingStarted.title",
    description: "admin.help.category.gettingStarted.desc",
  },
  {
    id: "rag-training",
    icon: "psychology",
    iconFill: true,
    iconWrapClass: "bg-tertiary-fixed text-tertiary",
    iconClass: "text-3xl",
    title: "admin.help.category.ragTraining.title",
    description: "admin.help.category.ragTraining.desc",
  },
  {
    id: "user-session",
    icon: "manage_accounts",
    iconWrapClass: "bg-secondary-fixed text-secondary",
    iconClass: "text-3xl",
    title: "admin.help.category.userSession.title",
    description: "admin.help.category.userSession.desc",
  },
  {
    id: "billing",
    icon: "payments",
    iconWrapClass: "bg-surface-container-high text-on-surface-variant",
    iconClass: "text-3xl",
    title: "admin.help.category.billing.title",
    description: "admin.help.category.billing.desc",
  },
];

const articles: Article[] = [
  {
    id: "rag-datasets",
    icon: "article",
    iconClass: "text-tertiary",
    title: "admin.help.article.ragDatasets",
  },
  {
    id: "latency",
    icon: "speed",
    iconClass: "text-error",
    title: "admin.help.article.latency",
  },
  {
    id: "export-pdf",
    icon: "picture_as_pdf",
    iconClass: "text-primary",
    title: "admin.help.article.exportPdf",
  },
];

const statuses: SystemStatus[] = [
  { id: "ai-core", label: "admin.help.system.aiCoreEngine", status: "operational" },
  { id: "api", label: "admin.help.system.apiServices", status: "operational" },
  { id: "indexing", label: "admin.help.system.indexingPipeline", status: "degraded" },
];

export default async function AdminHelpPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;

  return (
    <div className="bg-surface font-body text-on-surface">
      {/* SideNavBar (keep consistent with other admin pages) */}
      <aside className="fixed left-0 top-0 z-50 flex h-dvh w-80 flex-col overflow-y-auto overscroll-contain bg-[#f2f4f6] px-6 py-12 font-headline antialiased tracking-tight dark:bg-slate-900 xl:w-96">
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
            className="flex items-center gap-3 py-3 px-4 rounded-lg text-[#434654] dark:text-slate-400 font-medium hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-colors duration-200"
            href="/admin/settings"
          >
            <span className="material-symbols-outlined" data-icon="settings">
              settings
            </span>
            <span>{t("common.settings")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 py-3 px-4 rounded-lg text-[#003d9b] dark:text-blue-400 font-bold border-r-4 border-[#003d9b] dark:border-blue-400 bg-white/50 dark:bg-white/5"
            href="/admin/help"
          >
            <span className="material-symbols-outlined" data-icon="contact_support">
              contact_support
            </span>
            <span>{t("common.helpCenter")}</span>
          </Link>
        </nav>

        <AdminButton variant="primary" size="md" className="w-full" icon="support_agent" iconFill>
          Contact Support
        </AdminButton>
      </aside>

      {/* Main Stage */}
      <main className="ml-80 min-h-screen xl:ml-96">
        {/* TopNavBar */}
        <header className="flex justify-between items-center w-full px-12 h-20 bg-[#f7f9fb] dark:bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-8">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-outline text-lg">
                search
              </span>
              <input
                className="bg-surface-container-highest border-none rounded-xl py-2 pl-12 pr-4 w-80 text-sm font-medium focus:ring-2 focus:ring-surface-tint focus:bg-white transition-all"
              placeholder={t("admin.help.globalSearch")}
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="text-[#434654] hover:text-[#003d9b] transition-all p-2 rounded-full hover:bg-surface-container">
              <span className="material-symbols-outlined">help</span>
            </button>
            <button className="text-[#434654] hover:text-[#003d9b] relative transition-all p-2 rounded-full hover:bg-surface-container">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-error rounded-full"></span>
            </button>
            <Link href="/admin/profile" aria-label="Open profile settings">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/30">
                <img
                  alt="Admin profile"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbJrPii_btQJEkM5apVnsXH-n14hOer6pWX0aLcYrYx0WZQhqYi0aYxXDmgtf5dUX_gUiaEbBHX-1emsYmZlXjxdBsNQTkpHk-wpO324O8zBDAj3shPd1LmhhFvTNSbF1JrNQqFP0K53QivsKLJqcDYk_wW6ug774m370ogioZNIDY979fFAkm7zmr_trs426UXAoWoBbUtoOXF9406FZ_4GM9E83dUlj7XvG9Vc3r6MK6tcQQ9VJYrsuOV1xv8dTDVRI_lA4OXAtn"
                />
              </div>
            </Link>
          </div>
        </header>

        {/* Content Canvas */}
        <div className="px-12 py-12 space-y-12 max-w-7xl mx-auto">
          {/* Hero Search Section */}
          <section className="relative overflow-hidden rounded-[2rem] p-12 bg-gradient-to-r from-primary to-tertiary text-white shadow-2xl flex flex-col items-center text-center">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            <h2 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight mb-4">
              {t("admin.help.heroTitle")}
            </h2>
            <p className="text-on-primary-container/80 text-lg mb-10 max-w-2xl font-body">
              {t("admin.help.heroSubtitle")}
            </p>
            <div className="w-full max-w-3xl relative">
              <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-primary text-2xl">
                search
              </span>
              <input
                className="w-full py-6 pl-16 pr-36 rounded-2xl border-none text-on-surface text-lg shadow-xl focus:ring-4 focus:ring-tertiary-container/30"
                placeholder={t("admin.help.searchExample")}
                type="text"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <AdminButton variant="primary" size="md">
                  {t("admin.help.searchCta")}
                </AdminButton>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-12 gap-8">
            {/* Left column */}
            <div className="col-span-12 lg:col-span-8 space-y-12">
              {/* Support Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all group cursor-pointer"
                  >
                    <div
                      className={`w-14 h-14 rounded-lg ${c.iconWrapClass} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                    >
                      <span
                        className={`material-symbols-outlined ${c.iconClass}`}
                        style={
                          c.iconFill ? { fontVariationSettings: "'FILL' 1" } : undefined
                        }
                      >
                        {c.icon}
                      </span>
                    </div>
                    <h3 className="text-xl font-headline font-bold text-on-surface mb-2">
                      {t(c.title)}
                    </h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed">
                      {t(c.description)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Featured Articles */}
              <div className="bg-surface-container rounded-xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-headline font-extrabold tracking-tight">
                    {t("admin.help.commonQuestions")}
                  </h3>
                  <button className="text-primary font-bold text-sm hover:underline">
                    {t("admin.help.viewAllArticles")}
                  </button>
                </div>
                <div className="space-y-4">
                  {articles.map((a) => (
                    <div
                      key={a.id}
                      className="bg-surface-container-lowest p-5 rounded-lg flex items-center justify-between hover:bg-surface-bright transition-colors cursor-pointer shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <span className={`material-symbols-outlined ${a.iconClass}`}>
                          {a.icon}
                        </span>
                        <span className="font-medium text-on-surface">{t(a.title)}</span>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant opacity-40">
                        chevron_right
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column */}
            <aside className="col-span-12 lg:col-span-4 space-y-8">
              {/* System Status */}
              <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/20">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">
                  {t("admin.help.systemStatus")}
                </h4>
                <div className="space-y-4">
                  {statuses.map((s) => {
                    const ok = s.status === "operational";
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center justify-between ${ok ? "" : "opacity-70"}`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              ok ? "bg-green-500 animate-pulse" : "bg-orange-400"
                            }`}
                          ></span>
                          <span className="text-sm font-medium">{t(s.label)}</span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            ok
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {ok ? t("admin.help.status.operational") : t("admin.help.status.degraded")}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 pt-4 border-t border-outline-variant/30 text-center">
                  <p className="text-[11px] text-on-surface-variant">
                    {t("admin.help.lastChecked")}
                  </p>
                </div>
              </div>

              {/* Direct Support */}
              <div className="bg-primary text-white rounded-xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <span
                    className="material-symbols-outlined text-[120px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    support_agent
                  </span>
                </div>
                <h4 className="text-xl font-headline font-extrabold mb-6 relative z-10">
                  {t("admin.help.directSupport")}
                </h4>
                <div className="space-y-4 relative z-10">
                  <button className="w-full flex items-center gap-4 p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all active:scale-95">
                    <span className="material-symbols-outlined">forum</span>
                    <div className="text-left">
                      <p className="text-sm font-bold">{t("admin.help.liveChatSupport")}</p>
                      <p className="text-[10px] opacity-70">{t("admin.help.avgWait")}</p>
                    </div>
                  </button>
                  <button className="w-full flex items-center gap-4 p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all active:scale-95">
                    <span className="material-symbols-outlined">mail</span>
                    <div className="text-left">
                      <p className="text-sm font-bold">{t("admin.help.emailSupport")}</p>
                      <p className="text-[10px] opacity-70">[EMAIL_ADDRESS]</p>
                    </div>
                  </button>
                  <button className="w-full flex items-center gap-4 p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all active:scale-95">
                    <span className="material-symbols-outlined">groups</span>
                    <div className="text-left">
                      <p className="text-sm font-bold">{t("admin.help.communityForum")}</p>
                      <p className="text-[10px] opacity-70">
                        {t("admin.help.activeMembers")}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* AI Assistant */}
              <div className="rounded-xl border-2 border-dashed border-tertiary/30 p-6 bg-tertiary-fixed/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded bg-gradient-to-r from-primary to-tertiary flex items-center justify-center text-white scale-75">
                    <span
                      className="material-symbols-outlined text-lg"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      auto_awesome
                    </span>
                  </div>
                  <span className="text-xs font-bold text-tertiary uppercase tracking-widest">
                    {t("admin.help.aiConcierge")}
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant font-medium mb-4">
                  {t("admin.help.aiConciergeQuote")}
                </p>
                <button className="text-tertiary font-bold text-xs flex items-center gap-2 hover:translate-x-1 transition-transform">
                  {t("admin.help.startAiChat")}
                </button>
              </div>
            </aside>
          </div>

          <div className="flex items-center justify-center py-12">
            <p className="text-on-surface-variant/60 text-sm italic font-body">
              {t("admin.help.footerDoc").replace("{version}", "v2.4.0").replace("{date}", "Oct 2023")}
            </p>
          </div>
        </div>

        {/* Glass Mic-Tray */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/85 backdrop-blur-xl border border-outline-variant/20 px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl z-50">
          <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors px-2">
            <span className="material-symbols-outlined">mic</span>
            <span className="text-xs font-bold uppercase tracking-tighter">
              {t("admin.help.micTray.askVoice")}
            </span>
          </button>
          <div className="h-4 w-[1px] bg-outline-variant/50"></div>
          <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors px-2">
            <span className="material-symbols-outlined">description</span>
            <span className="text-xs font-bold uppercase tracking-tighter">
              {t("admin.help.micTray.docs")}
            </span>
          </button>
          <div className="h-4 w-[1px] bg-outline-variant/50"></div>
          <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors px-2">
            <span className="material-symbols-outlined">feedback</span>
            <span className="text-xs font-bold uppercase tracking-tighter">
              {t("admin.help.micTray.feedback")}
            </span>
          </button>
        </div>
      </main>
    </div>
  );
}

