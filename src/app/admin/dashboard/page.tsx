import Link from "next/link";
import AdminButton from "../../../../components/admin/AdminButton";
import AdminSidebarBrand from "../../../../components/admin/AdminSidebarBrand";
import { cookies } from "next/headers";
import { getDictionary, normalizeLang } from "../../../i18n/i18n";

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;

  return (
    <div className="bg-surface font-body text-on-surface selection:bg-primary-fixed">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col space-y-8 bg-surface-container-low p-6 font-body text-sm font-medium">
        <AdminSidebarBrand />

        <AdminButton
          variant="gradient"
          size="md"
          icon="add_circle"
          iconFill
          className="w-full"
        >
          {t("admin.newInterview")}
        </AdminButton>

        <nav className="flex-grow space-y-1">
          <Link
            className="flex items-center gap-3 rounded-md bg-surface-container-lowest px-4 py-3 font-semibold text-primary shadow-sm"
            href="/admin/dashboard"
          >
            <span className="material-symbols-outlined">dashboard</span>
            {t("common.dashboard")}
          </Link>
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

      <main className="ml-64 min-h-screen p-12">
        <header className="mb-12 flex items-end justify-between">
          <div className="space-y-2">
            <h2 className="font-headline text-5xl font-extrabold tracking-tighter text-on-surface">
              {t("admin.dashboard.title")}
            </h2>
            <p className="font-body text-on-surface-variant">
              {t("admin.dashboard.subtitle")}
            </p>
          </div>
          <Link href="/admin/profile" className="flex gap-4">
            <div className="flex -space-x-3">
              <img
                alt="User"
                className="h-10 w-10 rounded-full border-2 border-surface object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0R1uc6L61a-3y4Il3-IvwYwbuPvAIrdA0C3CgWETA0zE20DgLGWp2QZ2YU45E9OMrMrtAJShwaQ_I-IH9NfQWgfF6HmCFY5QisBrd12rdv18BVgJQHbIo3LBZG1_ogn9q0QbO53kz3AMH2_Ic_B2gqryiDbL3oFCpBkf0GhPdgvq3UWz2omAOwm95y1H-SIA7Bm0KNL5O4m6zW7OmFwrwIT14sACnMy81nb-tfpAHewqFCkegNzoA4TbC-FQqb68Mf0ofDG_xEhLh"
              />
              <img
                alt="User"
                className="h-10 w-10 rounded-full border-2 border-surface object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBIVHE9Q05wU6G7ttS5FLvJhCSmVQK9abrNyydNLA4JCX1ATMYpzkU_If4m8Ws7Vh1zXkyeMkL9uXkq4J3MKseSyyHnw7HRGxwjFKgQ1SpKQ_JqF3KmcjGDRksAF06Xat7Y4Zsw7-DW-qev2A2sWVfg6DBRlNKixRLVzMeFa0og0WhxK80B2yaHBgYlG8U6AHGVtPPX97aN8uoREqX_5-_Ckp49AOTNNgIf9NysDBTtFFrA8TJ_tCsX7oYwM2Ndq-mTcojiamySxdh"
              />
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface bg-primary-fixed text-xs font-bold text-primary">
                +12
              </div>
            </div>
          </Link>
        </header>

        <section className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="col-span-1 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <span className="material-symbols-outlined rounded-lg bg-primary-fixed p-2 text-primary">
                groups
              </span>
              <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600">
                +12%
              </span>
            </div>
            <p className="text-sm font-medium text-on-surface-variant">
              {t("admin.dashboard.totalInterviews")}
            </p>
            <h3 className="font-headline text-3xl font-bold text-on-surface">
              1,284
            </h3>
          </div>

          <div className="col-span-1 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <span className="material-symbols-outlined rounded-lg bg-tertiary-fixed p-2 text-tertiary">
                verified
              </span>
              <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600">
                +5%
              </span>
            </div>
            <p className="text-sm font-medium text-on-surface-variant">
              {t("admin.dashboard.successRate")}
            </p>
            <h3 className="font-headline text-3xl font-bold text-on-surface">
              68.2%
            </h3>
          </div>

          <div className="col-span-1 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <span className="material-symbols-outlined rounded-lg bg-secondary-fixed p-2 text-secondary">
                person_play
              </span>
              <span className="rounded bg-surface-container px-2 py-1 text-xs font-bold text-on-surface-variant">
                Stable
              </span>
            </div>
            <p className="text-sm font-medium text-on-surface-variant">
              {t("admin.dashboard.activeUsers")}
            </p>
            <h3 className="font-headline text-3xl font-bold text-on-surface">
              412
            </h3>
          </div>

          <div className="relative col-span-1 overflow-hidden rounded-xl bg-gradient-to-br from-primary to-tertiary p-8 text-white shadow-xl">
            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-2">
                <div className="ai-pulse h-2 w-2 rounded-full bg-white" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                  {t("admin.dashboard.aiProcessor")}
                </span>
              </div>
              <p className="text-sm font-medium opacity-90">{t("admin.dashboard.tokensAnalyzed")}</p>
              <h3 className="font-headline text-3xl font-bold">4.8M</h3>
              <p className="mt-4 text-[10px] opacity-70">{t("admin.dashboard.ragEfficiencyHigh")}</p>
            </div>
            <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-8xl opacity-10">
              psychology
            </span>
          </div>
        </section>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h4 className="font-headline text-2xl font-bold">
                {t("admin.dashboard.knowledgeBaseTitle")}
              </h4>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 rounded-lg bg-surface-container-high px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface-variant">
                  <span className="material-symbols-outlined text-lg">
                    upload_file
                  </span>
                  {t("admin.dashboard.uploadCorpus")}
                </button>
                <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-container">
                  <span className="material-symbols-outlined text-lg">add</span>
                  {t("admin.dashboard.addEntry")}
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    <th className="px-6 py-4">{t("admin.dashboard.sourceIntent")}</th>
                    <th className="px-6 py-4">{t("admin.dashboard.knowledgeExcerpt")}</th>
                    <th className="px-6 py-4">{t("admin.dashboard.lastUpdated")}</th>
                    <th className="px-6 py-4 text-right">{t("admin.dashboard.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  <tr className="transition-colors hover:bg-surface-container">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">
                          description
                        </span>
                        <div>
                          <p className="text-sm font-semibold">Policy_HR_v2.pdf</p>
                          <p className="text-xs text-on-surface-variant">
                            {t("admin.dashboard.corpus.interviewProtocols")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="max-w-xs text-xs italic text-on-surface-variant">
                        &ldquo;{t("admin.dashboard.corpus.excerpt.policy")}&rdquo;
                      </p>
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant">
                      {t("admin.dashboard.time.hoursAgo").replace("{count}", "2")}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="rounded-md p-2 transition-colors hover:bg-primary-fixed">
                          <span className="material-symbols-outlined text-lg text-primary">
                            edit
                          </span>
                        </button>
                        <button className="rounded-md p-2 transition-colors hover:bg-error-container">
                          <span className="material-symbols-outlined text-lg text-error">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr className="transition-colors hover:bg-surface-container">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-tertiary">
                          question_answer
                        </span>
                        <div>
                          <p className="text-sm font-semibold">Technical_QA_List</p>
                          <p className="text-xs text-on-surface-variant">
                            {t("admin.dashboard.corpus.manualTraining")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="max-w-xs text-xs italic text-on-surface-variant">
                        &ldquo;{t("admin.dashboard.corpus.excerpt.cap")}&rdquo;
                      </p>
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant">
                      {t("admin.dashboard.time.yesterday")}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="rounded-md p-2 transition-colors hover:bg-primary-fixed">
                          <span className="material-symbols-outlined text-lg text-primary">
                            edit
                          </span>
                        </button>
                        <button className="rounded-md p-2 transition-colors hover:bg-error-container">
                          <span className="material-symbols-outlined text-lg text-error">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr className="transition-colors hover:bg-surface-container">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary">
                          link
                        </span>
                        <div>
                          <p className="text-sm font-semibold">Wiki_Culture_Export</p>
                          <p className="text-xs text-on-surface-variant">
                            {t("admin.dashboard.corpus.webScraping")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="max-w-xs text-xs italic text-on-surface-variant">
                        &ldquo;{t("admin.dashboard.corpus.excerpt.mission")}&rdquo;
                      </p>
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant">
                      {t("admin.dashboard.time.dateOct24_2024")}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="rounded-md p-2 transition-colors hover:bg-primary-fixed">
                          <span className="material-symbols-outlined text-lg text-primary">
                            edit
                          </span>
                        </button>
                        <button className="rounded-md p-2 transition-colors hover:bg-error-container">
                          <span className="material-symbols-outlined text-lg text-error">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-6">
            <h4 className="font-headline text-2xl font-bold">
              {t("admin.dashboard.analyticsBreakdown")}
            </h4>
            <div className="space-y-8 rounded-xl bg-surface-container-low p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{t("admin.dashboard.metric.nlpAccuracy")}</span>
                  <span className="text-primary">94%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                  <div className="h-full w-[94%] bg-primary" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{t("admin.dashboard.metric.knowledgeCoverage")}</span>
                  <span className="text-tertiary">78%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                  <div className="h-full w-[78%] bg-tertiary" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{t("admin.dashboard.metric.userSentiment")}</span>
                  <span className="text-secondary">88%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                  <div className="h-full w-[88%] bg-secondary" />
                </div>
              </div>

              <div className="mt-8 border-t border-outline-variant/30 pt-8">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {t("admin.dashboard.trafficHeatmap")}
                </p>
                <div className="grid h-32 grid-cols-7 gap-1">
                  <div className="rounded-sm bg-primary-fixed" />
                  <div className="rounded-sm bg-primary-fixed-dim" />
                  <div className="rounded-sm bg-primary" />
                  <div className="rounded-sm bg-primary-container" />
                  <div className="rounded-sm bg-primary" />
                  <div className="rounded-sm bg-primary-fixed" />
                  <div className="rounded-sm bg-primary-fixed-dim" />
                  <div className="rounded-sm bg-primary-fixed" />
                  <div className="rounded-sm bg-primary-fixed-dim" />
                  <div className="rounded-sm bg-primary" />
                  <div className="rounded-sm bg-primary-container" />
                  <div className="rounded-sm bg-primary" />
                  <div className="rounded-sm bg-primary-fixed" />
                  <div className="rounded-sm bg-primary-fixed-dim" />
                  <div className="rounded-sm bg-primary-fixed" />
                  <div className="rounded-sm bg-primary-fixed-dim" />
                  <div className="rounded-sm bg-primary" />
                  <div className="rounded-sm bg-primary-container" />
                  <div className="rounded-sm bg-primary" />
                  <div className="rounded-sm bg-primary-fixed" />
                  <div className="rounded-sm bg-primary-fixed-dim" />
                </div>
                <div className="mt-2 flex justify-between text-[10px] font-bold uppercase text-on-surface-variant">
                  <span>{t("admin.dashboard.week.mon")}</span>
                  <span>{t("admin.dashboard.week.sun")}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-tertiary/20 bg-tertiary/10 p-6">
              <div className="mb-3 flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary">
                  auto_fix_high
                </span>
                <h5 className="font-bold text-tertiary">{t("admin.dashboard.aiSuggestions")}</h5>
              </div>
              <p className="text-xs leading-relaxed text-on-surface-variant">
                {t("admin.dashboard.suggestionText")}
              </p>
            </div>
          </section>
        </div>
      </main>

      <footer className="ml-64 w-full border-t border-outline-variant/20 bg-surface py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-12 md:flex-row">
          <div className="flex items-center gap-4">
            <span className="font-headline text-lg font-bold text-on-surface">
              Curator AI
            </span>
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

