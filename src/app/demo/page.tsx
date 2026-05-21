import Link from "next/link";
import { cookies } from "next/headers";
import DemoRevealSection from "../../components/DemoRevealSection";
import MarketingNav from "../../components/MarketingNav";
import { getDictionary, normalizeLang } from "../../i18n/i18n";

const IMG_VIDEO_POSTER =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDf4msbwL9m0AcQOnTYTBDInauu9S5F2xb5vDvSSChGqivyZCoJetLvUsD2NzwhFCwQVP3gqTIGz9adVqSmY949h-OX-d90c3J093DwEuPCslK2wIrxeLoPhlCwYwz0EhmO999fAYM1So-oLC6Stg0m-LlUkI8A4Xtk9fr4chCxg-mmY_zugGVGJbSgnPHrM3AXacepOH-unkiL3SZUeu_jfor51f0CIHn8u3fgQuedslWazJiuflu_mXqb3vIVgw4WIppReLUKFq7T";

const IMG_AVATAR_1 =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDKc7nfX85UTIFCFzjKQ8L_kJLWuy3WwoVyAuV86BB-ROp4oC290PZQSB04NXmHCl2jfjW14Cu5SCEIWCfpZCGdD8CANbujKW5VM0_EEazmQqj71B0qz-go0xvyX54_HaZ0T1kv0kt4wTRm7jPV54kt8VW_aA81Tnp5dGzqfaufUDvlaCOqKuA8I5clF8dhw3KLmDP4MMzXxGddO69I24KPfSgjETxDTU-Rwz1YcYzUkMQ1qMMlSa-B9dI_W0yaSMAB0RVb3XhUJUO4";

const IMG_AVATAR_2 =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDV_hCrX7f8aJzArOPANWMiK8R01t55Y8O6oc8BhLpRTX8KOgx5c5ALVgsQI2-6kaXxhQ8rKywgFi0djyMneb7B_VQEvbIrYbZL6AEBLmqjCbBG-MOqgEw52Di140hk0VUHGH7AGsRy6HdMOMrTLz-oSeKvwFvpL8xJxrrElQtvbJU4YeJYpMkRUjwe9RUcjKat5p8dbOPNQ0K3ioXC5zDr8mvSJf7dRmHEabl0HwPdWS3cq4rRJjM6xmr8JGWzCIGlZvQfd2uU_RkW";

const IMG_AVATAR_3 =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD-yEemMREAOKlio8ykkZ1rpgHcBj-dxttHArGkUIVqKTT9zxq7za8euwo9Vygbyhkkmem8boBayUAaQ8r_cdMOdTa51JiXIrAres5P43LYYMHhOqh2U0hx_EAOtxJQZby2HmXkV0R7NigVe6-hnmdjeToAP3mJJKa7tPomGHZcb82tOjuR2V8HPBrXNjW5ZfLh0PlFt6HPZw5i-oRL6ByMYsU2RrmJ8l2RZQn4tElh_EDVeZ2Mn2tfvPr9N2xy_obtCO9E4MxC4UxG";

const IMG_VIDEO_SHOWCASE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCqmB5TGGjP7j_M5XmqldZXUq5InbhtWXwRtBJDN8DpL678P8V2WfpuAKXkdwDubjDS6wqDhTU32DQkvVp-0T-JYCCqUz4gP8wMtm_R_u1lrPHazLF3WV3xPiMl1xOWJZECBXajEr_J3-zgOhwNMMRPJGcBcuvcd0Ecg2Wa-2W8K4tBBOdmydQ9GkbWAGzyRUjs0cgc4TO0ACIohazhGYtqO-S2V5NnPv0UgDsx1UrhIovRXai5SCFnNVawKuj6pHfgZUJFVH-Pql6e";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;
  return { title: t("demo.metaTitle") };
}

