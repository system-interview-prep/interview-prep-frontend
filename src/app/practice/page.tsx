"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import LanguageToggleButton from "../../components/LanguageToggleButton";
import { UserDashboardShell } from "../../components/user-dashboard/UserDashboardShell";
import { useLanguage } from "../../i18n/LanguageProvider";

const QUESTION_IDS = ["q1", "q2", "q3"] as const;
const CORRECT: Record<(typeof QUESTION_IDS)[number], number> = {
  q1: 1,
  q2: 1,
  q3: 1,
};

const LETTERS = ["A", "B", "C"] as const;

type GoogleProfile = {
  email?: string | null;
  name?: string | null;
  picture?: string | null;
};

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return name.slice(0, 2).toUpperCase() || "?";
}

export default function PracticePage() {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    QUESTION_IDS.map(() => null),
  );
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [profile, setProfile] = useState<GoogleProfile | null>(null);

  const loadProfile = useCallback(() => {
    setProfile(safeJsonParse<GoogleProfile>(localStorage.getItem("auth.googleProfile")));
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    function onFocus() {
      loadProfile();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadProfile]);

  const qid = QUESTION_IDS[step];
  const options = useMemo(
    () => [t(`practice.${qid}.a`), t(`practice.${qid}.b`), t(`practice.${qid}.c`)] as string[],
    [t, qid],
  );

  const { runningPct, answeredCount } = useMemo(() => {
    let correct = 0;
    let answered = 0;
    for (let i = 0; i < QUESTION_IDS.length; i++) {
      const id = QUESTION_IDS[i];
      const a = i < step ? answers[i] : i === step ? picked : null;
      if (a === null || a === undefined) continue;
      answered += 1;
      if (a === CORRECT[id]) correct += 1;
    }
    return {
      runningPct: answered ? Math.round((correct / answered) * 100) : 0,
      answeredCount: answered,
    };
  }, [answers, step, picked]);

  const progressPct = useMemo(() => {
    const base = step / QUESTION_IDS.length;
    const bump = picked !== null ? 0.22 / QUESTION_IDS.length : 0.08 / QUESTION_IDS.length;
    return Math.min(100, (base + bump) * 100);
  }, [step, picked]);

  const displayName = profile?.name?.trim() || profile?.email?.split("@")[0] || "";
  const roleLabel = t("userDash.roleFallback");

  function handleNext() {
    if (picked === null) return;
    const nextAnswers = [...answers];
    nextAnswers[step] = picked;
    setAnswers(nextAnswers);

    if (step >= QUESTION_IDS.length - 1) {
      const finalScore = nextAnswers.reduce<number>((acc, ans, i) => {
        if (ans === null) return acc;
        return acc + (ans === CORRECT[QUESTION_IDS[i]] ? 1 : 0);
      }, 0);
      setScore(finalScore);
      setDone(true);
      return;
    }
    setStep((s) => s + 1);
    setPicked(nextAnswers[step + 1] ?? null);
  }

  function handlePrev() {
    if (step === 0) return;
    const newStep = step - 1;
    setStep(newStep);
    setPicked(answers[newStep] ?? null);
  }

  function restart() {
    setStep(0);
    setPicked(null);
    setAnswers(QUESTION_IDS.map(() => null));
    setScore(0);
    setDone(false);
  }

  function dotState(i: number): "done-ok" | "done-bad" | "current" | "todo" {
    const a = answers[i];
    if (a !== null && a !== undefined) {
      return a === CORRECT[QUESTION_IDS[i]] ? "done-ok" : "done-bad";
    }
    if (i === step) return "current";
    return "todo";
  }

  return (
    <UserDashboardShell>
      <main className="min-h-screen bg-surface p-6 pb-28 md:pb-12 md:p-12">
        <header className="relative mb-10 flex flex-col gap-6 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="pointer-events-none absolute -right-8 -top-12 h-64 w-64 rounded-full bg-tertiary/10 blur-[80px]" aria-hidden />
          <div className="relative z-[1]">
            <span className="mb-3 inline-block text-[10px] font-bold uppercase tracking-widest text-tertiary">
              {t("practice.eyebrow")}
            </span>
            <h1 className="font-headline text-3xl font-extrabold tracking-tighter text-on-surface md:text-4xl">
              {t("practice.title")}
            </h1>
            <p className="mt-2 max-w-2xl font-body text-lg text-on-surface-variant">{t("practice.subtitle")}</p>
          </div>
          <div className="relative z-[1] flex flex-wrap items-center gap-4 sm:justify-end">
            <LanguageToggleButton />
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-headline font-bold text-on-surface">{displayName || "—"}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {roleLabel}
                </p>
              </div>
              <Link
                href="/dashboard"
                className="shrink-0 rounded-full ring-2 ring-primary/10 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                aria-label={t("interview.select.backDashboard")}
                title={t("interview.select.backDashboard")}
              >
                {profile?.picture ? (
                  <img
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                    src={profile.picture}
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed font-headline text-sm font-bold text-primary">
                    {displayName ? initialsFromName(displayName) : "?"}
                  </div>
                )}
              </Link>
            </div>
          </div>
        </header>

        {!done ? (
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-lg shadow-primary/5">
                <div className="h-1.5 w-full bg-surface-container">
                  <div
                    className="h-full rounded-r-full bg-gradient-to-r from-primary to-tertiary transition-[width] duration-500 ease-out"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="p-6 sm:p-8">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <span className="rounded-md bg-primary-fixed px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                      {t("practice.progress")
                        .replace("{current}", String(step + 1))
                        .replace("{total}", String(QUESTION_IDS.length))}
                    </span>
                    <div className="flex gap-1.5" aria-hidden>
                      {QUESTION_IDS.map((_, i) => {
                        const s = dotState(i);
                        return (
                          <span
                            key={i}
                            className={`h-2.5 w-2.5 rounded-full transition-colors ${
                              s === "done-ok"
                                ? "bg-green-500"
                                : s === "done-bad"
                                  ? "bg-error"
                                  : s === "current"
                                    ? "bg-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-surface-container-lowest"
                                    : "bg-outline-variant/40"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <h2 className="mb-6 font-headline text-xl font-bold leading-snug text-on-surface sm:text-2xl">
                    {t(`practice.${qid}.question`)}
                  </h2>

                  <div className="space-y-3">
                    {options.map((label, i) => {
                      const isPicked = picked === i;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPicked(i)}
                          className={`group flex w-full items-center rounded-xl border-2 p-4 text-left transition-all sm:p-5 ${
                            isPicked
                              ? "border-primary bg-primary/8 shadow-md shadow-primary/10 ring-2 ring-primary/15"
                              : "border-outline-variant/15 hover:border-primary/35 hover:bg-surface-container/60 dark:border-white/10"
                          }`}
                        >
                          <div
                            className={`mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                              isPicked
                                ? "border-primary bg-primary text-on-primary"
                                : "border-outline-variant/40 text-on-surface-variant group-hover:border-primary/40 group-hover:bg-primary-fixed/50"
                            }`}
                          >
                            {LETTERS[i]}
                          </div>
                          <span
                            className={`font-medium leading-snug ${
                              isPicked ? "font-semibold text-on-surface" : "text-on-surface"
                            }`}
                          >
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {picked !== null && (
                    <div className="mt-6 rounded-xl border border-primary/20 bg-primary-fixed/40 p-4 dark:bg-primary/15">
                      <p className="text-sm leading-relaxed text-on-surface">
                        <span className="font-bold text-primary">{t("practice.coachNote")}: </span>
                        {t(`practice.${qid}.feedback`)}
                      </p>
                    </div>
                  )}

                  {picked === null && (
                    <p className="mt-4 text-sm text-on-surface-variant">{t("practice.pickHint")}</p>
                  )}

                  <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={step === 0}
                      className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-on-surface-variant transition-colors hover:text-on-surface disabled:pointer-events-none disabled:opacity-35"
                    >
                      <span className="material-symbols-outlined text-lg">arrow_back</span>
                      {t("practice.prev")}
                    </button>
                    <button
                      type="button"
                      disabled={picked === null}
                      onClick={handleNext}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 font-headline font-bold text-on-primary shadow-lg shadow-primary/25 transition-all hover:bg-primary-container active:scale-[0.98] disabled:opacity-45"
                    >
                      {step >= QUESTION_IDS.length - 1 ? t("practice.finish") : t("practice.next")}
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 lg:col-span-4">
              <div className="rounded-2xl bg-gradient-to-br from-tertiary to-primary p-6 text-on-primary shadow-xl shadow-tertiary/15">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
                    <span
                      className="material-symbols-outlined text-xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      lightbulb
                    </span>
                  </div>
                  <h3 className="font-headline text-lg font-bold">{t("practice.tip.title")}</h3>
                </div>
                <p className="mb-4 text-sm leading-relaxed text-white/90">{t("practice.tip.body")}</p>
                <Link
                  href="/resources"
                  className="text-xs font-bold underline underline-offset-4 transition-opacity hover:opacity-90"
                >
                  {t("practice.tip.link")}
                </Link>
              </div>

              <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6">
                <h3 className="mb-4 font-headline text-lg font-bold text-on-surface">
                  {t("practice.stats.title")}
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-on-surface-variant">{t("practice.stats.accuracy")}</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {answeredCount ? `${runningPct}%` : "—"}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${answeredCount ? runningPct : 8}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-on-surface-variant">{t("practice.stats.pace")}</span>
                      <span className="font-bold text-primary">{t("practice.stats.paceValue")}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                      <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-primary to-primary-fixed-dim" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-outline-variant/10">
                <img
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuATkdpYOSYH7F-xgPzeZh7_WXjy8c3vMeTOTQArAnHLc9F3-Hrj_FuQYcU9rOkyTHgN5sUnTu72Jdkhx53m0hvrYC2LZWvmc0n-Jc91mPmPMcx9oddCV1g6pEoPWRF9uoiTljs40gvDhW0kU1v1170czOF2ljksTzbZxV4QnIeJX9R_dP9TjJa-2N4zKZh45mXTbk8bM4Ho4iRAhPt4H7uG4qD1F7ducPlciw8y0tRKSiCUgbtRhtWeU-xTidqzzfZu6cY-diyf0EHn"
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/25 to-transparent p-5">
                  <h4 className="font-headline text-base font-bold text-white">{t("practice.promo.title")}</h4>
                  <p className="mb-3 text-xs text-white/85">{t("practice.promo.desc")}</p>
                  <Link
                    href="/pricing"
                    className="w-fit rounded-lg bg-white px-4 py-2 text-xs font-bold text-on-surface transition-colors hover:bg-white/90"
                  >
                    {t("practice.promo.cta")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-lg">
            <div className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest text-center shadow-xl shadow-primary/10">
              <div className="bg-gradient-to-r from-primary to-tertiary px-8 py-10 text-on-primary">
                <p className="text-sm font-bold uppercase tracking-widest text-white/80">{t("practice.finish")}</p>
                <p className="mt-2 font-headline text-5xl font-black tabular-nums">
                  {score}/{QUESTION_IDS.length}
                </p>
                <p className="mt-1 text-sm font-medium text-white/90">
                  {t("practice.result")
                    .replace("{score}", String(score))
                    .replace("{total}", String(QUESTION_IDS.length))}
                </p>
              </div>
              <div className="space-y-4 p-8">
                <p className="text-sm text-on-surface-variant">{t("practice.done.encouragement")}</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={restart}
                    className="rounded-xl bg-tertiary px-6 py-3 font-bold text-white shadow-lg shadow-tertiary/25 transition-colors hover:bg-tertiary-container"
                  >
                    {t("practice.restart")}
                  </button>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-xl border-2 border-outline-variant/30 px-6 py-3 font-bold text-primary transition-colors hover:bg-surface-container"
                  >
                    {t("practice.done.backDash")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </UserDashboardShell>
  );
}
