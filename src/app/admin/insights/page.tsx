import Link from "next/link";
import AdminButton from "../../../../components/admin/AdminButton";
import AdminSidebarBrand from "../../../../components/admin/AdminSidebarBrand";
import { cookies } from "next/headers";
import { getDictionary, normalizeLang } from "../../../i18n/i18n";
import LanguageToggleButton from "../../../components/LanguageToggleButton";

type CohortStatus = "optimized" | "monitored";

type CohortRow = {
  id: string;
  badgeAlt: string;
  badgeSrc: string;
  name: string;
  engagement: string;
  avgScore: string;
  growth: string;
  status: CohortStatus;
};

const cohorts: CohortRow[] = [
  {
    id: "stanford",
    badgeAlt: "University Badge",
    badgeSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAVe--S6ZLAXt4VIwU9P-WE_zuLlZHnYHhBl5mjNlL7oKLnv2O0YWywIMhfeXDvgG8N7iSOh6kZbQkYFXY0ShYuq11R1rrFiKFprAb3KZT7SAodU4azs5NXIOfk6XEFNI0tSR3Fa8M4oL9xeTouqc6OoJqftvBcRsxGbCuXkEeeFZhFxuWNqQSm3juy-VQJr7YSZDci_tAtUCJonG7P6HMsHNKDFZvWTPlqLrMUzZbTuxB22xcWnvLmOpI07hEcHoLwHrgBhGpy21En",
    name: "admin.insights.cohort.stanfordAlum",
    engagement: "admin.insights.engagement.highIntensity",
    avgScore: "9.2",
    growth: "+4.2%",
    status: "optimized",
  },
  {
    id: "fortune",
    badgeAlt: "Corporate Badge",
    badgeSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCMlJ7uc_gaEkav3glwrxtw_AJutmyA975ekqwR0gu1jBt4f0PncDNLz62AZNvpIpJO6c9wbuFnZ16NKOyXWa1yaVmtPJTd3wnMtZdUyzHz1lnyyFAREnozoJo1Mm-OI0SQgyg3matBjvf8uaNUfCh0auVIU3plqyuixtQVQHe0tuVQOGy3pYIaX7CPBaXHpkuWtpg6gUkknMfBpORcVa8jGBrSNexiUVMt0rv8AEJvgpAGKA9m59gl3sYwA9zZRmlPbudXyQgD_lVX",
    name: "admin.insights.cohort.fortune500Entry",
    engagement: "admin.insights.engagement.steadyGrowth",
    avgScore: "8.7",
    growth: "+2.8%",
    status: "monitored",
  },
  {
    id: "stem",
    badgeAlt: "Tech Badge",
    badgeSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuACgcZrTxiScj7J-i2Teyg1X48ONmaPp0f1KpKgizYzaA9WzUdMalaXtvWUeOlnBqVULYfOjvogS_Ue8Us3EShVWck2iex38AKyP8ToS5_h0K7e1UXFZtbitNlk3My_6tFi7rYhReFesB3Th0tN-mrZeAJlvFYBSqmKst8lDDxcu3ehkOISd1O-jj-0RiJOAKjuB7ODovf9oAxpyQDbMvBALvcgj5bE5TEAhGMjo0kLQVn5Wyfrya8_HRVTGUo30-K42oUrzrwlV9mz",
    name: "admin.insights.cohort.stemInnovators",
    engagement: "admin.insights.engagement.peakPotential",
    avgScore: "9.5",
    growth: "+6.1%",
    status: "optimized",
  },
];

function statusPill(status: CohortStatus) {
  if (status === "optimized") {
    return {
      className: "px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold",
      label: "admin.insights.status.optimized",
    };
  }
  return {
    className: "px-3 py-1 bg-tertiary/10 text-tertiary rounded-full text-xs font-bold",
    label: "admin.insights.status.monitored",
  };
}

