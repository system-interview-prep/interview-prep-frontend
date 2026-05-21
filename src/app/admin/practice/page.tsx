import Link from "next/link";
import AdminButton from "../../../../components/admin/AdminButton";
import AdminSidebarBrand from "../../../../components/admin/AdminSidebarBrand";
import { cookies } from "next/headers";
import { getDictionary, normalizeLang } from "../../../i18n/i18n";

type QuestionCategory = {
  id: string;
  label: string;
  labelClassName: string;
  title: string;
  subtitle: string;
  arrowHoverClassName: string;
};

type ScenarioStatus = "active" | "in_review";

type ScenarioRow = {
  id: string;
  iconWrapClassName: string;
  icon: string;
  title: string;
  subtitle: string;
  status: ScenarioStatus;
};

type RubricRow = {
  id: string;
  icon: string;
  iconClassName: string;
  title: string;
  weight: string;
};

const questionCategories: QuestionCategory[] = [
  {
    id: "system-design",
    label: "Technical",
    labelClassName: "bg-primary-fixed text-primary",
    title: "System Design",
    subtitle: "142 Questions • Last updated yesterday",
    arrowHoverClassName: "group-hover:text-primary",
  },
  {
    id: "leadership",
    label: "Soft Skills",
    labelClassName: "bg-tertiary-fixed text-tertiary",
    title: "Leadership Scenarios",
    subtitle: "86 Questions • 4 categories",
    arrowHoverClassName: "group-hover:text-tertiary",
  },
  {
    id: "lang",
    label: "Language",
    labelClassName: "bg-secondary-fixed text-secondary",
    title: "Python & Go Proficiency",
    subtitle: "310 Questions • Advanced Level",
    arrowHoverClassName: "group-hover:text-secondary",
  },
];

const scenarios: ScenarioRow[] = [
  {
    id: "frontend-screen",
    iconWrapClassName: "bg-tertiary-container text-on-tertiary-container",
    icon: "forum",
    title: "Front-end Developer Technical Screen",
    subtitle: "Flow: Initial Greeting → CSS Quiz → Live Coding Simulation",
    status: "active",
  },
  {
    id: "pm-case",
    iconWrapClassName: "bg-secondary-container text-on-secondary-container",
    icon: "record_voice_over",
    title: "Product Manager Case Interview",
    subtitle: "Flow: Market Estimation → Strategy Pitch → Voice AI Feedback",
    status: "in_review",
  },
];

const rubrics: RubricRow[] = [
  { id: "accuracy", icon: "psychology", iconClassName: "text-blue-500", title: "Technical Accuracy", weight: "40% Weight" },
  { id: "comms", icon: "record_voice_over", iconClassName: "text-amber-500", title: "Communication", weight: "30% Weight" },
  { id: "confidence", icon: "verified_user", iconClassName: "text-green-500", title: "Confidence Level", weight: "20% Weight" },
  { id: "problem", icon: "emoji_objects", iconClassName: "text-purple-500", title: "Problem Solving", weight: "10% Weight" },
];

