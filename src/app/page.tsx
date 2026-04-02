import Link from "next/link";
import MarketingNav from "../components/MarketingNav";
import { cookies } from "next/headers";
import { getDictionary, normalizeLang } from "../i18n/i18n";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;

  return (
    <div className="bg-surface font-body text-on-surface">
      <MarketingNav active="platform" />

      <main>
        <section className="relative pt-24 pb-32 px-12 max-w-7xl mx-auto overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="z-10">
              <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest text-on-tertiary-fixed bg-tertiary-fixed rounded-full uppercase">
                {t("landing.badge")}
              </span>
              <h1 className="font-headline text-6xl md:text-7xl font-extrabold tracking-tighter text-on-surface mb-8 leading-[0.95]">
                {t("landing.hero.titleA")}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">
                  {t("landing.hero.titleB")}
                </span>
              </h1>
              <p className="text-on-surface-variant text-xl md:text-2xl mb-10 max-w-xl leading-relaxed">
                {t("landing.hero.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  className="bg-gradient-to-r from-primary to-tertiary text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 active:scale-95 transition-transform text-center"
                  href="/signup"
                >
                  {t("landing.hero.ctaPrimary")}
                </Link>
                <Link
                  href="/demo"
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg text-primary border border-outline-variant/20 hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined">play_circle</span>
                  {t("landing.hero.ctaSecondary")}
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-20 -right-20 w-96 h-96 bg-tertiary/10 rounded-full blur-[100px]"></div>
              <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px]"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-surface-container-lowest p-4 rounded-3xl shadow-sm border border-outline-variant/10">
                    <img
                      className="w-full h-48 object-cover rounded-2xl mb-4"
                      alt="professional woman smiling confidently during a video conference in a modern brightly lit office space"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSqeZrQ5uHSHv6d5S2vpVcmrwqjmhKFNQdXpQ4HPTY3VEAtWvriz08FNoWklZV9T3hEW9C8MGNhVHjbVyLTZGwpNgq16MsF9NOB-qWuQt90yBjuGGwTZeeXb22wRm_SV5J5xoHp1EM5lWcybbPVcaNEJ0RKKCl3l0dKghyy-9ItOvRr2upWRkmJsZsPSoGzEJP_Ztk7M4-hoUSj712dyak0r-5gEHFRbblgFUx5HOrsPnvbQ1Aq6NxPMmoMVtsciZEe6LgJDXyMzHr"
                    />
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <span className="material-symbols-outlined ai-pulse">
                        videocam
                      </span>
                      <span className="text-sm">{t("landing.hero.card.liveVideoMode")}</span>
                    </div>
                  </div>
                  <div className="bg-primary text-white p-6 rounded-3xl h-40 flex flex-col justify-end">
                    <p className="font-headline font-bold text-lg">{t("landing.hero.card.accuracy")}</p>
                    <p className="text-xs opacity-70">
                      {t("landing.hero.card.sentimentEngine")}
                    </p>
                  </div>
                </div>
                <div className="pt-12 space-y-4">
                  <div className="bg-surface-container-low p-6 rounded-3xl h-56 border border-outline-variant/10 flex flex-col justify-center">
                    <div className="flex gap-1 mb-4">
                      <div className="w-1 h-8 bg-tertiary rounded-full"></div>
                      <div className="w-1 h-12 bg-tertiary rounded-full"></div>
                      <div className="w-1 h-6 bg-tertiary rounded-full"></div>
                      <div className="w-1 h-10 bg-tertiary rounded-full"></div>
                    </div>
                    <p className="text-on-surface font-bold">
                      {t("landing.hero.card.voiceTranscription.title")}
                    </p>
                    <p className="text-sm text-on-surface-variant">
                      {t("landing.hero.card.voiceTranscription.desc")}
                    </p>
                  </div>
                  <div className="bg-surface-container-lowest p-4 rounded-3xl shadow-sm border border-outline-variant/10 overflow-hidden">
                    <img
                      className="w-full h-32 object-cover rounded-2xl"
                      alt="close up of a high tech computer screen showing abstract data visualization and ai neural network connections"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDedDBH3BHTRJY2TjzV4DCjdqeSXLUKtz3J-zlomUXtVBNF3wCQ8hR31jhexfbGZ_-f3hQs3EAVHFWpqcVkHtW4MCv4pDA49wk2n_Mgr7t-2LLmxtb8iJJA43HN9ypTdzJZqtLkvvluHsmSPzaFTfCIqrcUhTKtVNpsBjeTi5lJeUHhWndRu91bO9IJKd7p3DGbbO4jpU5USfZX42IUSWYLatM8mfdkAdR_6pQrhueLc-_UcqDY20-vZnYkLFUpH6YGqFUdRHHD85xu"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-low py-24">
          <div className="max-w-7xl mx-auto px-12">
            <div className="mb-16 text-center">
              <h2 className="font-headline text-4xl font-extrabold mb-4">
                {t("landing.section.modes.title")}
              </h2>
              <p className="text-on-surface-variant max-w-2xl mx-auto">
                {t("landing.section.modes.subtitle")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="group bg-surface-container-lowest p-8 rounded-3xl hover:translate-y-[-8px] transition-all duration-300">
                <div className="w-16 h-16 bg-secondary-container rounded-2xl flex items-center justify-center mb-6 text-primary">
                  <span className="material-symbols-outlined text-4xl">
                    forum
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-3">{t("landing.mode.chat.title")}</h3>
                <p className="text-on-surface-variant mb-6">
                  {t("landing.mode.chat.desc")}
                </p>
                <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-1/3 transition-all duration-700 group-hover:w-full"></div>
                </div>
              </div>

              <div className="group bg-surface-container-lowest p-8 rounded-3xl hover:translate-y-[-8px] transition-all duration-300">
                <div className="w-16 h-16 bg-tertiary-fixed rounded-2xl flex items-center justify-center mb-6 text-tertiary">
                  <span className="material-symbols-outlined text-4xl">
                    call
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-3">{t("landing.mode.voice.title")}</h3>
                <p className="text-on-surface-variant mb-6">
                  {t("landing.mode.voice.desc")}
                </p>
                <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary w-1/3 transition-all duration-700 group-hover:w-full"></div>
                </div>
              </div>

              <div className="group bg-surface-container-lowest p-8 rounded-3xl hover:translate-y-[-8px] transition-all duration-300">
                <div className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center mb-6 text-primary">
                  <span className="material-symbols-outlined text-4xl">
                    videocam
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-3">{t("landing.mode.video.title")}</h3>
                <p className="text-on-surface-variant mb-6">
                  {t("landing.mode.video.desc")}
                </p>
                <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary-container w-1/3 transition-all duration-700 group-hover:w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-12 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <img
                className="rounded-[2.5rem] shadow-2xl"
                alt="minimalist modern office interior with large windows and clean workspace featuring a sleek laptop on a wooden desk"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDltl6LOsClo0AdcojJaHxuNwxG8GYZlP7_y2Kex87P5hPvtACBWHVZB-R9bi6DpRdSV9FSdVj9rlD8g9lcTm02JqnWj7fxPcFtQnwkQ7YnzFl6Vmbkac53T7vAsibxbmKOG3NdZPVk-5sy5aN8l0jmoQe9vgz_5HCob8oiKW5ygPn4JCCAsMLHpIym2hVlrg87Zg_SOV3DdrB4EcbGE6kdOMTB99og3d-V1fi0j7WV9XMyJACpxYvZEznpNp3piOxH5i_SECq7Dqjo"
              />
            </div>
            <div className="lg:w-1/2 space-y-12">
              <div>
                <h2 className="font-headline text-5xl font-extrabold mb-6">
                  {t("landing.section.how.title")}
                </h2>
                <p className="text-xl text-on-surface-variant leading-relaxed">
                  {t("landing.section.how.subtitle")}
                </p>
              </div>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <span className="text-4xl font-headline font-black text-outline-variant/30">
                    01
                  </span>
                  <div>
                    <h4 className="text-xl font-bold mb-2">
                      {t("landing.how.step1.title")}
                    </h4>
                    <p className="text-on-surface-variant">
                      {t("landing.how.step1.desc")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <span className="text-4xl font-headline font-black text-outline-variant/30">
                    02
                  </span>
                  <div>
                    <h4 className="text-xl font-bold mb-2">
                      {t("landing.how.step2.title")}
                    </h4>
                    <p className="text-on-surface-variant">
                      {t("landing.how.step2.desc")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <span className="text-4xl font-headline font-black text-outline-variant/30">
                    03
                  </span>
                  <div>
                    <h4 className="text-xl font-bold mb-2">{t("landing.how.step3.title")}</h4>
                    <p className="text-on-surface-variant">
                      {t("landing.how.step3.desc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface-dim/20 py-24">
          <div className="max-w-7xl mx-auto px-12">
            <h2 className="font-headline text-3xl font-bold mb-12 text-center">
              {t("landing.section.testimonials.title")}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10">
                <div className="flex gap-1 text-tertiary mb-4">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                </div>
                <p className="italic text-on-surface mb-6">
                  {t("landing.testimonials.quote1")}
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-fixed overflow-hidden">
                    <img
                      className="w-full h-full object-cover"
                      alt="portrait of a confident man with short hair wearing a professional navy blue shirt"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFe8SRdQXrbOy3Y7zHT7QAkJUHMOwPhB3_ILdGTJWrr-j0qc_9J0kAD0Tj1VATbA3Ds9r-26i6_HSIZ0M5piYPyHeVpsoGPvnPF2R1L4UsingSY3wBIay2U89-pvD6qUPBMbX-dCxYdOlrTHieXa2UmV5mB2LY6LfuR3-Sy48lGz0VygxnBX6lUGcwKDaoP6SDC0i0EjOl4ig7edEgvn_xvznHBT6nVd-JvFc3jvbrLGNbK1T2JarA5u67nPUb0mUrxaXTO8j5a9OQ"
                    />
                  </div>
                  <div>
                    <p className="font-bold">{t("landing.testimonials.person1.name")}</p>
                    <p className="text-xs text-on-surface-variant">
                      {t("landing.testimonials.person1.role")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10">
                <div className="flex gap-1 text-tertiary mb-4">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                </div>
                <p className="italic text-on-surface mb-6">
                  {t("landing.testimonials.quote2")}
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary-fixed overflow-hidden">
                    <img
                      className="w-full h-full object-cover"
                      alt="close up headshot of a smiling woman with long dark hair in a professional studio setting"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6v0u4dXiMcG4uoy57zQbNUridLNjOQHyHwuhS4zUhVRfLIng6elWlB1sSMmGzuSGQv-edIMynHdEhn8WmdAzh_tr8Ef4R40Nrr_X5JesKrt_6y1j9SRgQg7wifBTUtGUwsjJm5rJmXrQx_oPxDXGVRSIljZ2ZPIOVXCnQ1rd9fBkz3A44ZPn9yoy8-GuuWP7fKUfpJo3dIbqhOtstUY1b8uZhECK9IH5wipnWnkQUR4gskOQnfd6ZHVzsuPEsb-lz1JFKj2FcJZeN"
                    />
                  </div>
                  <div>
                    <p className="font-bold">{t("landing.testimonials.person2.name")}</p>
                    <p className="text-xs text-on-surface-variant">
                      {t("landing.testimonials.person2.role")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10">
                <div className="flex gap-1 text-tertiary mb-4">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                </div>
                <p className="italic text-on-surface mb-6">
                  {t("landing.testimonials.quote3")}
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-tertiary-fixed overflow-hidden">
                    <img
                      className="w-full h-full object-cover"
                      alt="professional man in his thirties with glasses and a friendly expression in a modern office background"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYecQ0JpKYG-mIn5LMHRgfLTm3GjWz3T7NrxYOUsfe3o0Z9XnvXLUr5B6GE5-KftETiey8q-q-oMnxCrg1oANdDnlEZ7KZHdyIbPLF5Rp75G09SyFAExewLeEZXAic-rDfBRHIO6e30pL0Dq_LEFbg5SHHDJ_Y_mQ9UAs1rq8iBY0mbMV8P9q1t5t7Uw20a8oJsfclm2Dc0cr_XF1b_GMzlDr-Df9fPR_1dqfwGPH5ufSKKUUPVRW-NXyBW6hlwzLEd9JOkDIKjmXG"
                    />
                  </div>
                  <div>
                    <p className="font-bold">{t("landing.testimonials.person3.name")}</p>
                    <p className="text-xs text-on-surface-variant">
                      {t("landing.testimonials.person3.role")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-12">
          <div className="max-w-5xl mx-auto bg-[#7029e1] rounded-[3rem] p-16 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="relative z-10">
              <h2 className="font-headline text-5xl font-extrabold mb-8 tracking-tighter">
                {t("landing.section.cta.title")}
              </h2>
              <p className="text-white/80 text-xl mb-12 max-w-xl mx-auto">
                {t("landing.section.cta.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link
                  className="bg-white text-tertiary px-10 py-5 rounded-2xl font-black text-lg hover:scale-105 transition-transform active:scale-95 shadow-xl text-center"
                  href="/signup"
                >
                  {t("landing.section.cta.primary")}
                </Link>
                <Link
                  href="/pricing"
                  className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-white/20 transition-all text-center"
                >
                  {t("landing.section.cta.secondary")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-[#c3c6d6]/20 py-12 bg-[#f7f9fb] dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-12 flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div className="font-manrope font-bold text-[#191c1e] text-xl">
              Curator AI
            </div>
            <p className="font-inter text-xs text-[#434654] dark:text-slate-500 max-w-xs text-center md:text-left">
              {t("footer.copyright")}
            </p>
          </div>
          <div className="flex gap-8 font-inter text-xs text-[#434654] dark:text-slate-500">
            <a className="hover:underline transition-all" href="#">
              {t("footer.privacy")}
            </a>
            <a className="hover:underline transition-all" href="#">
              {t("footer.terms")}
            </a>
            <a className="hover:underline transition-all" href="#">
              {t("footer.cookies")}
            </a>
            <a className="hover:underline transition-all" href="#">
              {t("footer.security")}
            </a>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-[#434654] hover:bg-primary-container hover:text-white cursor-pointer transition-colors">
              <span className="material-symbols-outlined text-sm">share</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-[#434654] hover:bg-primary-container hover:text-white cursor-pointer transition-colors">
              <span className="material-symbols-outlined text-sm">mail</span>
            </div>
          </div>
        </div>
      </footer>

      <nav className="md:hidden bg-[#7029e1]/85 backdrop-blur-xl fixed bottom-8 left-1/2 -translate-x-1/2 rounded-full px-8 py-3 w-fit min-w-[320px] flex items-center justify-around gap-6 z-50 shadow-[0_40px_60px_rgba(25,28,30,0.04)] border-[#c3c6d6]/20">
        <div className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-all cursor-pointer">
          <span className="material-symbols-outlined">mic</span>
          <span className="font-inter text-[10px] uppercase tracking-widest">
            Mic
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-all cursor-pointer">
          <span className="material-symbols-outlined">videocam</span>
          <span className="font-inter text-[10px] uppercase tracking-widest">
            Video
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-all cursor-pointer">
          <span className="material-symbols-outlined">history</span>
          <span className="font-inter text-[10px] uppercase tracking-widest">
            History
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-all cursor-pointer bg-white/20 rounded-full p-3">
          <span className="material-symbols-outlined">call_end</span>
          <span className="font-inter text-[10px] uppercase tracking-widest">
            End
          </span>
        </div>
      </nav>
    </div>
  );
}