export default async function AdminInsightsPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;

  return (
    <div className="bg-surface font-body text-on-surface antialiased">
      {/* SideNavBar (Shared Component) */}
      <aside className="h-screen w-72 flex-col fixed left-0 top-0 bg-[#f2f4f6] dark:bg-slate-900 font-headline antialiased tracking-tight z-50">
        <div className="flex flex-col h-full py-12 px-6">
          <AdminSidebarBrand />

          <nav className="flex-1 space-y-2">
            <Link
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 font-medium hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-colors duration-200"
              href="/admin/dashboard"
            >
              <span className="material-symbols-outlined" data-icon="dashboard">
                dashboard
              </span>
              <span>{t("common.dashboard")}</span>
            </Link>
            <Link
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 font-medium hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-colors duration-200"
              href="/admin/interviews"
            >
              <span className="material-symbols-outlined" data-icon="video_chat">
                video_chat
              </span>
              <span>{t("admin.interviews")}</span>
            </Link>
            <Link
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#003d9b] dark:text-blue-400 font-bold border-r-4 border-[#003d9b] dark:border-blue-400 bg-white/50 dark:bg-white/5"
              href="/admin/insights"
            >
              <span
                className="material-symbols-outlined"
                data-icon="psychology"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                psychology
              </span>
              <span>{t("admin.aiInsights")}</span>
            </Link>
            <Link
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 font-medium hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-colors duration-200"
              href="/admin/knowledge-base"
            >
              <span className="material-symbols-outlined" data-icon="library_books">
                library_books
              </span>
              <span>{t("admin.knowledgeBase")}</span>
            </Link>
            <Link
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 font-medium hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-colors duration-200"
              href="/admin/settings"
            >
              <span className="material-symbols-outlined" data-icon="settings">
                settings
              </span>
              <span>{t("common.settings")}</span>
            </Link>
          </nav>

          <div className="mt-auto pt-8 border-t border-outline-variant/20 space-y-2">
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
              className="flex items-center gap-3 px-4 py-2 text-[#434654] dark:text-slate-400 font-medium hover:text-[#191c1e] transition-colors"
              href="/admin/help"
            >
              <span className="material-symbols-outlined" data-icon="help">
                help
              </span>
              <span>{t("common.helpCenter")}</span>
            </Link>
            <Link
              className="flex items-center gap-3 px-4 py-2 text-[#434654] dark:text-slate-400 font-medium hover:text-[#191c1e] transition-colors"
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
      <main className="ml-72 min-h-screen bg-surface">
        {/* TopNavBar (Shared Component) */}
        <header className="flex justify-between items-center h-20 px-12 sticky top-0 bg-[#f7f9fb] dark:bg-slate-950 z-40">
          <div className="flex items-center gap-8">
            <span className="text-xl font-black text-[#191c1e] dark:text-white font-headline">
              {t("admin.topbar.title")}
            </span>
            <div className="relative group">
              <span
                className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline"
                data-icon="search"
              >
                search
              </span>
              <input
                className="pl-12 pr-6 py-2 bg-surface-container-highest border-none rounded-full text-sm focus:ring-2 focus:ring-surface-tint/20 w-64 transition-all"
                placeholder={t("admin.search.insights")}
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-on-surface-variant">
              <button className="hover:opacity-80 transition-opacity p-2 rounded-full hover:bg-surface-container">
                <span className="material-symbols-outlined" data-icon="notifications">
                  notifications
                </span>
              </button>
              <button className="hover:opacity-80 transition-opacity p-2 rounded-full hover:bg-surface-container">
                <span className="material-symbols-outlined" data-icon="chat_bubble">
                  chat_bubble
                </span>
              </button>
              <button className="hover:opacity-80 transition-opacity p-2 rounded-full hover:bg-surface-container">
                <span className="material-symbols-outlined" data-icon="apps">
                  apps
                </span>
              </button>
              <LanguageToggleButton className="material-symbols-outlined rounded-full p-2 transition-colors hover:bg-surface-container" />
            </div>

            <div className="h-8 w-px bg-outline-variant/30 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">{t("admin.insights.adminUser")}</p>
                <p className="text-[10px] text-on-surface-variant font-medium">
                  {t("admin.role.systemManager")}
                </p>
              </div>
              <Link href="/admin/profile" aria-label="Open profile settings">
                <img
                  alt="Administrator Profile"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/10"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCc7O-otnKLZ00EcgJastfk3OHwqkXWvZK6RUAsSkiyXuEITL1nQ0BwyUauTKhbtb30XQGhuvxlVlJcnGECbe7xsxhRqcdF8Wm3Qq7GZKB4dVmZBk0oD-bgcfOBhIZio8auTN_C50QkvDag32vO0JKtJ6gfhE98Zpn6ipZteh5dXMt6HMrMKF3_hEPRXcTgF-WgBI4lPnpWJwyvnfJ-wRcEteMaTcs4MdD1GqAB88DQQNeMIHXMgS9ErRzhcylBLX6HbIUQmBdFim0D"
                />
              </Link>
            </div>
          </div>
        </header>

        {/* Insights Page Content */}
        <section className="p-12 space-y-12">
          {/* Hero Header */}
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-[3.5rem] font-headline font-extrabold tracking-tighter text-on-surface leading-none mb-4">
                {t("admin.insights.systemPerformanceTitle")}
              </h1>
              <p className="text-on-surface-variant text-lg max-w-2xl font-light">
                {t("admin.insights.systemPerformanceSubtitle")}
              </p>
            </div>
            <div className="flex gap-4 mb-2">
              <div className="bg-surface-container-low px-6 py-3 rounded-xl border border-outline-variant/20 flex items-center gap-3">
                <div className="w-2 h-2 bg-tertiary rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold">{t("admin.insights.aiEngineActive")}</span>
              </div>
            </div>
          </div>

          {/* Bento Grid Metrics */}
          <div className="grid grid-cols-12 gap-6">
            {/* Main Trend Card */}
            <div className="col-span-8 bg-surface-container-lowest rounded-xl p-8 shadow-[0_10px_50px_rgba(25,28,30,0.04)] relative overflow-hidden group">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-xl font-headline font-bold mb-1">
                    {t("admin.insights.averageCandidateScore")}
                  </h3>
                  <p className="text-sm text-on-surface-variant">
                    {t("admin.insights.yoyPerformanceGrowth")}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-primary font-bold">
                  <span className="material-symbols-outlined" data-icon="trending_up">
                    trending_up
                  </span>
                  <span>+12.4%</span>
                </div>
              </div>

              {/* Simulated Line Chart */}
              <div className="h-64 flex items-end justify-between gap-2 relative">
                <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-20">
                  <div className="border-t border-outline-variant"></div>
                  <div className="border-t border-outline-variant"></div>
                  <div className="border-t border-outline-variant"></div>
                  <div className="border-t border-outline-variant"></div>
                </div>

                <div className="w-full h-32 bg-primary/10 rounded-t-lg relative group-hover:bg-primary/20 transition-colors"></div>
                <div className="w-full h-40 bg-primary/10 rounded-t-lg relative group-hover:bg-primary/20 transition-colors"></div>
                <div className="w-full h-48 bg-primary/10 rounded-t-lg relative group-hover:bg-primary/20 transition-colors"></div>
                <div className="w-full h-36 bg-primary/10 rounded-t-lg relative group-hover:bg-primary/20 transition-colors"></div>
                <div className="w-full h-56 bg-primary/20 rounded-t-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-tertiary opacity-50"></div>
                </div>
                <div className="w-full h-64 bg-primary rounded-t-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-tertiary"></div>
                </div>
              </div>
            </div>

            {/* Sentiment Snapshot */}
            <div className="col-span-4 bg-tertiary-container rounded-xl p-8 text-white flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-4xl" data-icon="auto_awesome">
                  auto_awesome
                </span>
                <div className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest">
                  {t("admin.insights.sentiment.title")}
                </div>
              </div>
              <div>
                <div className="text-5xl font-extrabold tracking-tighter mb-2">
                  92%
                </div>
                <p className="text-on-tertiary-container font-medium">
                  {t("admin.insights.sentiment.desc")}
                </p>
              </div>
              <div className="mt-6 flex gap-1">
                <div className="h-1 flex-1 bg-white rounded-full"></div>
                <div className="h-1 flex-1 bg-white/40 rounded-full"></div>
                <div className="h-1 flex-1 bg-white/40 rounded-full"></div>
              </div>
            </div>

            {/* Comparison Bar Chart */}
            <div className="col-span-5 bg-surface-container-lowest rounded-xl p-8 shadow-[0_10px_50px_rgba(25,28,30,0.04)]">
              <h3 className="text-xl font-headline font-bold mb-6">
                {t("admin.insights.demographicCompetency")}
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold">{t("admin.insights.demographic.professionals")}</span>
                    <span className="text-sm font-bold">8.4/10</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full w-[84%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold">{t("admin.insights.demographic.postGrad")}</span>
                    <span className="text-sm font-bold">7.2/10</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full opacity-60 w-[72%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold">{t("admin.insights.demographic.undergrad")}</span>
                    <span className="text-sm font-bold">6.1/10</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full opacity-30 w-[61%]"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Focus Areas */}
            <div className="col-span-7 bg-surface-container-low rounded-xl p-8 flex flex-col justify-center">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <span
                        className="material-symbols-outlined"
                        data-icon="psychology_alt"
                      >
                        psychology_alt
                      </span>
                    </div>
                    <h4 className="font-bold">{t("admin.insights.focus.criticalReasoning")}</h4>
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    {t("admin.insights.focus.criticalReasoning.desc")}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined" data-icon="forum">
                        forum
                      </span>
                    </div>
                    <h4 className="font-bold">{t("admin.insights.focus.communicationTone")}</h4>
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    {t("admin.insights.focus.communicationTone.desc")}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error">
                      <span className="material-symbols-outlined" data-icon="timer">
                        timer
                      </span>
                    </div>
                    <h4 className="font-bold">{t("admin.insights.focus.responseLatency")}</h4>
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    {t("admin.insights.focus.responseLatency.desc")}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-on-secondary-container/10 flex items-center justify-center text-on-secondary-container">
                      <span className="material-symbols-outlined" data-icon="verified">
                        verified
                      </span>
                    </div>
                    <h4 className="font-bold">{t("admin.insights.focus.ethicalAlignment")}</h4>
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    {t("admin.insights.focus.ethicalAlignment.desc")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Analysis Table */}
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_10px_50px_rgba(25,28,30,0.04)]">
            <div className="px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center">
              <h3 className="text-xl font-headline font-bold">
                {t("admin.insights.cohorts.title")}
              </h3>
              <button className="text-sm font-bold text-primary flex items-center gap-1 hover:opacity-70">
                {t("admin.insights.cohorts.viewFull")}
                <span className="material-symbols-outlined text-sm" data-icon="chevron_right">
                  chevron_right
                </span>
              </button>
            </div>

            <div className="w-full">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="text-left px-8 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      {t("admin.insights.table.cohortType")}
                    </th>
                    <th className="text-left px-8 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      {t("admin.insights.table.engagement")}
                    </th>
                    <th className="text-left px-8 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      {t("admin.insights.table.avgScore")}
                    </th>
                    <th className="text-left px-8 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      {t("admin.insights.table.growth")}
                    </th>
                    <th className="text-right px-8 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      {t("admin.insights.table.status")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {cohorts.map((row) => {
                    const pill = statusPill(row.status);
                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-surface-container-low transition-colors group"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <img
                              alt={row.badgeAlt}
                              className="w-8 h-8 rounded-lg object-cover"
                              src={row.badgeSrc}
                            />
                            <span className="font-bold">{t(row.name)}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm">{t(row.engagement)}</td>
                        <td className="px-8 py-5 font-headline font-bold">
                          {row.avgScore}
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-primary font-semibold text-sm">
                            {row.growth}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className={pill.className}>{t(pill.label)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="h-20"></div>
        </section>
      </main>
    </div>
  );
}

