import Link from "next/link";
import AdminButton from "../../../../components/admin/AdminButton";
import AdminSidebarBrand from "../../../../components/admin/AdminSidebarBrand";
import { cookies } from "next/headers";
import { getDictionary, normalizeLang } from "../../../i18n/i18n";
import LanguageToggleButton from "../../../components/LanguageToggleButton";

type InterviewType = "video" | "chat" | "voice";
type InterviewStatus = "completed" | "scheduled" | "action_needed";

type InterviewRow = {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidateInitials: string;
  position: string;
  teamAndLocation: string;
  type: InterviewType;
  aiScore?: number;
  dateLabel: string;
  timeLabel: string;
  status: InterviewStatus;
  actionLabel: string;
};

const rows: InterviewRow[] = [
  {
    id: "1",
    candidateName: "Sarah Mitchell",
    candidateEmail: "sarah.m@example.com",
    candidateInitials: "SM",
    position: "Senior Product Designer",
    teamAndLocation: "Product Team • London",
    type: "video",
    aiScore: 94,
    dateLabel: "Oct 24, 2023",
    timeLabel: "14:00 PM",
    status: "completed",
    actionLabel: "admin.interviews.action.viewDetailedReport",
  },
  {
    id: "2",
    candidateName: "James Rodriguez",
    candidateEmail: "james.r@example.com",
    candidateInitials: "JR",
    position: "Full Stack Engineer",
    teamAndLocation: "Engineering • Remote",
    type: "chat",
    dateLabel: "Oct 26, 2023",
    timeLabel: "10:30 AM",
    status: "scheduled",
    actionLabel: "admin.interviews.action.manageInvite",
  },
  {
    id: "3",
    candidateName: "Linda Wu",
    candidateEmail: "linda.wu@example.com",
    candidateInitials: "LW",
    position: "Growth Marketing Lead",
    teamAndLocation: "Marketing • NY Office",
    type: "voice",
    aiScore: 72,
    dateLabel: "Oct 23, 2023",
    timeLabel: "09:00 AM",
    status: "action_needed",
    actionLabel: "admin.interviews.action.reviewAiConflict",
  },
  {
    id: "4",
    candidateName: "Alex Kim",
    candidateEmail: "alex.k@example.com",
    candidateInitials: "AK",
    position: "Data Analyst",
    teamAndLocation: "Data Science • Remote",
    type: "video",
    aiScore: 86,
    dateLabel: "Oct 23, 2023",
    timeLabel: "16:30 PM",
    status: "completed",
    actionLabel: "admin.interviews.action.viewDetailedReport",
  },
];

function typeIcon(type: InterviewType) {
  if (type === "video") return "video_chat";
  if (type === "chat") return "chat_bubble";
  return "mic";
}

function statusPill(status: InterviewStatus) {
  if (status === "completed") {
    return {
      className:
        "inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wide",
      label: "admin.interviews.status.completed",
    };
  }
  if (status === "scheduled") {
    return {
      className:
        "inline-flex items-center px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wide",
      label: "admin.interviews.status.scheduled",
    };
  }
  return {
    className:
      "inline-flex items-center px-3 py-1 rounded-full bg-error-container text-error text-[10px] font-bold uppercase tracking-wide",
    label: "admin.interviews.status.actionNeeded",
  };
}

