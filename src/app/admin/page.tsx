import Link from "next/link";
import AdminButton from "../../../components/admin/AdminButton";
import AdminSidebarBrand from "../../../components/admin/AdminSidebarBrand";
import { cookies } from "next/headers";
import { getDictionary, normalizeLang } from "../../i18n/i18n";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;

  return (
    <div className="bg-surface font-body text-on-surface">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col bg-surface-container-low md:flex">
        <div className="flex h-full flex-col space-y-8 p-6">
          <AdminSidebarBrand />

          <AdminButton variant="gradient" size="md" icon="add" iconFill className="w-full">
            {t("admin.newInterview")}
          </AdminButton>

          <nav className="flex-1 space-y-2">
            <Link
              className="flex items-center gap-3 rounded-md bg-surface-container-lowest px-4 py-3 font-semibold text-primary shadow-sm transition-transform duration-200 hover:translate-x-1"
              href="/admin/dashboard"
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span className="text-sm font-medium">{t("common.dashboard")}</span>
            </Link>
            <Link
              className="flex items-center gap-3 rounded-md px-4 py-3 text-on-surface-variant transition-transform duration-200 hover:translate-x-1 hover:bg-surface-variant"
              href="/admin/insights"
            >
              <span className="material-symbols-outlined">psychology</span>
              <span className="text-sm font-medium">{t("admin.aiInsights")}</span>
            </Link>
            <Link
              className="flex items-center gap-3 rounded-md px-4 py-3 text-on-surface-variant transition-transform duration-200 hover:translate-x-1 hover:bg-surface-variant"
              href="/admin/interviews"
            >
              <span className="material-symbols-outlined">forum</span>
              <span className="text-sm font-medium">{t("admin.interviews")}</span>
            </Link>
            <Link
              className="flex items-center gap-3 rounded-md px-4 py-3 text-on-surface-variant transition-transform duration-200 hover:translate-x-1 hover:bg-surface-variant"
              href="/admin/practice"
            >
              <span className="material-symbols-outlined">school</span>
              <span className="text-sm font-medium">{t("admin.practice")}</span>
            </Link>
            <Link
              className="flex items-center gap-3 rounded-md px-4 py-3 text-on-surface-variant transition-transform duration-200 hover:translate-x-1 hover:bg-surface-variant"
              href="/admin/profile"
            >
              <span className="material-symbols-outlined">person</span>
              <span className="text-sm font-medium">{t("admin.myProfile")}</span>
            </Link>
            <Link
              className="flex items-center gap-3 rounded-md px-4 py-3 text-on-surface-variant transition-transform duration-200 hover:translate-x-1 hover:bg-surface-variant"
              href="/admin/settings"
            >
              <span className="material-symbols-outlined">settings</span>
              <span className="text-sm font-medium">{t("common.settings")}</span>
            </Link>
          </nav>

          <div className="space-y-2 border-t border-outline-variant/20 pt-6">
            <Link
              className="flex items-center gap-3 rounded-md px-4 py-3 text-on-surface-variant transition-transform duration-200 hover:translate-x-1 hover:bg-surface-variant"
              href="/admin/help"
            >
              <span className="material-symbols-outlined">help</span>
              <span className="text-sm font-medium">{t("common.helpCenter")}</span>
            </Link>
            <Link
              className="flex items-center gap-3 rounded-md px-4 py-3 text-error transition-transform duration-200 hover:translate-x-1 hover:bg-error-container/20"
              href="/logout"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="text-sm font-medium">{t("common.logout")}</span>
            </Link>
          </div>
        </div>
      </aside>

      <main className="min-h-screen bg-surface p-6 md:ml-64 md:p-12">
        <header className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="font-headline text-3xl font-extrabold tracking-tighter text-on-surface md:text-4xl">
              {t("admin.welcomeBack")}
            </h2>
            <p className="mt-2 text-base text-on-surface-variant md:text-lg">
              {t("admin.welcomeBack.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-4 self-start md:self-auto">
            <div className="text-right">
              <p className="font-headline font-bold text-on-surface">Alex Thompson</p>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Lead Recruiter
              </p>
            </div>
            <Link href="/admin/profile" aria-label="Open profile settings">
              <img
                alt="User profile"
                className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/10"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzi0EF24onj7ulkPE9xajVM8aWx_ckiJvXew0uj4s4Ye87TnQP_Y1AFeyWUv0u4PA_0nalmHrRQsyKGtXgYFsK_-ZEXZ-ACnfjVAYfuLp69oJHxZb9LaZ1aL0cWn_tp9Y-uIPy2RlrX1NjG5WYyn1GbX8ViwxR_NmahBsArCfUU6d3EZbCdAB8SnPd2h6F6lj2QCTJqZvMI37Z0e34TobZFRR62TLiuz2Qr1SXFIRAkW8b1RSM78l8vPktnhSrKOf3UDUEJ1HSC9lE"
              />
            </Link>
          </div>
        </header>

        <section className="mb-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="group relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm transition-all duration-300 hover:shadow-xl">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-fixed text-primary transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-3xl">chat_bubble</span>
              </div>
              <h3 className="mb-3 font-headline text-xl font-bold">AI Chat Interview</h3>
              <p className="mb-8 leading-relaxed text-on-surface-variant">
                Asynchronous text-based screening with real-time semantic analysis and sentiment tracking.
              </p>
              <button className="group/btn flex items-center gap-2 font-bold text-primary">
                Start Session
                <span className="material-symbols-outlined text-sm transition-transform group-hover/btn:translate-x-1">
                  arrow_forward
                </span>
              </button>
              <div className="absolute -bottom-4 -right-4 opacity-5 transition-opacity group-hover:opacity-10">
                <span className="material-symbols-outlined text-9xl">chat_bubble</span>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm transition-all duration-300 hover:shadow-xl">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary-container text-primary transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-3xl">settings_voice</span>
              </div>
              <h3 className="mb-3 font-headline text-xl font-bold">AI Voice Call</h3>
              <p className="mb-8 leading-relaxed text-on-surface-variant">
                Natural language processing for verbal technical screens. Includes tone analysis and keyword detection.
              </p>
              <button className="group/btn flex items-center gap-2 font-bold text-primary">
                Call Now
                <span className="material-symbols-outlined text-sm transition-transform group-hover/btn:translate-x-1">
                  arrow_forward
                </span>
              </button>
              <div className="absolute -bottom-4 -right-4 opacity-5 transition-opacity group-hover:opacity-10">
                <span className="material-symbols-outlined text-9xl">settings_voice</span>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-tertiary p-8 text-white shadow-lg transition-all duration-300 hover:shadow-2xl">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-md transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-3xl">videocam</span>
              </div>
              <h3 className="mb-3 font-headline text-xl font-bold">AI Video Interview</h3>
              <p className="mb-8 leading-relaxed text-on-tertiary-container/80">
                Full-immersion video session. AI tracks engagement, facial expressions, and complex reasoning patterns.
              </p>
              <button className="group/btn flex items-center gap-2 font-bold text-white">
                Launch Studio
                <span className="material-symbols-outlined text-sm transition-transform group-hover/btn:translate-x-1">
                  arrow_forward
                </span>
              </button>
              <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">
                <div className="h-2 w-2 animate-pulse rounded-full bg-tertiary" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">HD Studio Ready</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="font-headline text-2xl font-bold">{t("admin.home.interviewHistory")}</h3>
            <button className="flex items-center gap-1 text-sm font-bold text-primary hover:underline">
              {t("admin.home.viewFullArchive")}
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-low text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                  <th className="px-8 py-5 font-bold">Candidate / Date</th>
                  <th className="px-8 py-5 font-bold">Mode</th>
                  <th className="px-8 py-5 text-center font-bold">AI Score</th>
                  <th className="px-8 py-5 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                <tr className="group transition-colors hover:bg-surface-container/50">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <img
                        alt="Candidate"
                        className="h-10 w-10 rounded-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUUFcC9LFCq7egCxeasRjvsKZcnrW_Kw4W-mhc97Xa9izouw_5r7sVm_0I0DBDENPEIOjF3bJjHJ1qHWNwC5e6w29OnJ2Hin3dKT66R4W_IEbeUYAjS3B_jhfGnIoG5zTrNdAYlP4rcpAJvY60ne_O8L3iItvPtBGmi7xm1KsYQ8dRkl84nAhqJUqxdxgKLGk8VVVpx7hXc667h5YjYG9IWTsSKAc75p61ImtvnHPdjInKbpEIxAwcczlyG0jWOR_fvTWLU1564z3g"
                      />
                      <div>
                        <p className="font-bold text-on-surface">Sarah Jenkins</p>
                        <p className="text-xs text-on-surface-variant">May 12, 2024 • 14:30 PM</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
                      <span className="material-symbols-outlined text-lg">videocam</span>
                      Video Call
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center">
                      <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800 ring-1 ring-green-200">
                        94 / 100
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="rounded-lg px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/5">
                      View Summary
                    </button>
                  </td>
                </tr>

                <tr className="group transition-colors hover:bg-surface-container/50">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <img
                        alt="Candidate"
                        className="h-10 w-10 rounded-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDH7bjWVgFmGtRPIU6sUA5FncrTcjuqZkOZ7g3gF7SHNV1YXqyHHnjmoZnJRTff7hB1a5cAnPG-eD-lw0llurUkzFuhqSvHfgeF8NRZviK0KHJWzoEnG4BOX2UlYX3K6wk27nvOfk_Kk1Tu0Sb5ZCPCZ-rNkKxRuoY2VOKQS1xh6mfJgy7gXnDsvE9ir9Hh0cJ397yLUVb10IQKK92ynajWZkurbZV6W_fyXV8eQPvfcWqnEq2sVFgpD4muJxfSj5ENbUvTWdp5wWyS"
                      />
                      <div>
                        <p className="font-bold text-on-surface">Mark Zuckerberg (Test)</p>
                        <p className="text-xs text-on-surface-variant">May 11, 2024 • 09:15 AM</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
                      <span className="material-symbols-outlined text-lg">chat_bubble</span>
                      AI Chat
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center">
                      <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 ring-1 ring-blue-200">
                        82 / 100
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="rounded-lg px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/5">
                      View Summary
                    </button>
                  </td>
                </tr>

                <tr className="group transition-colors hover:bg-surface-container/50">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container font-bold text-on-surface-variant">
                        DA
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">David Abloh</p>
                        <p className="text-xs text-on-surface-variant">May 10, 2024 • 16:45 PM</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
                      <span className="material-symbols-outlined text-lg">settings_voice</span>
                      Voice Call
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center">
                      <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                        67 / 100
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="rounded-lg px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/5">
                      View Summary
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2">
          <div className="flex flex-col justify-center rounded-xl bg-surface-container p-8">
            <span className="mb-4 text-[10px] font-bold uppercase tracking-widest text-tertiary">
              {t("admin.home.trainingModule")}
            </span>
            <h3 className="mb-4 font-headline text-3xl font-extrabold leading-tight">
              Master the Curator Protocol.
            </h3>
            <p className="mb-8 max-w-md text-on-surface-variant">
              Sharpen your evaluative skills with interactive multiple-choice question sets focused on AI-human synergy and bias detection.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="rounded-xl bg-tertiary px-8 py-4 font-bold text-white shadow-lg shadow-tertiary/20 transition-colors hover:bg-tertiary-container">
                Start Quiz Set
              </button>
              <button className="rounded-xl border-2 border-tertiary/20 bg-transparent px-8 py-4 font-bold text-tertiary transition-colors hover:bg-tertiary/5">
                Explore Topics
              </button>
            </div>
          </div>

          <div className="flex items-center gap-8 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-8">
            <div className="flex-1">
              <h4 className="mb-2 font-headline text-xl font-bold">{t("admin.home.practiceProgress")}</h4>
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex justify-between text-xs font-bold uppercase tracking-tighter text-on-surface-variant">
                    <span>{t("admin.home.biasNeutrality")}</span>
                    <span>88%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                    <div className="h-full w-[88%] rounded-full bg-primary" />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs font-bold uppercase tracking-tighter text-on-surface-variant">
                    <span>{t("admin.home.semanticAccuracy")}</span>
                    <span>65%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                    <div className="h-full w-[65%] rounded-full bg-tertiary" />
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden sm:block">
              <div className="relative h-32 w-32">
                <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 128 128">
                  <circle
                    className="text-surface-container"
                    cx="64"
                    cy="64"
                    fill="transparent"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                  />
                  <circle
                    className="text-primary"
                    cx="64"
                    cy="64"
                    fill="transparent"
                    r="56"
                    stroke="currentColor"
                    strokeDasharray="351.8"
                    strokeDashoffset="88"
                    strokeWidth="8"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black">75%</span>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant">
                    {t("admin.home.globalMastery")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-24 w-full border-t border-outline-variant/20 py-12">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex flex-col items-center gap-2 text-center md:flex-row md:gap-4 md:text-left">
              <span className="font-headline text-xl font-bold text-on-surface">Curator AI</span>
              <span className="text-xs text-on-surface-variant">
                © 2024 Curator AI Platform. Editorial Intelligence for HR.
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
              <Link className="text-xs text-on-surface-variant transition-colors hover:underline" href="/admin/settings">
                {t("footer.privacy")}
              </Link>
              <Link className="text-xs text-on-surface-variant transition-colors hover:underline" href="/admin/settings">
                {t("footer.terms")}
              </Link>
              <Link className="text-xs text-on-surface-variant transition-colors hover:underline" href="/admin/settings">
                {t("footer.cookies")}
              </Link>
              <Link className="text-xs text-on-surface-variant transition-colors hover:underline" href="/admin/settings">
                {t("footer.security")}
              </Link>
            </div>
          </div>
        </footer>

        <section className="mb-24 space-y-2 border-t border-outline-variant/20 pt-6 md:hidden">
          <Link
            className="flex items-center gap-3 rounded-md px-4 py-3 text-on-surface-variant transition-colors hover:bg-surface-variant"
            href="/admin/help"
          >
            <span className="material-symbols-outlined">help</span>
            <span className="text-sm font-medium">Help Center</span>
          </Link>
          <Link
            className="flex items-center gap-3 rounded-md px-4 py-3 text-error transition-colors hover:bg-error-container/20"
            href="/logout"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm font-medium">Logout</span>
          </Link>
        </section>
      </main>

      <nav className="fixed bottom-8 left-1/2 z-50 flex w-fit min-w-[320px] -translate-x-1/2 items-center justify-around gap-6 rounded-full border border-outline-variant/20 bg-tertiary-container/85 px-8 py-3 shadow-[0_40px_60px_rgba(25,28,30,0.04)] backdrop-blur-xl md:hidden">
        <button className="rounded-full bg-white/20 p-3 text-white transition-transform hover:scale-110 active:scale-90">
          <span className="material-symbols-outlined">mic</span>
        </button>
        <button className="p-3 text-white/70 transition-transform hover:scale-110 hover:text-white active:scale-90">
          <span className="material-symbols-outlined">videocam</span>
        </button>
        <button className="p-3 text-white/70 transition-transform hover:scale-110 hover:text-white active:scale-90">
          <span className="material-symbols-outlined">history</span>
        </button>
        <button className="p-3 text-white/70 transition-transform hover:scale-110 hover:text-white active:scale-90">
          <span className="material-symbols-outlined">call_end</span>
        </button>
      </nav>
    </div>
  );
}