export default async function DemoPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface antialiased">
      <MarketingNav active="solutions" />

      <main>
        <DemoRevealSection className="hero-gradient pt-24 pb-16 px-6 sm:px-12 overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest text-on-tertiary-fixed bg-tertiary-fixed rounded-full uppercase">
              {t("demo.hero.badge")}
            </span>
            <h1 className="font-headline text-on-surface text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[0.95] tracking-tighter max-w-4xl mb-8">
              {t("demo.hero.titleBefore")}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#003d9b] to-[#7029e1]">
                {t("demo.hero.titleGradient")}
              </span>
              {t("demo.hero.titleAfter")}
            </h1>
            <p className="font-body text-on-surface-variant text-xl md:text-2xl max-w-2xl leading-relaxed">
              {t("demo.hero.subtitle")}
            </p>
          </div>
        </DemoRevealSection>

        <DemoRevealSection className="px-6 sm:px-12 -mt-12 mb-24" delaySec={0.2}>
          <div className="max-w-6xl mx-auto">
            <div className="relative group rounded-3xl overflow-hidden demo-shadow-ambient bg-surface-container-lowest p-4">
              <div className="aspect-video relative rounded-2xl overflow-hidden bg-surface-container-highest">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={t("demo.video.posterAlt")}
                  className="w-full h-full object-cover"
                  src={IMG_VIDEO_POSTER}
                />
                <div className="absolute inset-0 bg-on-surface/40 flex items-center justify-center opacity-100 group-hover:bg-on-surface/30 transition-all">
                  <button
                    type="button"
                    className="w-20 h-20 bg-[#0052cc] rounded-full flex items-center justify-center text-on-primary shadow-2xl cursor-pointer hover:scale-110 transition-transform"
                    aria-label="Play demo video"
                  >
                    <span
                      className="material-symbols-outlined !text-4xl"
                      style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                    >
                      play_arrow
                    </span>
                  </button>
                </div>
                <div className="absolute bottom-4 sm:bottom-6 left-4 right-4 sm:left-6 sm:right-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 demo-glass-bar rounded-2xl p-4 text-white">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2.5 h-2.5 bg-[#7029e1] rounded-full animate-pulse shadow-[0_0_10px_#7029e1] shrink-0" />
                    <span className="text-xs sm:text-sm font-bold tracking-tight truncate">
                      {t("demo.video.liveLabel")}
                    </span>
                  </div>
                  <div className="flex gap-4 shrink-0 justify-end">
                    <span
                      className="material-symbols-outlined text-xl cursor-pointer hover:opacity-70 transition-opacity"
                      aria-hidden
                    >
                      settings
                    </span>
                    <span
                      className="material-symbols-outlined text-xl cursor-pointer hover:opacity-70 transition-opacity"
                      aria-hidden
                    >
                      fullscreen
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DemoRevealSection>

        <DemoRevealSection className="px-6 sm:px-12 py-32 bg-surface-container-low" delaySec={0.3}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
              <div className="max-w-2xl">
                <h2 className="font-headline text-on-surface text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-6">
                  {t("demo.workflow.title")}
                </h2>
                <p className="font-body text-on-surface-variant text-xl leading-relaxed">{t("demo.workflow.subtitle")}</p>
              </div>
              <Link
                href="/signup"
                className="bg-[#0052cc] text-on-primary px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-container hover-lift active:scale-95 flex items-center gap-2 shrink-0"
              >
                {t("demo.workflow.cta")}
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-surface-container-lowest p-10 rounded-3xl flex flex-col gap-8 demo-shadow-ambient hover-lift border border-outline-variant/10">
                <div className="w-16 h-16 rounded-2xl bg-primary-fixed flex items-center justify-center text-[#003d9b]">
                  <span className="material-symbols-outlined text-4xl">tune</span>
                </div>
                <div>
                  <h3 className="font-headline text-2xl font-bold mb-4">{t("demo.step1.title")}</h3>
                  <p className="font-body text-on-surface-variant leading-relaxed">{t("demo.step1.body")}</p>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-10 rounded-3xl flex flex-col gap-8 demo-shadow-ambient hover-lift border border-outline-variant/10">
                <div className="w-16 h-16 rounded-2xl bg-tertiary-fixed flex items-center justify-center text-[#7029e1]">
                  <span className="material-symbols-outlined text-4xl">psychology</span>
                </div>
                <div>
                  <h3 className="font-headline text-2xl font-bold mb-4">{t("demo.step2.title")}</h3>
                  <p className="font-body text-on-surface-variant leading-relaxed">{t("demo.step2.body")}</p>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-10 rounded-3xl flex flex-col gap-8 demo-shadow-ambient hover-lift border border-outline-variant/10">
                <div className="w-16 h-16 rounded-2xl bg-secondary-fixed flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-4xl">insights</span>
                </div>
                <div>
                  <h3 className="font-headline text-2xl font-bold mb-4">{t("demo.step3.title")}</h3>
                  <p className="font-body text-on-surface-variant leading-relaxed">{t("demo.step3.body")}</p>
                </div>
              </div>
            </div>
          </div>
        </DemoRevealSection>

        <DemoRevealSection className="px-6 sm:px-12 py-32 bg-surface" delaySec={0.4}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                {t("demo.sample.title")}
              </h2>
              <p className="font-body text-on-surface-variant text-xl max-w-2xl mx-auto">{t("demo.sample.subtitle")}</p>
            </div>
            <div className="flex flex-col gap-8 md:grid md:grid-cols-12 md:grid-rows-2 md:gap-8 md:h-[750px]">
              <div className="md:col-span-7 bg-[#001848] rounded-3xl p-8 md:p-10 relative overflow-hidden text-white flex flex-col justify-between min-h-[320px] hover-lift">
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-8 border border-white/10">
                    <span className="w-2.5 h-2.5 bg-[#7029e1] rounded-full animate-pulse shadow-[0_0_10px_#7029e1]" />
                    <span className="text-xs font-bold tracking-widest uppercase">{t("demo.bento.voice.badge")}</span>
                  </div>
                  <h3 className="font-headline text-3xl md:text-4xl font-extrabold mb-6">{t("demo.bento.voice.title")}</h3>
                  <p className="text-blue-100/70 text-base md:text-lg max-w-md leading-relaxed">
                    {t("demo.bento.voice.desc")}
                  </p>
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6 mt-auto pt-8">
                  <div className="flex gap-1.5 items-end h-10">
                    <div className="w-1.5 h-5 bg-[#7029e1] rounded-full animate-bounce" />
                    <div
                      className="w-1.5 h-10 bg-[#7029e1] rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-1.5 h-7 bg-[#7029e1] rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <div
                      className="w-1.5 h-6 bg-[#7029e1] rounded-full animate-bounce"
                      style={{ animationDelay: "0.3s" }}
                    />
                  </div>
                  <p className="text-base md:text-lg italic text-white/60">{t("demo.bento.voice.quote")}</p>
                </div>
                <div className="absolute -right-20 -bottom-20 w-[450px] h-[450px] bg-[#7029e1] rounded-full blur-[120px] opacity-20 pointer-events-none" />
              </div>

              <div className="md:col-span-5 bg-surface-container-lowest rounded-3xl p-8 demo-shadow-ambient border border-outline-variant/10 flex flex-col gap-8 overflow-hidden min-h-[380px] hover-lift">
                <div className="flex items-center gap-4 border-b border-surface-container-high pb-6">
                  <div className="w-12 h-12 rounded-full bg-[#0052cc] flex items-center justify-center text-white shrink-0">
                    <span className="material-symbols-outlined">robot_2</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-base">{t("demo.bento.chat.assistant")}</h4>
                    <p className="text-xs text-on-surface-variant font-medium">{t("demo.bento.chat.status")}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-6 overflow-y-auto flex-1 min-h-0">
                  <div className="bg-surface-container px-5 py-4 rounded-2xl rounded-tl-none max-w-[85%] text-sm leading-relaxed">
                    {t("demo.bento.chat.msg1")}
                  </div>
                  <div className="bg-[#0052cc]/10 self-end px-5 py-4 rounded-2xl rounded-tr-none max-w-[85%] text-sm text-[#0052cc] font-semibold leading-relaxed">
                    {t("demo.bento.chat.msg2")}
                  </div>
                </div>
                <div className="mt-auto relative pt-2">
                  <div className="bg-surface-container-highest px-5 py-4 rounded-xl text-sm text-on-surface-variant flex justify-between items-center border border-outline-variant/20">
                    {t("demo.bento.chat.placeholder")}
                    <span className="material-symbols-outlined text-xl text-[#0052cc] cursor-pointer">send</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-12 bg-surface-container-low rounded-3xl overflow-hidden flex flex-col md:flex-row demo-shadow-ambient hover-lift border border-outline-variant/10">
                <div className="md:w-1/2 p-10 md:p-16 flex flex-col justify-center">
                  <h3 className="font-headline text-3xl md:text-4xl font-extrabold mb-6">{t("demo.bento.video.title")}</h3>
                  <p className="font-body text-on-surface-variant text-lg mb-10 leading-relaxed">{t("demo.bento.video.desc")}</p>
                  <div className="flex flex-wrap gap-6 items-center">
                    <div className="flex -space-x-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={t("demo.bento.video.avatar1Alt")}
                        className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover"
                        src={IMG_AVATAR_1}
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={t("demo.bento.video.avatar2Alt")}
                        className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover"
                        src={IMG_AVATAR_2}
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={t("demo.bento.video.avatar3Alt")}
                        className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover"
                        src={IMG_AVATAR_3}
                      />
                    </div>
                    <span className="text-sm text-on-surface-variant font-bold tracking-tight">
                      {t("demo.bento.video.avatars")}
                    </span>
                  </div>
                </div>
                <div className="md:w-1/2 relative min-h-[280px] md:min-h-[350px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={t("demo.bento.video.mainImgAlt")}
                    className="w-full h-full object-cover min-h-[280px] md:min-h-[350px]"
                    src={IMG_VIDEO_SHOWCASE}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-surface-container-low via-transparent to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </DemoRevealSection>

        <DemoRevealSection className="px-6 sm:px-12 py-24" delaySec={0.5}>
          <div className="max-w-5xl mx-auto bg-[#7029e1] rounded-[3rem] p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <h2 className="font-headline text-4xl md:text-5xl font-extrabold mb-8 tracking-tighter">
                {t("demo.final.title")}
              </h2>
              <p className="text-white/80 text-lg md:text-xl mb-12 max-w-xl mx-auto">{t("demo.final.subtitle")}</p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link
                  href="/signup"
                  className="bg-white text-[#7029e1] px-10 py-5 rounded-2xl font-black text-lg hover:scale-105 transition-transform active:scale-95 shadow-xl text-center"
                >
                  {t("demo.final.primary")}
                </Link>
                <Link
                  href="#"
                  className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-white/20 transition-all text-center"
                >
                  {t("demo.final.secondary")}
                </Link>
              </div>
            </div>
          </div>
        </DemoRevealSection>
      </main>

      <footer className="w-full border-t border-outline-variant/20 py-12 bg-[#f7f9fb] dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0">
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div className="font-headline font-bold text-[#191c1e] dark:text-slate-100 text-xl">{t("marketing.brandCurator")}</div>
            <p className="font-body text-xs text-[#434654] dark:text-slate-500 max-w-xs text-center md:text-left">
              {t("footer.copyright")}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 font-body text-xs text-[#434654] dark:text-slate-500">
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
              className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-[#434654] hover:bg-[#0052cc] hover:text-white cursor-pointer transition-colors"
              aria-label="Share"
            >
              <span className="material-symbols-outlined text-sm">share</span>
            </button>
            <Link
              href="#"
              className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-[#434654] hover:bg-[#0052cc] hover:text-white transition-colors"
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
