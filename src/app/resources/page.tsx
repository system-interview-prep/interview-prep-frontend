import Link from "next/link";
import { cookies } from "next/headers";
import AnimateOnScroll from "../../components/AnimateOnScroll";
import MarketingNav from "../../components/MarketingNav";
import { getDictionary, normalizeLang } from "../../i18n/i18n";

const IMG_FEATURED =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDXoCOS_twzzlMYHg4-IaOzf3ANeZyeV8j1apXKMZHnYhUUiBBmP0M-r7IxuX3r5YcILssY2U0MqQ2MKcoq0X4PiQ4qpxqwarZ7pnMJ2yI5fHndbS9EbTugXZj6pWPDbcq1UHO1wwbUMVIYyN2_YLUGNeCQVgF-nCOf6-XNSQMS25BvZ0NhqDOi99P-VPydWm8HhXPLi6ZBQaMS7MJ6EgHT1r50HhQ4YNBbVLOhV28jZ7C_08M7BE09GFg2VAPZ-GlqvLsiescdH2_e";

const IMG_ARTICLE_1 =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD7QgcYeFcvKrugc_0mftnTmEk_rLkwpufGAXCI1iOhuCtnaM98H6U_d7aLW_chfQ4gWCgeXugfNA54Z_JEp60lPUSoAJI85o8fIeBZlg2CQA8es4o_zY_5oHRC-YcyfuhccT9KZC9LrV1wIWDgVNi2SldZxtQicUIwYKku0O4-aH3y8GFZCDYlP8b0MVAeX8NooSCANdEZwp61Om583fm-kYpboVCkfQ6r-NiKjmxT_k_qE83p43a2BZQZ8hrqrLU_OW1-pz-TNSEG";

const IMG_ARTICLE_2 =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCq5OCiM2Z7QHMMXXEVr_dDvyY0ryvcn5-XYqH0186GTfm2iczKXjlKGdag5QQqhx7N_UFCjpIjLWosmdIXMALRgNwogm_FKfr8A26HNV_NLNGaZudVhRPhgMpb9IgVl_wG0pw20fU__yUXJ6pSxw0N-Rn0ASvTtaJeBH2QHR-ACnJBhwqVwiteNkpB8sHSTqnfZqWYauWfQlHBrQ8c87fQ5FaK2VKs9fhyRxQqt5T4SgcN9H-2IQDYhDsc_kojLzb9PkAuPB-7K97f";

const IMG_ARTICLE_3 =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCgE3WnFxuYHt59DdqETdQ8EMgM5ZEA6ulc-FAqMp0epjid6aYoHQgvDHOPlNVqkCzwKvcPlYeexvpIDC4_KowFEd0l7MqPMKp9TuNKVBR7nBOJpbMY4D31Rnq8Krsngs4uT1vwSRYdy7VASQ9q53o7ePKEBIsynqXHxvsjZrEPhbMCWWGqKPYwmMo4W7e2vp14ILaLQ4KqMPY6UMCxu8tstlimZAGhvusj0wdSJN_4CxwEMvl5Cs2TtzE24-rfGshhQ5jZWG_xxxJ2";

const ARTICLE_DELAYS: Record<"a1" | "a2" | "a3", number> = {
  a1: 0,
  a2: 150,
  a3: 300,
};

export async function generateMetadata() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;
  return { title: t("resources.metaTitle") };
}