export default async function AdminInterviewsPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;

  return (
    <div className="bg-surface text-on-surface antialiased font-body">
      {/* SideNavBar Shell */}
      <aside className="h-screen w-72 flex-col fixed left-0 top-0 bg-[#f2f4f6] dark:bg-slate-900 font-headline antialiased tracking-tight flex py-12 px-6 z-50">
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

          {/* Active Tab: Interviews */}
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#003d9b] dark:text-blue-400 font-bold border-r-4 border-[#003d9b] dark:border-blue-400 bg-white/50 dark:bg-white/5 transition-colors duration-200"
            href="/admin/interviews"
          >
            <span className="material-symbols-outlined" data-icon="video_chat">
              video_chat
            </span>
            <span>{t("admin.interviews")}</span>
          </Link>

          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 font-medium hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-colors duration-200"
            href="/admin/insights"
          >
            <span className="material-symbols-outlined" data-icon="psychology">
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

        <div className="mt-auto space-y-6">
          <AdminButton
            variant="gradient"
            size="md"
            icon="auto_awesome"
            iconFill
            className="w-full"
          >
            {t("admin.settings.startAiAnalysis")}
          </AdminButton>

          <div className="pt-6 space-y-2 border-t border-outline-variant/20">
            <Link
              className="flex items-center gap-3 px-4 py-2 text-[#434654] dark:text-slate-400 text-sm hover:text-[#191c1e] transition-colors"
              href="/admin/help"
            >
              <span className="material-symbols-outlined text-lg" data-icon="help">
                help
              </span>
              {t("common.helpCenter")}
            </Link>
            <Link
              className="flex items-center gap-3 px-4 py-2 text-[#434654] dark:text-slate-400 text-sm hover:text-[#191c1e] transition-colors"
              href="/logout"
            >
              <span className="material-symbols-outlined text-lg" data-icon="logout">
                logout
              </span>
              {t("common.logout")}
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-72 min-h-screen bg-surface">
        {/* TopNavBar Shell */}
        <header className="flex justify-between items-center h-20 px-12 sticky top-0 bg-[#f7f9fb] dark:bg-slate-950 z-40">
          <div className="flex items-center gap-8">
            <h2 className="text-xl font-black text-[#191c1e] dark:text-white font-headline">
              {t("admin.topbar.title")}
            </h2>

            <div className="relative group">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg"
                data-icon="search"
              >
                search
              </span>
              <input
                className="bg-surface-container-highest border-none rounded-xl py-2 pl-12 pr-4 w-80 text-sm font-medium focus:ring-2 focus:ring-surface-tint focus:bg-white transition-all"
                placeholder={t("admin.search.sessionsCandidates")}
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

            <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/30">
              <div className="text-right">
                <p className="text-xs font-bold text-on-surface">{t("admin.userLabel")}</p>
                <p className="text-[10px] text-on-surface-variant">{t("admin.role.seniorRecruiter")}</p>
              </div>
              <Link href="/admin/profile" aria-label="Open profile settings">
                <img
                  alt="Administrator Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-primary-container/20"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZEfOkXNex_d251CX9sa-CveNgwq47OnJjIfWRkRDATuR_klNI3K40Jsu2X4u7qxb-KLcBSxVtjjCNI-iYlEM_Vtc2Y2mlXepeB5jnVd8nk7zOd2dZKabRexo7xez32XfRdVHiSaOBd8vcdlInH4ruAe6uo3vbnHKtSalACbQNUS1w1uHLc8biQLYJXJcv7CK3OJ7VB5yNthze88WHEHU0lfpl6r5eIfHRKMOT_oUtyg_KbpydV0uRU2ckbpkTiwt94I_BMUtK3klz"
                />
              </Link>
            </div>
          </div>
        </header>

        <section className="px-12 py-12">
          {/* Hero Stats / Bento Header */}
          <div className="grid grid-cols-12 gap-6 mb-12">
            <div className="col-span-8 bg-surface-container-lowest p-8 rounded-xl relative overflow-hidden flex flex-col justify-between">
              <div>
                <h3 className="font-headline text-4xl font-extrabold tracking-tighter mb-2">
                  {t("admin.interviews.title")}
                </h3>
                <p className="text-on-surface-variant max-w-md">
                  {t("admin.interviews.subtitle")}
                </p>
              </div>
              <div className="flex gap-12 mt-8">
                <div>
                  <span className="text-3xl font-black text-primary font-headline">
                    24
                  </span>
                  <p className="text-xs font-semibold text-on-surface-variant tracking-wider uppercase">
                    {t("admin.interviews.activeToday")}
                  </p>
                </div>
                <div>
                  <span className="text-3xl font-black text-tertiary font-headline">
                    88%
                  </span>
                  <p className="text-xs font-semibold text-on-surface-variant tracking-wider uppercase">
                    {t("admin.interviews.avgAiScore")}
                  </p>
                </div>
                <div>
                  <span className="text-3xl font-black text-secondary font-headline">
                    12
                  </span>
                  <p className="text-xs font-semibold text-on-surface-variant tracking-wider uppercase">
                    {t("admin.interviews.needsReview")}
                  </p>
                </div>
              </div>
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-tertiary/10 rounded-full blur-3xl"></div>
            </div>

            <div className="col-span-4 bg-tertiary-container text-on-tertiary-container p-8 rounded-xl flex flex-col justify-between backdrop-blur-xl">
              <div className="flex justify-between items-start">
                <span
                  className="material-symbols-outlined text-4xl"
                  data-icon="auto_awesome"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  auto_awesome
                </span>
                <div className="ai-pulse w-3 h-3 rounded-full bg-tertiary"></div>
              </div>
              <div>
                <h4 className="font-headline text-xl font-bold leading-tight">
                  {t("admin.interviews.aiOrchestrator")}
                </h4>
                <p className="text-sm opacity-80 mt-2">
                  {t("admin.interviews.aiNextSimulation")}
                </p>
              </div>
              <button className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white font-bold py-3 rounded-lg text-sm transition-all border border-white/10">
                {t("admin.interviews.manageSimulation")}
              </button>
            </div>
          </div>

          {/* Filtering & Actions Bar */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-4">
              <button className="px-6 py-2 bg-surface-container-high text-on-surface text-sm font-semibold rounded-full hover:bg-surface-container-highest transition-colors">
                {t("admin.interviews.filter.allRoles")}
              </button>
              <button className="px-6 py-2 bg-white text-on-surface-variant text-sm font-semibold rounded-full border border-outline-variant/30 hover:bg-surface-container-low transition-colors">
                {t("admin.interviews.filter.pending")}
              </button>
              <button className="px-6 py-2 bg-white text-on-surface-variant text-sm font-semibold rounded-full border border-outline-variant/30 hover:bg-surface-container-low transition-colors">
                {t("admin.interviews.filter.completed")}
              </button>
            </div>
            <AdminButton variant="primary" size="md" icon="add" className="">
              {t("admin.interviews.scheduleNew")}
            </AdminButton>
          </div>

          {/* Interviews Table Section */}
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant">
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest">
                    {t("admin.interviews.table.candidate")}
                  </th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest">
                    {t("admin.interviews.table.position")}
                  </th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-center">
                    {t("admin.interviews.table.type")}
                  </th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-center">
                    {t("admin.interviews.table.aiScore")}
                  </th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest">
                    {t("admin.interviews.table.date")}
                  </th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest">
                    {t("admin.interviews.table.status")}
                  </th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-right">
                    {t("admin.interviews.table.action")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {rows.map((row) => {
                  const pill = statusPill(row.status);
                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-surface transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {row.candidateInitials}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">
                              {row.candidateName}
                            </p>
                            <p className="text-[10px] text-on-surface-variant">
                              {row.candidateEmail}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-medium">{row.position}</p>
                        <p className="text-[10px] text-on-surface-variant">
                          {row.teamAndLocation}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="inline-flex items-center justify-center p-2 rounded-lg bg-surface-container text-on-surface-variant">
                          <span
                            className="material-symbols-outlined text-xl"
                            data-icon={typeIcon(row.type)}
                          >
                            {typeIcon(row.type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        {typeof row.aiScore === "number" ? (
                          <span className="text-lg font-black text-tertiary">
                            {row.aiScore}
                          </span>
                        ) : (
                          <span className="text-lg font-black text-on-surface-variant opacity-30">
                            --
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-medium">{row.dateLabel}</p>
                        <p className="text-[10px] text-on-surface-variant">
                          {row.timeLabel}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={pill.className}>{t(pill.label)}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button className="text-primary font-bold text-sm hover:underline">
                          {t(row.actionLabel)}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="px-8 py-4 bg-surface-container-low flex justify-between items-center text-xs font-semibold text-on-surface-variant">
              <span>{t("admin.interviews.pagination")}</span>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-surface-container transition-colors rounded">
                  <span
                    className="material-symbols-outlined text-lg"
                    data-icon="chevron_left"
                  >
                    chevron_left
                  </span>
                </button>
                <button className="px-3 py-1 bg-white rounded shadow-sm text-primary">
                  1
                </button>
                <button className="px-3 py-1 hover:bg-surface-container transition-colors rounded">
                  2
                </button>
                <button className="px-3 py-1 hover:bg-surface-container transition-colors rounded">
                  3
                </button>
                <button className="p-2 hover:bg-surface-container transition-colors rounded">
                  <span
                    className="material-symbols-outlined text-lg"
                    data-icon="chevron_right"
                  >
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Floating Mic Tray */}
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-surface-bright/80 backdrop-blur-xl px-8 py-4 rounded-full flex items-center gap-12 border border-outline-variant/20 shadow-2xl z-40">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-tertiary"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface">
              {t("admin.interviews.systemsLive")}
            </span>
          </div>
          <div className="flex gap-6 text-on-surface-variant">
            <button className="hover:text-primary transition-colors">
              <span className="material-symbols-outlined" data-icon="mic">
                mic
              </span>
            </button>
            <button className="hover:text-primary transition-colors">
              <span className="material-symbols-outlined" data-icon="videocam">
                videocam
              </span>
            </button>
            <button className="hover:text-primary transition-colors">
              <span
                className="material-symbols-outlined"
                data-icon="screen_share"
              >
                screen_share
              </span>
            </button>
            <button className="hover:text-primary transition-colors">
              <span className="material-symbols-outlined" data-icon="settings">
                settings
              </span>
            </button>
          </div>
          <div className="w-10 h-10 rounded-full bg-error flex items-center justify-center text-white">
            <span className="material-symbols-outlined" data-icon="call_end">
              call_end
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

