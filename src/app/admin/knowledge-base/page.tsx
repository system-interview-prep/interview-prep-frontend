import Link from "next/link";
import AdminButton from "../../../../components/admin/AdminButton";
import AdminSidebarBrand from "../../../../components/admin/AdminSidebarBrand";
import { cookies } from "next/headers";
import { getDictionary, normalizeLang } from "../../../i18n/i18n";
import LanguageToggleButton from "../../../components/LanguageToggleButton";

type SourceStatus = "processed" | "analyzing" | "syncing";

type KnowledgeSource = {
  id: string;
  icon: string;
  iconClassName: string;
  title: string;
  subtitle: string;
  subtitleParams?: Record<string, string>;
  status: SourceStatus;
};

type RecentQa = {
  id: string;
  tag: string;
  tagClassName: string;
  question: string;
};

const sources: KnowledgeSource[] = [
  {
    id: "pdf-guidelines",
    icon: "picture_as_pdf",
    iconClassName: "text-red-500",
    title: "2024_Hiring_Guidelines.pdf",
    subtitle: "admin.knowledge.source.uploadedHoursAgo",
    subtitleParams: { count: "2", size: "14.2 MB", chunks: "42 Chunks" },
    status: "processed",
  },
  {
    id: "docx-arch",
    icon: "description",
    iconClassName: "text-blue-500",
    title: "Product_Architecture_V2.docx",
    subtitle: "admin.knowledge.source.uploadedMinsAgoProcessing",
    subtitleParams: { count: "5", size: "2.8 MB", status: "admin.knowledge.source.processing" },
    status: "analyzing",
  },
  {
    id: "notion-export",
    icon: "database",
    iconClassName: "text-amber-500",
    title: "Employee_Benefits_Portal_Export",
    subtitle: "admin.knowledge.source.syncingFromNotion",
    subtitleParams: { pages: "124", chunks: "1.2k Chunks" },
    status: "syncing",
  },
];

const recentQas: RecentQa[] = [
  {
    id: "culture",
    tag: "admin.knowledge.qaTag.companyCulture",
    tagClassName: "text-primary",
    question: "admin.knowledge.recentQa.culture",
  },
  {
    id: "stack",
    tag: "admin.knowledge.qaTag.technicalStack",
    tagClassName: "text-tertiary",
    question: "admin.knowledge.recentQa.stack",
  },
  {
    id: "security",
    tag: "admin.knowledge.qaTag.security",
    tagClassName: "text-amber-600",
    question: "admin.knowledge.recentQa.security",
  },
];