export default async function ResourcesPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface antialiased">
      <MarketingNav active="resources" />

      <main>
        <section className="relative overflow-hidden bg-surface py-24 md:py-32">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-tertiary-container to-transparent blur-3xl hero-bg-animate" />
          </div>
          <div className="max-w-screen-2xl mx-auto px-6 sm:px-12 md:px-16 relative z-10">
            <div className="max-w-3xl">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-extrabold text-on-surface tracking-tight leading-tight mb-6">
                {t("resources.hero.titleBefore")}
                <span className="text-primary italic">{t("resources.hero.titleAccent")}</span>
                {t("resources.hero.titleAfter")}
              </h1>
              <p className="text-lg md:text-xl text-on-surface-variant font-body mb-10 leading-relaxed">
                {t("resources.hero.subtitle")}
              </p>
              <div className="relative max-w-xl group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none group-focus-within:text-primary transition-colors">
                  search
                </span>
                <input
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-surface-tint focus:bg-surface-container-lowest transition-all placeholder:text-outline text-on-surface"
                  placeholder={t("resources.hero.searchPlaceholder")}
                  type="text"
                  name="q"
                  aria-label={t("resources.hero.searchPlaceholder")}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-surface-container-low">
          <div className="max-w-screen-2xl mx-auto px-6 sm:px-12 md:px-16">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-12">
              <div>
                <h2 className="text-2xl md:text-3xl font-headline font-bold text-on-surface mb-2">
                  {t("resources.featured.sectionTitle")}
                </h2>
                <p className="text-base md:text-lg text-on-surface-variant">
                  {t("resources.featured.sectionSubtitle")}
                </p>
              </div>
              <Link
                className="text-primary font-semibold flex items-center gap-2 group shrink-0"
                href="#"
              >
                {t("resources.featured.viewAll")}
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-8 group relative overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-64 sm:h-72 md:h-80 w-full bg-slate-200 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={t("resources.featured.main.imgAlt")}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                    src={IMG_FEATURED}
                  />
                </div>
                <div className="p-8">
                  <span className="inline-block px-3 py-1 rounded-full bg-primary-container/10 text-primary text-xs font-bold mb-4 uppercase tracking-wider">
                    {t("resources.featured.main.badge")}
                  </span>
                  <h3 className="text-2xl font-headline font-bold mb-3 text-on-surface group-hover:text-primary transition-colors">
                    {t("resources.featured.main.title")}
                  </h3>
                  <p className="text-on-surface-variant mb-6 max-w-2xl">{t("resources.featured.main.desc")}</p>
                  <Link
                    href="#"
                    className="text-primary font-bold inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    {t("resources.featured.main.cta")}
                    <span className="material-symbols-outlined transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      north_east
                    </span>
                  </Link>
                </div>
              </div>
              <div className="md:col-span-4 flex flex-col gap-8">
                <div className="glass-card flex-1 rounded-xl p-8 border border-outline-variant/20 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-lg bg-tertiary-container flex items-center justify-center text-on-tertiary mb-6 transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined">insights</span>
                  </div>
                  <h3 className="text-xl font-headline font-bold mb-3 group-hover:text-tertiary transition-colors">
                    {t("resources.featured.insights.title")}
                  </h3>
                  <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                    {t("resources.featured.insights.desc")}
                  </p>
                  <Link href="#" className="text-tertiary font-bold text-sm inline-flex items-center gap-1">
                    {t("resources.featured.insights.cta")}
                    <span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100 transition-all">
                      arrow_forward
                    </span>
                  </Link>
                </div>
                <div className="bg-surface-container-lowest flex-1 rounded-xl p-8 border border-outline-variant/20 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-on-primary mb-6 transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined">folder_shared</span>
                  </div>
                  <h3 className="text-xl font-headline font-bold mb-3 group-hover:text-primary transition-colors">
                    {t("resources.featured.cases.title")}
                  </h3>
                  <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                    {t("resources.featured.cases.desc")}
                  </p>
                  <Link href="#" className="text-primary font-bold text-sm inline-flex items-center gap-1">
                    {t("resources.featured.cases.cta")}
                    <span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100 transition-all">
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-surface">
          <div className="max-w-screen-2xl mx-auto px-6 sm:px-12 md:px-16">
            <h2 className="text-2xl md:text-3xl font-headline font-bold text-on-surface mb-12">
              {t("resources.articles.title")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {(["a1", "a2", "a3"] as const).map((key) => {
                const img = key === "a1" ? IMG_ARTICLE_1 : key === "a2" ? IMG_ARTICLE_2 : IMG_ARTICLE_3;
                return (
                  <AnimateOnScroll
                    key={key}
                    className="flex flex-col group"
                    delayMs={ARTICLE_DELAYS[key]}
                  >
                    <div className="aspect-video w-full rounded-xl overflow-hidden mb-6 shadow-sm group-hover:shadow-lg transition-all duration-300 bg-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={t(`resources.articles.${key}.imgAlt`)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src={img}
                      />
                    </div>
                    <time className="text-xs font-bold text-outline uppercase tracking-widest mb-3">
                      {t(`resources.articles.${key}.date`)}
                    </time>
                    <h4 className="text-xl font-headline font-bold mb-3 text-on-surface group-hover:text-primary transition-colors cursor-pointer">
                      <Link href="#">{t(`resources.articles.${key}.title`)}</Link>
                    </h4>
                    <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
                      {t(`resources.articles.${key}.excerpt`)}
                    </p>
                    <div className="flex items-center gap-3 mt-auto">
                      <div className="w-8 h-8 rounded-full bg-slate-300 shrink-0" aria-hidden />
                      <span className="text-sm font-semibold text-on-surface">{t(`resources.articles.${key}.author`)}</span>
                    </div>
                  </AnimateOnScroll>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-24 bg-surface-container">
          <div className="max-w-screen-2xl mx-auto px-6 sm:px-12 md:px-16">
            <AnimateOnScroll className="bg-surface-container-lowest rounded-2xl p-8 md:p-12 lg:p-16 flex flex-col md:flex-row items-center gap-12 md:gap-16 relative overflow-hidden border border-outline-variant/10">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-tertiary-container/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex-1 relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex -space-x-2" aria-hidden>
                    <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-slate-300" />
                    <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-slate-400" />
                    <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-slate-500" />
                  </div>
                  <span className="text-sm font-medium text-tertiary font-label">{t("resources.community.badge")}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-headline font-bold mb-6 text-on-surface">
                  {t("resources.community.title")}
                </h2>
                <p className="text-on-surface-variant mb-8 leading-relaxed max-w-lg">
                  {t("resources.community.desc")}
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    className="ai-gradient-bg text-on-primary px-8 py-4 rounded-xl font-bold transition-all hover:brightness-110 active:scale-95 shadow-md hover:shadow-lg"
                  >
                    {t("resources.community.ctaForums")}
                  </button>
                  <button
                    type="button"
                    className="px-8 py-4 border border-outline-variant rounded-xl font-bold text-on-surface hover:bg-surface-variant transition-colors"
                  >
                    {t("resources.community.ctaCalendar")}
                  </button>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4 w-full relative z-10">
                {(
                  [
                    { icon: "groups", k: "tile1" },
                    { icon: "campaign", k: "tile2" },
                    { icon: "psychology", k: "tile3" },
                    { icon: "verified", k: "tile4" },
                  ] as const
                ).map(({ icon, k }) => (
                  <div
                    key={k}
                    className="p-6 bg-surface-container-low rounded-xl hover:bg-surface-container-high transition-colors cursor-default"
                  >
                    <span className="material-symbols-outlined text-tertiary mb-3">{icon}</span>
                    <h5 className="font-bold mb-1 text-on-surface">{t(`resources.community.${k}.title`)}</h5>
                    <p className="text-xs text-on-surface-variant">{t(`resources.community.${k}.desc`)}</p>
                  </div>
                ))}
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        <section className="py-24 px-6 sm:px-12 md:px-16">
          <div className="max-w-screen-2xl mx-auto">
            <AnimateOnScroll className="ai-gradient-bg rounded-[2rem] p-10 md:p-16 lg:p-24 text-center relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                  backgroundSize: "40px 40px",
                }}
              />
              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-headline font-extrabold text-on-primary mb-8 tracking-tight">
                  {t("resources.cta.title")}
                </h2>
                <p className="text-lg md:text-xl text-on-primary-container mb-12 font-body opacity-90">
                  {t("resources.cta.subtitle")}
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <Link
                    href="/signup"
                    className="bg-surface-container-lowest text-primary px-10 py-5 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 text-center"
                  >
                    {t("resources.cta.primary")}
                  </Link>
                  <Link
                    href="#"
                    className="backdrop-blur-md bg-white/10 text-on-primary px-10 py-5 rounded-xl font-bold text-lg border border-white/20 hover:bg-white/20 transition-all active:scale-95 text-center"
                  >
                    {t("resources.cta.secondary")}
                  </Link>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-outline-variant/20 py-12 bg-[#f7f9fb] dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 md:px-12 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0">
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div className="font-headline font-bold text-on-surface text-xl dark:text-slate-100">
              {t("marketing.brandCurator")}
            </div>
            <p className="font-body text-xs text-on-surface-variant max-w-xs text-center md:text-left dark:text-slate-500">
              {t("footer.copyright")}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 font-body text-xs text-on-surface-variant dark:text-slate-500">
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
