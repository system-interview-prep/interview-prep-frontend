import Link from "next/link";
import LanguageToggleButton from "../../components/LanguageToggleButton";
import { cookies } from "next/headers";
import { getDictionary, normalizeLang } from "../../i18n/i18n";

export default async function InterviewSummaryPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;

  return (
    <div className="bg-surface font-body text-on-surface selection:bg-primary-container selection:text-white">
      <nav className="sticky top-0 z-50 flex w-full items-center justify-between bg-surface px-12 py-4">
        <div className="flex items-center gap-8">
          <span className="font-headline text-2xl font-black tracking-tight text-on-surface">INTERVIA</span>
          <div className="hidden gap-6 md:flex">
            <Link className="font-headline font-bold tracking-tight text-on-surface-variant transition-colors hover:text-primary-container" href="#">
              {t("nav.platform")}
            </Link>
            <Link className="font-headline font-bold tracking-tight text-on-surface-variant transition-colors hover:text-primary-container" href="#">
              {t("nav.solutions")}
            </Link>
            <Link className="font-headline font-bold tracking-tight text-on-surface-variant transition-colors hover:text-primary-container" href="#">
              {t("nav.pricing")}
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggleButton className="material-symbols-outlined rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container" />
          <button className="material-symbols-outlined rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container">notifications</button>
          <button className="scale-95 rounded-lg bg-primary px-6 py-2 font-bold text-white transition-all duration-200 hover:bg-primary-container">
            {t("interview.getStarted")}
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-[1440px] px-12 py-16">
        <header className="relative mb-16">
          <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-tertiary/10 blur-[100px]" />
          <div className="max-w-3xl">
            <span className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-tertiary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-tertiary" />
              {t("interviewSummary.badge.analysisComplete")}
            </span>
            <h1 className="mb-6 font-headline text-[3.5rem] font-extrabold leading-none tracking-tight text-on-surface">
              {t("interviewSummary.hero.congrats").replace("{name}", "Alex")}
            </h1>
            <p className="max-w-2xl text-xl leading-relaxed text-on-surface-variant">
              {t("interviewSummary.hero.description")}
            </p>
          </div>
        </header>

        <section className="mb-16 grid grid-cols-12 gap-6">
          <div className="group relative col-span-12 overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-8 shadow-sm lg:col-span-5">
            <div className="absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
              <span className="material-symbols-outlined text-9xl">analytics</span>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-on-surface-variant">{t("interviewSummary.score.title")}</h3>
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-7xl font-black text-on-surface">82</span>
                <span className="text-2xl font-bold text-on-surface-variant">{t("interviewSummary.score.outOf")}</span>
              </div>
            </div>
            <div className="mt-8">
              <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
                <div className="h-full w-[82%] bg-gradient-to-r from-primary to-tertiary" />
              </div>
              <p className="mt-4 text-sm font-medium italic text-on-surface-variant">
                {t("interviewSummary.score.quote")}
              </p>
            </div>
          </div>

          <div className="col-span-12 flex flex-col items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-8 text-center shadow-sm md:col-span-6 lg:col-span-3">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <span className="material-symbols-outlined text-3xl text-primary">code</span>
            </div>
            <span className="font-headline text-4xl font-black text-on-surface">78%</span>
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">{t("interviewSummary.metric.technicalKnowledge")}</p>
          </div>

          <div className="col-span-12 flex flex-col items-center justify-center rounded-xl border border-outline-variant/20 bg-gradient-to-br from-white to-secondary-container/20 p-8 text-center shadow-sm md:col-span-6 lg:col-span-4">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-tertiary/10">
              <span className="material-symbols-outlined text-3xl text-tertiary">psychology</span>
            </div>
            <span className="font-headline text-4xl font-black text-on-surface">94%</span>
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">{t("interviewSummary.metric.confidencePresence")}</p>
          </div>
        </section>

        <section className="mb-16 grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined rounded-xl bg-primary/10 p-3 text-primary">auto_awesome</span>
              <h2 className="font-headline text-2xl font-bold tracking-tight">{t("interviewSummary.strengths.title")}</h2>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border-l-4 border-primary bg-surface-container-low p-6">
                <h4 className="mb-1 font-bold text-on-surface">{t("interviewSummary.strengths.item1.title")}</h4>
                <p className="text-sm text-on-surface-variant">{t("interviewSummary.strengths.item1.desc")}</p>
              </div>
              <div className="rounded-xl border-l-4 border-primary bg-surface-container-low p-6">
                <h4 className="mb-1 font-bold text-on-surface">{t("interviewSummary.strengths.item2.title")}</h4>
                <p className="text-sm text-on-surface-variant">{t("interviewSummary.strengths.item2.desc")}</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined rounded-xl bg-tertiary/10 p-3 text-tertiary">trending_up</span>
              <h2 className="font-headline text-2xl font-bold tracking-tight">{t("interviewSummary.growth.title")}</h2>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border-l-4 border-tertiary bg-surface-container-low p-6">
                <h4 className="mb-1 font-bold text-on-surface">{t("interviewSummary.growth.item1.title")}</h4>
                <p className="text-sm text-on-surface-variant">{t("interviewSummary.growth.item1.desc")}</p>
              </div>
              <div className="rounded-xl border-l-4 border-tertiary bg-surface-container-low p-6">
                <h4 className="mb-1 font-bold text-on-surface">{t("interviewSummary.growth.item2.title")}</h4>
                <p className="text-sm text-on-surface-variant">{t("interviewSummary.growth.item2.desc")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="group relative overflow-hidden rounded-3xl bg-primary p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-tertiary/40 via-primary to-primary opacity-50" />
          <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }} />
          <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="max-w-xl text-white">
              <h2 className="mb-4 font-headline text-3xl font-black">{t("interviewSummary.cta.title")}</h2>
              <p className="text-lg opacity-90 text-primary-fixed">{t("interviewSummary.cta.desc")}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-4">
              <button className="flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-bold text-primary shadow-xl transition-all hover:bg-surface-bright">
                <span className="material-symbols-outlined">download</span>
                {t("interviewSummary.cta.download")}
              </button>
              <button className="rounded-xl border border-white/30 bg-transparent px-8 py-4 font-bold text-white transition-all hover:bg-white/10">
                {t("interviewSummary.cta.retake")}
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-20 border-t border-outline-variant/10 px-12 py-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <span className="text-sm font-medium uppercase tracking-widest text-on-surface-variant">{t("interviewSummary.footer.poweredBy")}</span>
          <div className="flex gap-8 text-sm font-medium text-on-surface-variant">
            <Link className="transition-colors hover:text-primary" href="#">{t("footer.privacy")}</Link>
            <Link className="transition-colors hover:text-primary" href="#">{t("footer.terms")}</Link>
            <Link className="transition-colors hover:text-primary" href="#">{t("footer.support")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
