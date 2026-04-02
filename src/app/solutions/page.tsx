import Link from "next/link";
import { cookies } from "next/headers";
import MarketingNav from "../../components/MarketingNav";
import { getDictionary, normalizeLang } from "../../i18n/i18n";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;
  return { title: t("solutions.metaTitle") };
}

export default async function SolutionsPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      <MarketingNav active="solutions" />

      <main>
        {/* Hero */}
        <section className="relative pt-16 md:pt-24 pb-20 md:pb-32 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="z-10 min-w-0">
              <h1 className="font-headline font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tighter text-on-surface mb-6 md:mb-8 leading-[0.95]">
                {t("solutions.hero.titlePlain")}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">
                  {t("solutions.hero.titleGradient")}
                </span>
              </h1>
              <p className="text-on-surface-variant text-lg md:text-2xl leading-relaxed max-w-xl">
                {t("solutions.hero.subtitle")}
              </p>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-tertiary/10 rounded-full blur-[80px]" aria-hidden />
              <img
                className="relative w-full aspect-[4/3] object-cover rounded-[2.5rem] shadow-2xl"
                alt={t("solutions.hero.imageAlt")}
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuABcXKaH1ScYj6F1KflW16Yu9sx7C7OAwAOwZSoZChHld6w440d1c3spUevdp0y90YtEEhHPdmSRdJweqNcs3zR40GXFEFGjeQaL3R-dT2rKUh4CZk-_1AaB73nP3PqZPiQmllojGliiQv3oi4rLEIb1C9jI8q9uOh9hYJo0g_Z5no7Sz6zv76EEvB-yUf_8nx3p3BQSc73gNRGut_a9nHq5HzLWZBWuOwt5o37igVgNNOtuQbJKqtJHLQ_gALAELT9skz0LyAquppX"
              />
            </div>
          </div>
        </section>

        {/* Segments */}
        <section className="bg-surface-container-low py-16 md:py-24 px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-4 bg-surface-container-lowest p-8 md:p-10 rounded-3xl border border-outline-variant/10 shadow-sm hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between min-h-[520px] md:h-[550px]">
                <div>
                  <div className="w-16 h-16 bg-secondary-container rounded-2xl flex items-center justify-center mb-8 text-primary">
                    <span className="material-symbols-outlined text-4xl">school</span>
                  </div>
                  <h3 className="font-headline font-extrabold text-2xl text-on-surface mb-4 tracking-tight">
                    {t("solutions.segment.students.title")}
                  </h3>
                  <p className="text-on-surface-variant font-body mb-8 leading-relaxed">
                    {t("solutions.segment.students.desc")}
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3 text-sm font-semibold text-on-surface">
                      <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                      {t("solutions.segment.students.bullet1")}
                    </li>
                    <li className="flex items-center gap-3 text-sm font-semibold text-on-surface">
                      <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                      {t("solutions.segment.students.bullet2")}
                    </li>
                    <li className="flex items-center gap-3 text-sm font-semibold text-on-surface">
                      <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                      {t("solutions.segment.students.bullet3")}
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup"
                  className="text-primary font-bold flex items-center gap-2 hover:gap-4 transition-all mt-8"
                >
                  {t("solutions.segment.students.cta")}{" "}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              </div>

              <div className="md:col-span-8 bg-surface-container-lowest p-8 md:p-10 rounded-3xl border border-outline-variant/10 shadow-sm relative overflow-hidden flex flex-col md:flex-row gap-10 md:gap-12 min-h-[520px] md:min-h-[550px]">
                <div className="flex-1 z-10 flex flex-col justify-between">
                  <div>
                    <div className="w-16 h-16 bg-tertiary-fixed rounded-2xl flex items-center justify-center mb-8 text-tertiary">
                      <span className="material-symbols-outlined text-4xl">work</span>
                    </div>
                    <h3 className="font-headline font-extrabold text-2xl md:text-3xl text-on-surface mb-4 tracking-tight">
                      {t("solutions.segment.seekers.title")}
                    </h3>
                    <p className="text-on-surface-variant font-body mb-8 leading-relaxed">
                      {t("solutions.segment.seekers.desc")}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                      <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/5">
                        <p className="text-[10px] font-extrabold text-tertiary uppercase tracking-widest mb-1">
                          {t("solutions.segment.seekers.technical")}
                        </p>
                        <p className="text-sm font-bold text-on-surface">
                          {t("solutions.segment.seekers.technicalDesc")}
                        </p>
                      </div>
                      <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/5">
                        <p className="text-[10px] font-extrabold text-tertiary uppercase tracking-widest mb-1">
                          {t("solutions.segment.seekers.visual")}
                        </p>
                        <p className="text-sm font-bold text-on-surface">
                          {t("solutions.segment.seekers.visualDesc")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/interview"
                    className="ai-gradient-button text-white px-8 py-4 rounded-xl font-bold w-fit shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all text-center"
                  >
                    {t("solutions.segment.seekers.cta")}
                  </Link>
                </div>
                <div className="flex-1 relative hidden lg:block overflow-hidden rounded-[2rem] min-h-[280px]">
                  <img
                    className="absolute inset-0 w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                    alt={t("solutions.segment.seekers.imageAlt")}
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdkUzljEwa44K68YXUWnACxojZ_konXfOgCqK-CPB3JRwnVWfwKKrKRLpHintUBdfMoHggbuYnQ-iLyhrTWWpA1jzaj4b3mMQVlYCKI_UHNJBjD65GFm9c0w3jepWDQb3KU0p18emEHKEPWPVjt0PHxxTkVOP3bMKwkhameznY4cCC8QKDVTMW-ZYqXcWk9yzqXfU1llWXL7Ll2Q5pEc7oQw_AFY1HZfhe22Wh3yVWCL1llUZv9ZTL9gaVA1HdeMDZr5UzjASjt2-0"
                  />
                </div>
              </div>

              <div className="md:col-span-12 bg-inverse-surface text-inverse-on-surface p-8 md:p-12 rounded-3xl flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-tertiary/20 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none" aria-hidden />
                <div className="lg:w-1/2 relative z-10">
                  <span className="inline-block px-4 py-1 bg-tertiary rounded-full text-[10px] font-extrabold tracking-widest uppercase mb-8">
                    {t("solutions.segment.professionals.badge")}
                  </span>
                  <h3 className="font-headline font-extrabold text-3xl md:text-4xl lg:text-5xl mb-6 leading-tight tracking-tighter">
                    {t("solutions.segment.professionals.title")}
                  </h3>
                  <p className="text-surface-variant font-body text-lg mb-10 leading-relaxed max-w-xl">
                    {t("solutions.segment.professionals.desc")}
                  </p>
                  <div className="flex gap-12 md:gap-16 flex-wrap">
                    <div className="flex flex-col gap-1">
                      <span className="text-3xl md:text-4xl font-extrabold text-tertiary-fixed tracking-tight">
                        {t("solutions.segment.professionals.stat1Value")}
                      </span>
                      <span className="text-sm font-semibold text-surface-variant/70 uppercase tracking-widest">
                        {t("solutions.segment.professionals.stat1Label")}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-3xl md:text-4xl font-extrabold text-tertiary-fixed tracking-tight">
                        {t("solutions.segment.professionals.stat2Value")}
                      </span>
                      <span className="text-sm font-semibold text-surface-variant/70 uppercase tracking-widest">
                        {t("solutions.segment.professionals.stat2Label")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="lg:w-1/3 w-full max-w-sm aspect-square relative z-10 mx-auto lg:mx-0">
                  <div className="w-full h-full rounded-full overflow-hidden border-[12px] border-white/5 shadow-2xl">
                    <img
                      className="w-full h-full object-cover"
                      alt={t("solutions.segment.professionals.imageAlt")}
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCC_qpXtjE6HHrDBIQ5ANb8Ri1NoIB6iSqEhTdxf31dz-XCbEC_deU7c-Eh-aG2ndIGMthBsLc0AEqPXGpVZ30vt_60r11jevTFacFfpEhzu0f-UMTl-p7ZGrSZnwCC3iNbjCO28bU5iuk7R29GUww5Xv8y9-Ude69m0esuuiyojnMnvaNn6IE_Q3T1lAekWYQh9fgrxuc2EgnwsvUsH08qNv7eqWDV7Vl3wMcwzUNPrtQ6DaszcxNmFO5gs3kCU9hLOibjC0-DR9Vn"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Modalities */}
        <section className="px-6 md:px-12 py-20 md:py-32 max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-20">
            <h2 className="font-headline font-extrabold text-3xl md:text-4xl lg:text-5xl text-on-surface mb-6 tracking-tighter">
              {t("solutions.modalities.title")}
            </h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              {t("solutions.modalities.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="group bg-surface-container-lowest p-8 md:p-10 rounded-3xl border border-outline-variant/10 shadow-sm hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-secondary-container rounded-2xl flex items-center justify-center mb-8 text-primary transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-4xl">forum</span>
              </div>
              <h4 className="font-headline font-extrabold text-xl md:text-2xl mb-4 tracking-tight">
                {t("solutions.modalities.chat.title")}
              </h4>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
                {t("solutions.modalities.chat.desc")}
              </p>
              <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary w-1/3 transition-all duration-700 group-hover:w-full" />
              </div>
            </div>
            <div className="group bg-surface-container-lowest p-8 md:p-10 rounded-3xl border border-outline-variant/10 shadow-sm hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-tertiary-fixed rounded-2xl flex items-center justify-center mb-8 text-tertiary transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-4xl">call</span>
              </div>
              <h4 className="font-headline font-extrabold text-xl md:text-2xl mb-4 tracking-tight">
                {t("solutions.modalities.voice.title")}
              </h4>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
                {t("solutions.modalities.voice.desc")}
              </p>
              <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-tertiary w-1/3 transition-all duration-700 group-hover:w-full" />
              </div>
            </div>
            <div className="group bg-surface-container-lowest p-8 md:p-10 rounded-3xl border border-outline-variant/10 shadow-sm hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center mb-8 text-primary transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-4xl">videocam</span>
              </div>
              <h4 className="font-headline font-extrabold text-xl md:text-2xl mb-4 tracking-tight">
                {t("solutions.modalities.video.title")}
              </h4>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
                {t("solutions.modalities.video.desc")}
              </p>
              <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary-container w-1/3 transition-all duration-700 group-hover:w-full" />
              </div>
            </div>
          </div>
        </section>

        {/* Editorial */}
        <section className="px-6 md:px-12 py-16 md:py-24 max-w-7xl mx-auto">
          <div className="bg-surface-container-low flex flex-col md:flex-row items-stretch rounded-[3rem] overflow-hidden shadow-sm border border-outline-variant/10">
            <div className="md:w-1/2 p-8 md:p-16">
              <div className="flex items-center gap-3 mb-8 text-tertiary">
                <span className="material-symbols-outlined font-bold text-xl">auto_awesome</span>
                <span className="font-bold tracking-widest uppercase text-[10px]">
                  {t("solutions.editorial.badge")}
                </span>
              </div>
              <h2 className="font-headline font-extrabold text-3xl md:text-4xl lg:text-5xl text-on-surface mb-8 leading-tight tracking-tighter">
                {t("solutions.editorial.title")}
              </h2>
              <p className="text-on-surface-variant text-lg md:text-xl mb-10 md:mb-12 leading-relaxed">
                {t("solutions.editorial.desc")}
              </p>
              <div className="space-y-8 md:space-y-10">
                <div className="flex gap-6">
                  <span className="text-3xl md:text-4xl font-headline font-black text-outline-variant/30 shrink-0">
                    01
                  </span>
                  <div>
                    <h4 className="text-lg md:text-xl font-extrabold mb-2 tracking-tight text-on-surface">
                      {t("solutions.editorial.feature1Title")}
                    </h4>
                    <p className="text-on-surface-variant">{t("solutions.editorial.feature1Desc")}</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <span className="text-3xl md:text-4xl font-headline font-black text-outline-variant/30 shrink-0">
                    02
                  </span>
                  <div>
                    <h4 className="text-lg md:text-xl font-extrabold mb-2 tracking-tight text-on-surface">
                      {t("solutions.editorial.feature2Title")}
                    </h4>
                    <p className="text-on-surface-variant">{t("solutions.editorial.feature2Desc")}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 relative min-h-[320px] md:min-h-[500px]">
              <img
                className="absolute inset-0 w-full h-full object-cover"
                alt={t("solutions.editorial.imageAlt")}
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVXhopRPpRMlOS-kioFNj0TeRs2ucd1HYA23Am4P6beZxpC20po1m3348Y5sd_H_y3hpGEABPFh_9o_wXepAh8EZ8ykQ8M_33hdWa-RkatGtnhHCdkSvWIz_xEqwJ19AnuN-NohucO6mB8ZS0SOaqguQbpx_1BFHM58mK4yLcJ6mt3ISyCCL4sq1uqFXywzX29fUXV6G6mhYRgWWIl-5gmDs_a4VRZwkvHDOR7E6abP5RS8R_d-3Q3rAMhFnn4UgSiQ9Rmurwf11jM"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-surface-container-low to-transparent hidden md:block" />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 md:py-32 px-6 md:px-12">
          <div className="max-w-5xl mx-auto bg-[#7029e1] rounded-[3rem] p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" aria-hidden />
            <div className="relative z-10">
              <h2 className="font-headline text-3xl md:text-5xl font-extrabold mb-6 md:mb-8 tracking-tighter">
                {t("solutions.cta.title")}
              </h2>
              <p className="text-white/80 text-lg md:text-xl mb-10 md:mb-12 max-w-xl mx-auto leading-relaxed">
                {t("solutions.cta.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link
                  href="/signup"
                  className="bg-white text-tertiary px-10 py-5 rounded-2xl font-black text-lg hover:scale-105 transition-transform active:scale-95 shadow-xl"
                >
                  {t("solutions.cta.primary")}
                </Link>
                <Link
                  href="/pricing"
                  className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-white/20 transition-all"
                >
                  {t("solutions.cta.secondary")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-[#c3c6d6]/20 py-12 bg-[#f7f9fb]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0 md:space-y-0">
          <div className="flex flex-col items-center md:items-start space-y-4 text-center md:text-left">
            <div className="font-headline font-bold text-[#191c1e] text-xl">Curator AI</div>
            <p className="font-body text-xs text-[#434654] max-w-xs">{t("footer.copyright")}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 font-body text-xs text-[#434654]">
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
              className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-[#434654] hover:bg-primary-container hover:text-white cursor-pointer transition-colors"
              aria-label="Share"
            >
              <span className="material-symbols-outlined text-sm">share</span>
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-[#434654] hover:bg-primary-container hover:text-white cursor-pointer transition-colors"
              aria-label="Email"
            >
              <span className="material-symbols-outlined text-sm">mail</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