function statusBadge(status: SourceStatus, t: (key: string) => string) {
  if (status === "processed") {
    return (
      <span className="flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
        <span className="w-2 h-2 bg-green-500 rounded-full"></span> {t("admin.knowledge.status.processed")}
      </span>
    );
  }
  if (status === "analyzing") {
    return (
      <span className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/5 px-3 py-1 rounded-full">
        <span className="w-2 h-2 bg-tertiary rounded-full animate-pulse"></span>{" "}
        {t("admin.knowledge.status.analyzing")}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2 text-xs font-bold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
      {t("admin.knowledge.status.activeSync")}
    </span>
  );
}

export default async function AdminKnowledgeBasePage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;

  return (
    <div className="bg-surface font-body text-on-surface antialiased">
      {/* SideNavBar (Shared Component) */}
      <aside className="fixed left-0 top-0 z-50 flex h-dvh w-80 flex-col overflow-y-auto overscroll-contain bg-[#f2f4f6] font-headline antialiased tracking-tight dark:bg-slate-900 xl:w-96">
        <div className="flex flex-col h-full py-12 px-6">
          <AdminSidebarBrand />

          <nav className="flex-1 space-y-2">
            <Link
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 font-medium hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-colors duration-200"
              href="/admin/dashboard"
            >
              <span className="material-symbols-outlined" data-icon="dashboard">
                dashboard
              </span>
              <span>{t("common.dashboard")}</span>
            </Link>
            <Link
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 font-medium hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-colors duration-200"
              href="/admin/interviews"
            >
              <span className="material-symbols-outlined" data-icon="video_chat">
                video_chat
              </span>
              <span>{t("admin.interviews")}</span>
            </Link>
            <Link
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 font-medium hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-colors duration-200"
              href="/admin/insights"
            >
              <span className="material-symbols-outlined" data-icon="psychology">
                psychology
              </span>
              <span>{t("admin.aiInsights")}</span>
            </Link>
            <Link
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-[#003d9b] dark:text-blue-400 font-bold border-r-4 border-[#003d9b] dark:border-blue-400 bg-white/50 dark:bg-white/5"
              href="/admin/knowledge-base"
            >
              <span className="material-symbols-outlined" data-icon="library_books">
                library_books
              </span>
              <span>{t("admin.knowledgeBase")}</span>
            </Link>
            <Link
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 font-medium hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-colors duration-200"
              href="/admin/settings"
            >
              <span className="material-symbols-outlined" data-icon="settings">
                settings
              </span>
              <span>{t("common.settings")}</span>
            </Link>
          </nav>

          <div className="mt-auto space-y-2 pt-6 border-t border-outline-variant/20">
            <AdminButton
              variant="gradient"
              size="md"
              icon="auto_awesome"
              iconFill
              className="w-full mb-6"
            >
              {t("admin.settings.startAiAnalysis")}
            </AdminButton>
            <Link
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-on-surface-variant font-medium hover:bg-[#e0e3e5] transition-colors duration-200"
              href="/admin/help"
            >
              <span className="material-symbols-outlined" data-icon="help">
                help
              </span>
              <span>{t("common.helpCenter")}</span>
            </Link>
            <Link
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-on-surface-variant font-medium hover:bg-[#e0e3e5] transition-colors duration-200"
              href="/logout"
            >
              <span className="material-symbols-outlined" data-icon="logout">
                logout
              </span>
              <span>{t("common.logout")}</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="ml-80 min-h-screen flex flex-col bg-surface xl:ml-96">
        {/* TopNavBar (Shared Component) */}
        <header className="flex justify-between items-center h-20 px-12 sticky top-0 bg-[#f7f9fb] dark:bg-slate-950 z-40">
          <div className="flex items-center gap-8">
            <h2 className="text-xl font-black text-[#191c1e] dark:text-white font-headline">
              {t("admin.topbar.title")}
            </h2>
            <div className="relative group">
              <span
                className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg"
                data-icon="search"
              >
                search
              </span>
              <input
                className="bg-surface-container-highest border-none rounded-xl py-2 pl-12 pr-4 w-80 text-sm font-medium focus:ring-2 focus:ring-surface-tint focus:bg-white transition-all"
                placeholder={t("admin.search.knowledge")}
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-on-surface-variant">
              <button className="hover:opacity-80 transition-opacity">
                <span className="material-symbols-outlined" data-icon="notifications">
                  notifications
                </span>
              </button>
              <button className="hover:opacity-80 transition-opacity">
                <span className="material-symbols-outlined" data-icon="chat_bubble">
                  chat_bubble
                </span>
              </button>
              <button className="hover:opacity-80 transition-opacity">
                <span className="material-symbols-outlined" data-icon="apps">
                  apps
                </span>
              </button>
              <LanguageToggleButton className="material-symbols-outlined rounded-full p-2 transition-colors hover:bg-surface-container" />
            </div>
            <Link href="/admin/profile" aria-label="Open profile settings">
              <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-outline-variant/30">
                <img
                  alt="Administrator Profile"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2PaN3-0pU4S-qEkEvMq-k8OLUcC_FHxLyPcloSmcN31xwjvzJtFjKByuhHM1AGBo-y82OnD8GcbBKJdRyzHOQGDCNeQj9L8OwJhs6Jiu96vGtvSdPOFDFMngbsnXqSebPxq36xqFHgA9gNZLPm8MMk5titPOdWgL4giUiUc0t7KtrMJ5YFmwrKruBN5yHTt_b07szL4CrFLevJABdeiHkgrL87j70DioANLK3s7SVwJmNzX2qDB02_qTiZvjwIT_g03g-_OtbOLZF"
                />
              </div>
            </Link>
          </div>
        </header>

        {/* Page Canvas */}
        <main className="p-12 space-y-12">
          {/* Hero Header Section */}
          <section className="flex justify-between items-end">
            <div className="max-w-2xl">
              <h1 className="text-6xl font-extrabold font-headline tracking-tighter text-on-surface mb-4">
                {t("admin.knowledgeBase")}
              </h1>
              <p className="text-on-surface-variant text-lg leading-relaxed">
              {t("admin.knowledge.subtitle")}
              </p>
            </div>
            <div className="flex gap-4">
              <AdminButton variant="outline" size="md">
              {t("admin.knowledge.viewAuditLogs")}
              </AdminButton>
              <AdminButton variant="gradient" size="md" icon="bolt" iconFill>
              {t("admin.knowledge.retrainFoundation")}
              </AdminButton>
            </div>
          </section>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-12 gap-8">
            {/* File Upload & Sources (Left Column) */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
              {/* Upload Dropzone */}
              <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10 shadow-sm group">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold font-headline">{t("admin.knowledge.ingestDocuments")}</h3>
                  <span className="text-xs font-bold text-on-surface-variant px-3 py-1 bg-surface-container rounded-full">
                    PDF, TXT, DOCX
                  </span>
                </div>
                <div className="border-2 border-dashed border-outline-variant/40 rounded-xl p-12 flex flex-col items-center justify-center bg-surface-container-low/50 group-hover:bg-surface-container-low transition-colors cursor-pointer">
                  <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-primary text-3xl" data-icon="cloud_upload">
                      cloud_upload
                    </span>
                  </div>
                  <p className="text-on-surface font-semibold mb-1">
                    {t("admin.knowledge.dragDrop")}
                  </p>
                  <p className="text-on-surface-variant text-sm">
                    {t("admin.knowledge.maxPerFile")}
                  </p>
                </div>
              </div>

              {/* Source List */}
              <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold font-headline text-on-surface">
                    {t("admin.knowledge.sources")}
                  </h3>
                  <div className="flex gap-2">
                    <button className="text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary">
                      All
                    </button>
                    <button className="text-xs font-bold uppercase tracking-widest text-primary">
                      Active
                    </button>
                    <button className="text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary">
                      Syncing
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {sources.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center p-4 bg-surface-container-low/30 rounded-xl hover:bg-surface-container transition-colors group"
                    >
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-outline-variant/10 mr-4">
                        <span className={`material-symbols-outlined ${s.iconClassName}`} data-icon={s.icon}>
                          {s.icon}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-on-surface">{s.title}</h4>
                        <p className="text-xs text-on-surface-variant">
                          {Object.entries(s.subtitleParams ?? {}).reduce((acc, [k, v]) => {
                            const value = v.startsWith("admin.") ? t(v) : v;
                            return acc.replace(`{${k}}`, value);
                          }, t(s.subtitle))}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 px-4">{statusBadge(s.status, t)}</div>
                      <button className="opacity-0 group-hover:opacity-100 p-2 text-on-surface-variant hover:text-primary transition-all">
                        <span className="material-symbols-outlined" data-icon="more_vert">
                          more_vert
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* QA Refinement & Statistics (Right Column) */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
              {/* Manual QA Editor */}
              <div className="bg-surface-container-highest rounded-xl p-8 border border-outline-variant/10 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold font-headline text-on-surface">
                    {t("admin.knowledge.overrideQa")}
                  </h3>
                  <span className="material-symbols-outlined text-primary" data-icon="edit_note">
                    edit_note
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                  {t("admin.knowledge.overrideQaDesc")}
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      {t("admin.knowledge.promptQuestion")}
                    </label>
                    <textarea
                      className="w-full bg-surface-container-lowest border-none rounded-lg text-sm focus:ring-2 focus:ring-surface-tint p-4"
                      placeholder={t("admin.knowledge.promptPlaceholder")}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      {t("admin.knowledge.modelAnswer")}
                    </label>
                    <textarea
                      className="w-full bg-surface-container-lowest border-none rounded-lg text-sm focus:ring-2 focus:ring-surface-tint p-4"
                      placeholder={t("admin.knowledge.answerPlaceholder")}
                      rows={4}
                    />
                  </div>
                  <AdminButton variant="primary" size="lg" className="w-full" type="submit">
                  {t("admin.knowledge.savePair")}
                  </AdminButton>
                </div>
              </div>

              {/* Health & Stats Card */}
              <div className="bg-primary rounded-xl p-8 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold font-headline mb-6 opacity-90">
                    {t("admin.knowledge.health.ragEcosystemHealth")}
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">{t("admin.knowledge.health.contextPrecision")}</span>
                        <span className="font-bold">94%</span>
                      </div>
                      <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-[94%]"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">{t("admin.knowledge.health.totalTokensIngested")}</span>
                        <span className="font-bold">1.2M</span>
                      </div>
                      <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-[60%]"></div>
                      </div>
                    </div>
                    <div className="pt-4 flex items-center gap-4">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full border-2 border-primary bg-surface-container-low flex items-center justify-center text-[10px] font-bold text-primary">
                          JD
                        </div>
                        <div className="w-8 h-8 rounded-full border-2 border-primary bg-surface-container-low flex items-center justify-center text-[10px] font-bold text-primary">
                          AK
                        </div>
                      </div>
                      <p className="text-[10px] font-medium opacity-80 uppercase tracking-widest leading-tight">
                        {t("admin.knowledge.health.lastUpdatedByCurators")
                          .replace("{count}", "2")
                          .replace("{time}", "14:00")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute top-4 right-4 opacity-30">
                  <span className="material-symbols-outlined text-4xl" data-icon="query_stats">
                    query_stats
                  </span>
                </div>
              </div>

              {/* Searchable Q&A List */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden">
                <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
                  <h4 className="font-bold">{t("admin.knowledge.recentQaPairs")}</h4>
                  <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors" data-icon="search">
                    search
                  </span>
                </div>
                <div className="divide-y divide-outline-variant/10">
                  {recentQas.map((qa) => (
                    <div
                      key={qa.id}
                      className="p-4 hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      <p className={`text-xs font-bold mb-1 ${qa.tagClassName}`}>
                        {t(qa.tag)}
                      </p>
                      <p className="text-sm font-semibold truncate">{t(qa.question)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating Mic Tray */}
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-surface-container-lowest/80 backdrop-blur-xl px-8 py-4 rounded-full border border-outline-variant/20 shadow-2xl z-50">
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined" data-icon="mic">
                mic
              </span>
            </button>
            <div className="h-6 w-px bg-outline-variant/30"></div>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined" data-icon="video_call">
                video_call
              </span>
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined" data-icon="screen_share">
                screen_share
              </span>
            </button>
            <button className="w-12 h-12 rounded-full flex items-center justify-center bg-error text-white shadow-lg shadow-error/20 hover:bg-red-700 transition-colors">
              <span className="material-symbols-outlined" data-icon="call_end">
                call_end
              </span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

