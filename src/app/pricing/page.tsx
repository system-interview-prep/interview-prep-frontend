import Link from "next/link";
import { cookies } from "next/headers";
import MarketingNav from "../../components/MarketingNav";
import PricingBillingToggle from "../../components/PricingBillingToggle";
import { getDictionary, normalizeLang } from "../../i18n/i18n";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;
  return { title: t("pricing.metaTitle") };
}

export default async function PricingPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface selection:bg-primary-container selection:text-white">
      <MarketingNav active="pricing" />

      <main className="max-w-[1440px] mx-auto px-6 sm:px-12 md:px-16 py-12 md:py-24">
        <section className="text-center mb-24">
          <h1 className="font-headline text-6xl md:text-7xl font-extrabold tracking-tighter text-on-surface mb-8 leading-tight">
            {t("pricing.hero.titleBefore")}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">
              {t("pricing.hero.titleGradient")}
            </span>
          </h1>
          <p className="text-on-surface-variant text-xl md:text-2xl max-w-2xl mx-auto mb-12 leading-relaxed">
            {t("pricing.hero.subtitle")}
          </p>
          <PricingBillingToggle />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32 items-stretch">
          <div className="bg-surface-container-lowest p-10 rounded-3xl flex flex-col border border-outline-variant/10 card-shadow">
            <div className="mb-8">
              <h3 className="font-headline text-xl font-extrabold mb-2 text-on-surface">
                {t("pricing.plan.free.name")}
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tracking-tighter text-on-surface">
                  {t("pricing.plan.free.price")}
                </span>
                <span className="text-on-surface-variant text-sm font-medium">{t("pricing.plan.free.period")}</span>
              </div>
            </div>
            <ul className="space-y-4 mb-12 flex-grow">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-xl shrink-0">check_circle</span>
                <span className="text-sm text-on-surface-variant font-medium">{t("pricing.plan.free.f1")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-xl shrink-0">check_circle</span>
                <span className="text-sm text-on-surface-variant font-medium">{t("pricing.plan.free.f2")}</span>
              </li>
              <li className="flex items-start gap-3 opacity-40">
                <span className="material-symbols-outlined text-outline text-xl shrink-0">cancel</span>
                <span className="text-sm text-outline font-medium">{t("pricing.plan.free.f3")}</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="w-full py-4 px-6 rounded-xl text-primary font-bold border-2 border-primary/10 hover:bg-surface-container-low transition-all active:scale-95 text-center"
            >
              {t("pricing.plan.free.cta")}
            </Link>
          </div>

          <div className="relative bg-surface-container-lowest p-10 rounded-3xl flex flex-col ambient-lift ring-2 ring-primary md:scale-105 z-10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black uppercase px-5 py-2 rounded-full tracking-widest shadow-lg whitespace-nowrap">
              {t("pricing.plan.pro.badge")}
            </div>
            <div className="mb-8 pt-2">
              <h3 className="font-headline text-xl font-extrabold mb-2 text-on-surface">
                {t("pricing.plan.pro.name")}
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tracking-tighter text-on-surface">
                  {t("pricing.plan.pro.price")}
                </span>
                <span className="text-on-surface-variant text-sm font-medium">{t("pricing.plan.pro.period")}</span>
              </div>
            </div>
            <ul className="space-y-4 mb-12 flex-grow">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-xl shrink-0">check_circle</span>
                <span className="text-sm text-on-surface font-bold">{t("pricing.plan.pro.f1")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-xl shrink-0">check_circle</span>
                <span className="text-sm text-on-surface font-bold">{t("pricing.plan.pro.f2")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-xl shrink-0">check_circle</span>
                <span className="text-sm text-on-surface font-bold">{t("pricing.plan.pro.f3")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-xl shrink-0">check_circle</span>
                <span className="text-sm text-on-surface font-bold">{t("pricing.plan.pro.f4")}</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-primary to-tertiary text-white font-black text-lg active:scale-95 transition-all shadow-xl shadow-primary/20 hover:opacity-90 text-center"
            >
              {t("pricing.plan.pro.cta")}
            </Link>
          </div>

          <div
            id="enterprise-plan"
            className="bg-surface-container-lowest p-10 rounded-3xl flex flex-col border border-outline-variant/10 card-shadow scroll-mt-24"
          >
            <div className="mb-8">
              <h3 className="font-headline text-xl font-extrabold mb-2 text-on-surface">
                {t("pricing.plan.enterprise.name")}
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tracking-tighter text-on-surface">
                  {t("pricing.plan.enterprise.price")}
                </span>
              </div>
            </div>
            <ul className="space-y-4 mb-12 flex-grow">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-tertiary text-xl shrink-0">check_circle</span>
                <span className="text-sm text-on-surface-variant font-medium">{t("pricing.plan.enterprise.f1")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-tertiary text-xl shrink-0">check_circle</span>
                <span className="text-sm text-on-surface-variant font-medium">{t("pricing.plan.enterprise.f2")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-tertiary text-xl shrink-0">check_circle</span>
                <span className="text-sm text-on-surface-variant font-medium">{t("pricing.plan.enterprise.f3")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-tertiary text-xl shrink-0">check_circle</span>
                <span className="text-sm text-on-surface-variant font-medium">{t("pricing.plan.enterprise.f4")}</span>
              </li>
            </ul>
            <Link
              href="#"
              className="w-full py-4 px-6 rounded-xl text-on-surface font-bold border-2 border-outline-variant/20 hover:bg-surface-container-low transition-all active:scale-95 text-center"
            >
              {t("pricing.plan.enterprise.cta")}
            </Link>
          </div>
        </section>

        <section className="mb-32">
          <h2 className="font-headline text-4xl font-extrabold mb-12 text-center tracking-tight">
            {t("pricing.table.title")}
          </h2>
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <div className="overflow-hidden rounded-3xl bg-surface-container-low border border-outline-variant/10 min-w-[min(100%,640px)]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container/50">
                    <th className="py-6 md:py-8 px-4 md:px-10 text-xs md:text-sm font-black uppercase tracking-widest text-on-surface">
                      {t("pricing.table.col.feature")}
                    </th>
                    <th className="py-6 md:py-8 px-3 md:px-10 text-xs md:text-sm font-black uppercase tracking-widest text-on-surface text-center">
                      {t("pricing.table.col.free")}
                    </th>
                    <th className="py-6 md:py-8 px-3 md:px-10 text-xs md:text-sm font-black uppercase tracking-widest text-on-surface text-center">
                      {t("pricing.table.col.pro")}
                    </th>
                    <th className="py-6 md:py-8 px-3 md:px-10 text-xs md:text-sm font-black uppercase tracking-widest text-on-surface text-center">
                      {t("pricing.table.col.enterprise")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  <tr className="hover:bg-white/40 transition-colors">
                    <td className="py-6 md:py-8 px-4 md:px-10 text-sm md:text-base font-bold text-on-surface">
                      {t("pricing.compare.chatSessions")}
                    </td>
                    <td className="py-6 md:py-8 px-3 md:px-10 text-sm md:text-base text-center font-medium text-on-surface-variant">
                      {t("pricing.compare.chatSessions.free")}
                    </td>
                    <td className="py-6 md:py-8 px-3 md:px-10 text-sm md:text-base text-center font-black text-primary">
                      {t("pricing.compare.unlimited")}
                    </td>
                    <td className="py-6 md:py-8 px-3 md:px-10 text-sm md:text-base text-center font-black text-on-surface">
                      {t("pricing.compare.unlimited")}
                    </td>
                  </tr>
                  <tr className="hover:bg-white/40 transition-colors">
                    <td className="py-6 md:py-8 px-4 md:px-10 text-sm md:text-base font-bold text-on-surface">
                      {t("pricing.compare.videoAudio")}
                    </td>
                    <td className="py-6 md:py-8 px-3 md:px-10 text-sm md:text-base text-center font-medium text-on-surface-variant">
                      {t("pricing.compare.dash")}
                    </td>
                    <td className="py-6 md:py-8 px-3 md:px-10 text-sm md:text-base text-center font-medium text-on-surface-variant">
                      {t("pricing.compare.videoAudio.pro")}
                    </td>
                    <td className="py-6 md:py-8 px-3 md:px-10 text-sm md:text-base text-center font-black text-primary">
                      {t("pricing.compare.unlimited")}
                    </td>
                  </tr>
                  <tr className="hover:bg-white/40 transition-colors">
                    <td className="py-6 md:py-8 px-4 md:px-10 text-sm md:text-base font-bold text-on-surface">
                      {t("pricing.compare.sentiment")}
                    </td>
                    <td className="py-6 md:py-8 px-3 md:px-10 text-sm md:text-base text-center font-medium text-on-surface-variant">
                      {t("pricing.compare.sentiment.free")}
                    </td>
                    <td className="py-6 md:py-8 px-3 md:px-10 text-sm md:text-base text-center font-black text-primary">
                      {t("pricing.compare.sentiment.pro")}
                    </td>
                    <td className="py-6 md:py-8 px-3 md:px-10 text-sm md:text-base text-center font-black text-tertiary">
                      {t("pricing.compare.sentiment.enterprise")}
                    </td>
                  </tr>
                  <tr className="hover:bg-white/40 transition-colors">
                    <td className="py-6 md:py-8 px-4 md:px-10 text-sm md:text-base font-bold text-on-surface">
                      {t("pricing.compare.knowledge")}
                    </td>
                    <td className="py-6 md:py-8 px-3 md:px-10 text-sm md:text-base text-center font-medium text-on-surface-variant">
                      {t("pricing.compare.dash")}
                    </td>
                    <td className="py-6 md:py-8 px-3 md:px-10 text-sm md:text-base text-center font-medium text-on-surface-variant">
                      {t("pricing.compare.dash")}
                    </td>
                    <td className="py-6 md:py-8 px-3 md:px-10 text-sm md:text-base text-center">
                      <span className="material-symbols-outlined text-tertiary font-black">check</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-white/40 transition-colors">
                    <td className="py-6 md:py-8 px-4 md:px-10 text-sm md:text-base font-bold text-on-surface">
                      {t("pricing.compare.api")}
                    </td>
                    <td className="py-6 md:py-8 px-3 md:px-10 text-sm md:text-base text-center font-medium text-on-surface-variant">
                      {t("pricing.compare.dash")}
                    </td>
                    <td className="py-6 md:py-8 px-3 md:px-10 text-sm md:text-base text-center">
                      <span className="material-symbols-outlined text-primary font-black">check</span>
                    </td>
                    <td className="py-6 md:py-8 px-3 md:px-10 text-sm md:text-base text-center">
                      <span className="material-symbols-outlined text-tertiary font-black">check</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto mb-32">
          <h2 className="font-headline text-4xl font-extrabold mb-12 text-center tracking-tight">
            {t("pricing.faq.title")}
          </h2>
          <div className="space-y-6">
            <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 card-shadow transition-all hover:border-primary/20">
              <button type="button" className="w-full flex justify-between items-center text-left gap-4">
                <span className="font-headline font-extrabold text-lg text-on-surface">{t("pricing.faq.q1")}</span>
                <span className="material-symbols-outlined text-on-surface-variant shrink-0">expand_more</span>
              </button>
              <div className="mt-4 text-on-surface-variant text-base leading-relaxed font-medium">
                {t("pricing.faq.a1")}
              </div>
            </div>
            <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 card-shadow transition-all hover:border-primary/20">
              <button type="button" className="w-full flex justify-between items-center text-left gap-4">
                <span className="font-headline font-extrabold text-lg text-on-surface">{t("pricing.faq.q2")}</span>
                <span className="material-symbols-outlined text-on-surface-variant shrink-0">expand_more</span>
              </button>
              <div className="mt-4 text-on-surface-variant text-base leading-relaxed font-medium">
                {t("pricing.faq.a2")}
              </div>
            </div>
            <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 card-shadow transition-all hover:border-primary/20">
              <button type="button" className="w-full flex justify-between items-center text-left gap-4">
                <span className="font-headline font-extrabold text-lg text-on-surface">{t("pricing.faq.q3")}</span>
                <span className="material-symbols-outlined text-on-surface-variant shrink-0">expand_more</span>
              </button>
              <div className="mt-4 text-on-surface-variant text-base leading-relaxed font-medium">
                {t("pricing.faq.a3")}
              </div>
            </div>
          </div>
        </section>

        <section className="glass-ai rounded-[3rem] p-12 md:p-20 text-center text-white mb-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-[100px] pointer-events-none" aria-hidden />
          <div className="relative z-10">
            <h2 className="font-headline text-5xl md:text-6xl font-extrabold mb-8 tracking-tighter">
              {t("pricing.bottomCta.title")}
            </h2>
            <p className="text-white/80 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
              {t("pricing.bottomCta.subtitle")}
            </p>
            <div className="flex flex-col md:flex-row justify-center gap-6">
              <Link
                href="/signup"
                className="bg-white text-tertiary px-12 py-5 rounded-2xl font-black text-lg hover:scale-105 transition-transform active:scale-95 shadow-xl text-center"
              >
                {t("pricing.bottomCta.primary")}
              </Link>
              <Link
                href="/pricing#enterprise-plan"
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-12 py-5 rounded-2xl font-black text-lg hover:bg-white/20 transition-all active:scale-95 text-center"
              >
                {t("pricing.bottomCta.secondary")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-outline-variant/20 py-12 bg-[#f7f9fb] dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 md:px-12 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0 md:space-y-0">
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div className="font-headline font-bold text-on-surface text-xl">{t("marketing.brandCurator")}</div>
            <p className="font-body text-xs text-on-surface-variant max-w-xs text-center md:text-left">
              {t("footer.copyright")}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 font-body text-xs text-on-surface-variant">
            <Link className="hover:underline transition-all" href="#">
              {t("footer.privacy")}
            </Link>
            <Link className="hover:underline transition-all" href="#">
              {t("footer.terms")}
            </Link>
            <Link className="hover:underline transition-all" href="#">
              {t("footer.cookies")}
            </Link>
            <Link className="hover:underline transition-all" href="#">
              {t("footer.security")}
            </Link>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-primary-container hover:text-white cursor-pointer transition-colors"
              aria-label="Share"
            >
              <span className="material-symbols-outlined text-sm">share</span>
            </button>
            <Link
              href="#"
              className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-primary-container hover:text-white transition-colors"
              aria-label="Email"
            >
              <span className="material-symbols-outlined text-sm">mail</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