export default async function AdminPracticePage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;

  return (
    <div className="bg-surface font-body text-on-surface">
      {/* SideNavBar Shell */}
      <aside className="fixed left-0 top-0 z-50 flex h-dvh w-80 flex-col overflow-y-auto overscroll-contain bg-[#f2f4f6] px-6 py-12 dark:bg-slate-900 xl:w-96">
        <AdminSidebarBrand />

        <nav className="flex-1 space-y-2">
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 hover:bg-[#eceef0] dark:hover:bg-slate-800 transition-colors"
            href="/admin/dashboard"
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-medium">{t("common.dashboard")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 hover:bg-[#eceef0] dark:hover:bg-slate-800 transition-colors"
            href="/admin/interviews"
          >
            <span className="material-symbols-outlined">video_chat</span>
            <span className="font-medium">{t("admin.interviews")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 hover:bg-[#eceef0] dark:hover:bg-slate-800 transition-colors"
            href="/admin/insights"
          >
            <span className="material-symbols-outlined">psychology</span>
            <span className="font-medium">{t("admin.aiInsights")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 hover:bg-[#eceef0] dark:hover:bg-slate-800 transition-colors"
            href="/admin/knowledge-base"
          >
            <span className="material-symbols-outlined">database</span>
            <span className="font-medium">{t("admin.knowledgeBase")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#003d9b] dark:text-blue-400 font-bold border-r-4 border-[#003d9b] bg-[#eceef0] dark:bg-slate-800 transition-colors"
            href="/admin/practice"
          >
            <span className="material-symbols-outlined">fitness_center</span>
            <span className="font-bold">{t("admin.practice")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 hover:bg-[#eceef0] dark:hover:bg-slate-800 transition-colors"
            href="/admin/help"
          >
            <span className="material-symbols-outlined">help</span>
            <span className="font-medium">{t("common.helpCenter")}</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 hover:bg-[#eceef0] dark:hover:bg-slate-800 transition-colors"
            href="/admin/settings"
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="font-medium">{t("common.settings")}</span>
          </Link>
        </nav>
      </aside>

      {/* TopNavBar Shell */}
      <header className="fixed top-0 right-0 left-80 z-40 flex h-16 items-center justify-between bg-[#f7f9fb]/80 px-8 backdrop-blur-xl xl:left-96">
        <div className="flex items-center bg-surface-container-highest rounded-lg px-3 py-1.5 w-96">
          <span className="material-symbols-outlined text-outline mr-2 text-sm">
            search
          </span>
          <input
            className="bg-transparent border-none focus:ring-0 text-sm w-full font-body"
            placeholder={t("admin.search.practiceModules")}
            type="text"
          />
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-surface-container transition-all">
            <span className="material-symbols-outlined text-on-surface-variant">
              notifications
            </span>
          </button>
          <div className="flex items-center gap-3 ml-2 border-l border-outline-variant pl-4">
            <div className="text-right">
              <p className="text-sm font-bold text-on-surface leading-tight">
                {t("admin.userLabel")}
              </p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                {t("admin.role.contentLead")}
              </p>
            </div>
            <Link href="/admin/profile" aria-label="Open profile settings">
              <img
                alt="Admin Avatar"
                className="w-10 h-10 rounded-full border-2 border-primary-container object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqtyk9pTgMqoa8oYJZJWS7c-Z8e3Dk0I0AZds0glrWl7Cx1aFbKaMFV6BcwSpOFKsVBfjBuaPWLYJK_C31vBzjlxcgr34wNqXjZvBBl670yZXak4Ne3P9Lk7LgTIVdBYH5R110CamDnNMrsOw1CYZ4Hg6k7IflhXVcTRECFXP763f1lW23xG4wF5F22L3bZLCZa3tJx01DOJSwFQOrqWXjK2gimmmmbSDfHwUdk-z3yvb18ctsFvlo-V-CgYYeNUs57jkla-BCGvZG"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="ml-80 min-h-screen space-y-12 px-12 pb-16 pt-24 xl:ml-96">
        {/* Header Section */}
        <section className="flex justify-between items-end">
          <div className="max-w-2xl">
            <h2 className="text-5xl font-extrabold font-headline leading-tight tracking-tighter text-on-surface">
              {t("admin.practice.title")}
            </h2>
            <p className="text-lg text-on-surface-variant font-body mt-2">
              {t("admin.practice.subtitle")}
            </p>
          </div>
          <AdminButton variant="gradient" size="md" icon="add_circle" iconFill>
            {t("admin.practice.createAsset")}
          </AdminButton>
        </section>

        {/* Insights and Quick Stats */}
        <section className="grid grid-cols-12 gap-6 h-[200px]">
          <div className="col-span-4 bg-surface-container-lowest rounded-xl p-6 flex flex-col justify-between shadow-sm border border-outline-variant/10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  {t("admin.practice.totalQuestions")}
                </p>
                <h4 className="text-4xl font-black mt-1">1,248</h4>
              </div>
              <div className="p-2 bg-primary-fixed rounded-lg">
                <span className="material-symbols-outlined text-primary">quiz</span>
              </div>
            </div>
            <div className="flex items-center text-xs text-green-600 font-bold">
              <span className="material-symbols-outlined text-sm mr-1">
                trending_up
              </span>
              {t("admin.practice.fromLastMonth")}
            </div>
          </div>
          <div className="col-span-4 bg-surface-container-lowest rounded-xl p-6 flex flex-col justify-between shadow-sm border border-outline-variant/10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  {t("admin.practice.activeScenarios")}
                </p>
                <h4 className="text-4xl font-black mt-1">54</h4>
              </div>
              <div className="p-2 bg-tertiary-fixed rounded-lg">
                <span className="material-symbols-outlined text-tertiary">videocam</span>
              </div>
            </div>
            <div className="flex items-center text-xs text-on-surface-variant font-bold">
              <span className="material-symbols-outlined text-sm mr-1">schedule</span>
              {t("admin.practice.pendingReview")}
            </div>
          </div>
          <div className="col-span-4 bg-surface-container-lowest rounded-xl p-6 flex flex-col justify-between shadow-sm border border-outline-variant/10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  {t("admin.practice.avgCompletion")}
                </p>
                <h4 className="text-4xl font-black mt-1">82%</h4>
              </div>
              <div className="p-2 bg-secondary-fixed rounded-lg">
                <span className="material-symbols-outlined text-secondary">task_alt</span>
              </div>
            </div>
            <div className="flex items-center text-xs text-red-600 font-bold">
              <span className="material-symbols-outlined text-sm mr-1">trending_down</span>
              {t("admin.practice.thisWeekDown")}
            </div>
          </div>
        </section>

        {/* Core Management Tabs/Sections */}
        <div className="grid grid-cols-12 gap-8">
          {/* Left Side */}
          <div className="col-span-8 space-y-8">
            {/* Question Bank */}
            <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
              <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-3xl">
                    database
                  </span>
                  <h3 className="text-xl font-bold font-headline">{t("admin.practice.questionBank")}</h3>
                </div>
                <button className="text-sm font-bold text-primary hover:underline">
                  {t("admin.practice.manageAll")}
                </button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                {questionCategories.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 bg-surface rounded-xl border border-outline-variant/20 hover:border-primary/30 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`${c.labelClassName} px-2 py-0.5 rounded text-[10px] font-bold uppercase`}>
                        {c.label}
                      </span>
                    </div>
                    <h4 className="font-bold">{c.title}</h4>
                    <p className="text-xs text-on-surface-variant mt-1">{c.subtitle}</p>
                  </div>
                ))}
                <div className="p-4 bg-surface rounded-xl border border-outline-variant/20 border-dashed flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-all cursor-pointer">
                  <span className="material-symbols-outlined mb-1">add</span>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {t("admin.practice.addCategory")}
                  </span>
                </div>
              </div>
            </section>

            {/* Simulation Scenarios */}
            <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
              <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-tertiary text-3xl">
                    hub
                  </span>
                  <h3 className="text-xl font-bold font-headline">
                    {t("admin.practice.simulationScenarios")}
                  </h3>
                </div>
                <div className="flex gap-2">
                  {[
                    { icon: "chat", label: "Chat" },
                    { icon: "mic", label: "Voice" },
                    { icon: "videocam", label: "Video" },
                  ].map((t) => (
                    <span
                      key={t.label}
                      className="flex items-center gap-1 text-[10px] font-bold text-on-surface-variant uppercase bg-surface px-2 py-1 rounded border"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {t.icon}
                      </span>{" "}
                      {t.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-outline-variant/10">
                {scenarios.map((s) => (
                  <div
                    key={s.id}
                    className="p-6 flex items-center justify-between hover:bg-surface-container-low/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full ${s.iconWrapClassName} flex items-center justify-center`}
                      >
                        <span className="material-symbols-outlined">{s.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-bold">{s.title}</h4>
                        <p className="text-xs text-on-surface-variant">{s.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {s.status === "active" ? "Active" : "In Review"}
                      </span>
                      <button className="text-primary hover:bg-primary-fixed px-3 py-1 rounded-md text-sm font-bold transition-all">
                        {t("admin.practice.editFlow")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Side */}
          <div className="col-span-4">
            <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 h-full flex flex-col">
              <div className="p-6 border-b border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-3xl">
                    rule
                  </span>
                  <h3 className="text-xl font-bold font-headline">{t("admin.practice.gradingRubrics")}</h3>
                </div>
              </div>

              <div className="p-6 space-y-6 flex-1">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
                      {t("admin.practice.evaluationCriteria")}
                    </h4>
                  <button className="text-xs text-primary font-bold">{t("admin.practice.new")}</button>
                  </div>
                  <div className="space-y-3">
                    {rubrics.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 bg-surface rounded-lg flex items-center justify-between border border-outline-variant/10"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`material-symbols-outlined text-sm ${r.iconClassName}`}>
                            {r.icon}
                          </span>
                          <span className="text-sm font-medium">{r.title}</span>
                        </div>
                        <span className="text-xs font-bold text-on-surface-variant">
                          {r.weight}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-outline-variant/10">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">
                    AI Scoring Engine
                  </h4>
                  <div className="bg-surface-container p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="material-symbols-outlined text-tertiary text-sm"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        bolt
                      </span>
                      <span className="text-xs font-bold text-tertiary">
                        Real-time Feedback Active
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      The engine automatically assesses sentiment, semantic relevance,
                      and speech patterns based on these rubrics.
                    </p>
                    <button className="w-full mt-4 bg-white py-2 rounded-lg text-xs font-bold border border-outline-variant/20 hover:bg-surface-container-highest transition-all">
                      Configure Thresholds
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-8 right-8 z-50">
          <button className="bg-[rgba(112,41,225,0.85)] backdrop-blur-xl w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all">
            <span
              className="material-symbols-outlined text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              bolt
            </span>
          </button>
        </div>
      </main>
    </div>
  );
}

