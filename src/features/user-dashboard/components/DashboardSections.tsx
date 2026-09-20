"use client";

import {
  MessageSquare,
  Mic,
  Video,
  ArrowRight,
  History,
  HelpCircle,
  BookOpen,
} from "lucide-react";

export type StoredDashboardSession = {
  roomId: string;
  topic: string;
  startedAt: string;
  mode?: "video" | "voice" | "chat";
};

type Translate = (key: string) => string;

function modeMeta(mode: StoredDashboardSession["mode"], t: Translate) {
  if (mode === "chat") return { icon: MessageSquare, label: t("userDash.mode.chat.short") };
  if (mode === "voice") return { icon: Mic, label: t("userDash.mode.voice.short") };
  return { icon: Video, label: t("userDash.mode.video.short") };
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
    {
      key: "chat",
      Icon: MessageSquare,
      iconWrap: "bg-emerald-50 text-emerald-600 border border-emerald-200",
      duration: "10–15",
      level: "userDash.mode.chat.level",
      action: () => onNavigate("/chat"),
    },
    {
      key: "voice",
      Icon: Mic,
      iconWrap: "bg-blue-50 text-[#204195] border border-blue-200",
      duration: "5–15",
      level: "userDash.mode.voice.level",
      action: () => onNavigate("/voice"),
    },
    {
      key: "video",
      Icon: Video,
      iconWrap: "bg-[#204195] text-white shadow-xs",
      duration: "20–30",
      level: "userDash.mode.video.level",
      action: onStartVideo,
    },
  ] as const;

  return (
    <section aria-labelledby="modes-title">
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9D7F1] bg-[#F0F4FC] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#204195]">
          {t("userDash.modes.eyebrow")}
        </span>
        <h2 id="modes-title" className="mt-3 text-2xl font-bold tracking-tight text-[#14244B] sm:text-3xl">
          {t("userDash.modes.title")}
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#607096]">
          {t("userDash.modes.subtitle")}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {modes.map((mode) => {
          const isFeatured = mode.key === "video";
          return (
            <article
              key={mode.key}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-200 ${
                isFeatured
                  ? "border-[#204195] bg-gradient-to-b from-[#F0F4FC]/80 via-white to-white shadow-md ring-1 ring-[#204195]/20 hover:shadow-lg"
                  : "border-[#DCE4F3] bg-white shadow-xs hover:border-[#204195]/40 hover:shadow-md"
              }`}
            >
              {isFeatured && (
                <div className="absolute -top-3 right-5 rounded-full bg-[#FCB625] px-3 py-0.5 text-xs font-bold text-[#14244B] shadow-xs">
                  {t("common.recommended") || "Recommended"}
                </div>
              )}
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${mode.iconWrap}`}>
                <mode.Icon className="size-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-[#14244B]">
                {t(`userDash.mode.${mode.key}.title`)}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[#607096]">
                {t(`userDash.mode.${mode.key}.benefit`)}
              </p>
              <dl className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#DCE4F3] pt-4 text-xs">
                <div>
                  <dt className="font-medium text-[#607096]">{t("userDash.modes.duration")}</dt>
                  <dd className="mt-1 font-bold text-[#14244B]">{mode.duration} {t("userDash.modes.minutes")}</dd>
                </div>
                <div>
                  <dt className="font-medium text-[#607096]">{t("userDash.modes.bestFor")}</dt>
                  <dd className="mt-1 font-bold text-[#14244B]">{t(mode.level)}</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={mode.action}
                className={`mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all duration-150 ${
                  isFeatured
                    ? "bg-[#204195] text-white shadow-xs hover:bg-[#183275] active:scale-[0.99]"
                    : "border border-[#DCE4F3] bg-white text-[#204195] hover:bg-[#F0F4FC] hover:border-[#C9D7F1] active:scale-[0.99]"
                }`}
              >
                {t(`userDash.mode.${mode.key}.cta`)}
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </article>
          );
        })}
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
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9D7F1] bg-[#F0F4FC] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#204195]">
            {t("userDash.activity.eyebrow")}
          </span>
          <h2 id="activity-title" className="mt-3 text-2xl font-bold tracking-tight text-[#14244B] sm:text-3xl">
            {t("userDash.activity.title")}
          </h2>
        </div>
        {sessions.length ? (
          <button
            type="button"
            onClick={() => onNavigate("/interview/select")}
            className="hidden min-h-10 items-center gap-1.5 text-sm font-semibold text-[#204195] transition-colors hover:text-[#183275] hover:underline sm:inline-flex"
          >
            {t("userDash.activity.viewAll")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {sessions.length ? (
        <div className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs divide-y divide-[#EAEFF8]">
          {sessions.slice(0, 5).map((session) => {
            const meta = modeMeta(session.mode, t);
            const Icon = meta.icon;
            return (
              <article
                key={session.roomId}
                className="grid gap-4 p-4.5 transition-colors hover:bg-[#F8FAFC] sm:grid-cols-[minmax(0,1.5fr)_minmax(7rem,.6fr)_auto] sm:items-center sm:p-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#DCE4F3] bg-[#F0F4FC] text-[#204195]">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-[#14244B]">{session.topic}</h3>
                    <time dateTime={session.startedAt} className="mt-0.5 block text-xs text-[#607096]">
                      {new Date(session.startedAt).toLocaleString(lang === "vi" ? "vi-VN" : "en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </time>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#607096]">
                  <span className="font-medium text-[#204195]">{meta.label}</span>
                  <span aria-hidden="true">·</span>
                  <span>{t("userDash.activity.started")}</span>
                  <span className="sr-only">{t("userDash.activity.scoreUnavailable")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (session.mode === "chat") {
                      onNavigate("/chat");
                    } else if (session.mode === "voice") {
                      onNavigate("/voice");
                    } else {
                      onNavigate(`/interview/room/${session.roomId}`);
                    }
                  }}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#DCE4F3] bg-white px-4 text-xs font-semibold text-[#14244B] transition-all duration-150 hover:border-[#204195] hover:bg-[#F0F4FC] hover:text-[#204195] justify-self-start sm:justify-self-end"
                >
                  {t("userDash.activity.continue")}
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#DCE4F3] bg-white p-8 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F4FC] text-[#204195]">
            <History className="size-6" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-[#14244B]">{t("userDash.activity.emptyTitle")}</h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-[#607096]">{t("userDash.activity.emptyBody")}</p>
          <button
            type="button"
            onClick={() => onNavigate("/chat")}
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl bg-[#204195] px-5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#183275]"
          >
            {t("userDash.activity.emptyCta")}
          </button>
        </div>
      )}
    </section>
  );
}

export function LearningResources({ onNavigate, t }: { onNavigate: (href: string) => void; t: Translate }) {
  const resources = [
    {
      href: "/practice",
      Icon: HelpCircle,
      tone: "bg-emerald-50 text-emerald-600 border border-emerald-200",
      title: "userDash.learning.quizTitle",
      body: "userDash.learning.quizBody",
      cta: "userDash.learning.quizCta",
    },
    {
      href: "/resources",
      Icon: BookOpen,
      tone: "bg-amber-50 text-[#FCB625] border border-amber-200",
      title: "userDash.learning.resourcesTitle",
      body: "userDash.learning.resourcesBody",
      cta: "userDash.learning.resourcesCta",
    },
  ];

  return (
    <section aria-labelledby="learning-title">
      <div className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs grid lg:grid-cols-12">
        <div className="border-b border-[#DCE4F3] bg-gradient-to-br from-[#F0F4FC] to-white p-6 sm:p-8 lg:col-span-5 lg:border-b-0 lg:border-r">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9D7F1] bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#204195]">
            {t("userDash.learning.eyebrow")}
          </span>
          <h2 id="learning-title" className="mt-3 text-2xl font-bold tracking-tight text-[#14244B] sm:text-3xl">
            {t("userDash.learning.title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#607096]">{t("userDash.learning.subtitle")}</p>
        </div>

        <div className="grid divide-y divide-[#DCE4F3] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:col-span-7">
          {resources.map((resource) => (
            <button
              key={resource.href}
              type="button"
              onClick={() => onNavigate(resource.href)}
              className="group flex flex-col justify-between p-6 text-left transition-colors hover:bg-[#F8FAFC]"
            >
              <div>
                <span className={`inline-flex rounded-xl p-2.5 ${resource.tone}`} aria-hidden="true">
                  <resource.Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-[#14244B] transition-colors group-hover:text-[#204195]">
                  {t(resource.title)}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-[#607096]">{t(resource.body)}</p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#204195] group-hover:text-[#183275]">
                {t(resource.cta)}
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
