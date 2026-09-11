"use client";

export type StoredDashboardSession = {
  roomId: string;
  topic: string;
  startedAt: string;
  mode?: "video" | "voice" | "chat";
};

type Translate = (key: string) => string;
const surface = "rounded-2xl border-2 border-[#234196] bg-white shadow-[3px_3px_0_#234196]";
const interactive = "transition-[background-color,color,transform] duration-200 motion-reduce:transition-none active:translate-y-px";

function modeMeta(mode: StoredDashboardSession["mode"], t: Translate) {
  if (mode === "chat") return { icon: "chat_bubble", label: t("userDash.mode.chat.short") };
  if (mode === "voice") return { icon: "mic", label: t("userDash.mode.voice.short") };
  return { icon: "videocam", label: t("userDash.mode.video.short") };
}

export function PracticeModes({
  onNavigate,
  onStartVideo,
  t,
}: {
  onNavigate: (href: string) => void;
  onStartVideo: () => void;
  t: Translate;
}) {
  const modes = [
    { key: "chat", icon: "chat_bubble", tone: "bg-[#E8F5E9] text-[#2E7D32]", duration: "10–15", level: "userDash.mode.chat.level", action: () => onNavigate("/chat") },
    { key: "voice", icon: "mic", tone: "bg-[#FFEBEE] text-[#D32F2F]", duration: "5–15", level: "userDash.mode.voice.level", action: () => onNavigate("/voice") },
    { key: "video", icon: "videocam", tone: "bg-[#FCB625] text-[#234196]", duration: "20–30", level: "userDash.mode.video.level", action: onStartVideo },
  ] as const;

  return (
    <section aria-labelledby="modes-title">
      <div className="mb-5">
        <span className="sticker -rotate-1 bg-[#FCB625]">{t("userDash.modes.eyebrow")}</span>
        <h2 id="modes-title" className="mt-4 font-headline text-3xl">{t("userDash.modes.title")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5A6B8F]">{t("userDash.modes.subtitle")}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {modes.map((mode) => (
          <article key={mode.key} className={`${surface} flex flex-col p-6 ${mode.key === "video" ? "bg-[#FEF9EE] shadow-[5px_5px_0_#234196]" : ""}`}>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#234196] ${mode.tone}`}>
              <span className="material-symbols-outlined" aria-hidden="true">{mode.icon}</span>
            </div>
            <h3 className="mt-5 font-headline text-2xl">{t(`userDash.mode.${mode.key}.title`)}</h3>
            <p className="mt-3 flex-1 text-sm leading-6 text-[#5A6B8F]">{t(`userDash.mode.${mode.key}.benefit`)}</p>
            <dl className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t-2 border-[#234196] pt-4 text-xs">
              <div><dt className="text-[#5A6B8F]">{t("userDash.modes.duration")}</dt><dd className="mt-1 font-bold">{mode.duration} {t("userDash.modes.minutes")}</dd></div>
              <div><dt className="text-[#5A6B8F]">{t("userDash.modes.bestFor")}</dt><dd className="mt-1 font-bold">{t(mode.level)}</dd></div>
            </dl>
            <button type="button" onClick={mode.action} className={`chunky-secondary mt-5 inline-flex min-h-11 items-center gap-2 self-start px-4 text-sm ${interactive}`}>
              {t(`userDash.mode.${mode.key}.cta`)}
              <span className="material-symbols-outlined text-lg" aria-hidden="true">arrow_forward</span>
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export function RecentActivity({
  sessions,
  lang,
  onNavigate,
  t,
}: {
  sessions: StoredDashboardSession[];
  lang: string;
  onNavigate: (href: string) => void;
  t: Translate;
}) {
  return (
    <section aria-labelledby="activity-title">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <span className="sticker rotate-1 bg-[#FCB625]">{t("userDash.activity.eyebrow")}</span>
          <h2 id="activity-title" className="mt-4 font-headline text-3xl">{t("userDash.activity.title")}</h2>
        </div>
        {sessions.length ? (
          <button type="button" onClick={() => onNavigate("/interview/select")} className="hidden min-h-11 items-center gap-2 text-sm font-bold underline decoration-[#FCB625] decoration-4 underline-offset-4 sm:inline-flex">
            {t("userDash.activity.viewAll")}<span className="material-symbols-outlined text-lg" aria-hidden="true">arrow_forward</span>
          </button>
        ) : null}
      </div>
      {sessions.length ? (
        <div className={`${surface} divide-y-2 divide-[#234196] overflow-hidden`}>
          {sessions.slice(0, 5).map((session) => {
            const meta = modeMeta(session.mode, t);
            return (
              <article key={session.roomId} className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1.5fr)_minmax(7rem,.6fr)_auto] sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#234196] bg-[#FCB625] text-[#234196]"><span className="material-symbols-outlined text-xl" aria-hidden="true">{meta.icon}</span></span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">{session.topic}</h3>
                    <time dateTime={session.startedAt} className="mt-1 block text-xs text-[#5A6B8F]">
                      {new Date(session.startedAt).toLocaleString(lang === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium", timeStyle: "short" })}
                    </time>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#5A6B8F]"><span>{meta.label}</span><span aria-hidden="true">·</span><span>{t("userDash.activity.started")}</span><span className="sr-only">{t("userDash.activity.scoreUnavailable")}</span></div>
                <button type="button" onClick={() => onNavigate(`/interview/room/${session.roomId}`)} className="chunky-secondary min-h-11 justify-self-start px-4 text-sm sm:justify-self-end">{t("userDash.activity.continue")}</button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={`${surface} bg-[#F0F4FC] p-8 text-center`}>
          <span className="material-symbols-outlined text-3xl text-[#234196]" aria-hidden="true">history</span>
          <h3 className="mt-3 font-headline text-xl">{t("userDash.activity.emptyTitle")}</h3>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#5A6B8F]">{t("userDash.activity.emptyBody")}</p>
          <button type="button" onClick={() => onNavigate("/chat")} className={`chunky-primary mt-5 min-h-11 px-5 text-sm ${interactive}`}>{t("userDash.activity.emptyCta")}</button>
        </div>
      )}
    </section>
  );
}

export function LearningResources({ onNavigate, t }: { onNavigate: (href: string) => void; t: Translate }) {
  const resources = [
    { href: "/practice", icon: "quiz", tone: "bg-[#E8F5E9] text-[#2E7D32]", title: "userDash.learning.quizTitle", body: "userDash.learning.quizBody", cta: "userDash.learning.quizCta" },
    { href: "/resources", icon: "library_books", tone: "bg-[#FCB625] text-[#234196]", title: "userDash.learning.resourcesTitle", body: "userDash.learning.resourcesBody", cta: "userDash.learning.resourcesCta" },
  ];
  return (
    <section aria-labelledby="learning-title">
      <div className={`${surface} grid overflow-hidden lg:grid-cols-12`}>
        <div className="bg-[#F0F4FC] p-6 sm:p-8 lg:col-span-5">
          <span className="sticker -rotate-1 bg-[#FCB625]">{t("userDash.learning.eyebrow")}</span>
          <h2 id="learning-title" className="mt-5 font-headline text-3xl">{t("userDash.learning.title")}</h2>
          <p className="mt-3 text-sm leading-6 text-[#5A6B8F]">{t("userDash.learning.subtitle")}</p>
        </div>
        <div className="grid gap-0 bg-[#234196] sm:grid-cols-2 lg:col-span-7">
          {resources.map((resource) => (
            <button key={resource.href} type="button" onClick={() => onNavigate(resource.href)} className="group m-px min-h-44 bg-white p-6 text-left hover:bg-[#FEF9EE]">
              <span className={`material-symbols-outlined rounded-lg border-2 border-[#234196] p-2 ${resource.tone}`} aria-hidden="true">{resource.icon}</span>
              <h3 className="mt-4 font-headline text-xl">{t(resource.title)}</h3>
              <p className="mt-2 text-sm text-[#5A6B8F]">{t(resource.body)}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold underline decoration-[#FCB625] decoration-4 underline-offset-4">{t(resource.cta)}<span className="material-symbols-outlined text-lg transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true">arrow_forward</span></span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
