"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import LanguageToggleButton from "../../components/LanguageToggleButton";
import { UserDashboardShell } from "../../components/user-dashboard/UserDashboardShell";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useAuthProfile } from "../../auth/useAuthProfile";

const QUESTION_IDS = ["q1", "q2", "q3"] as const;
const CORRECT: Record<(typeof QUESTION_IDS)[number], number> = {
  q1: 1,
  q2: 1,
  q3: 1,
};

const LETTERS = ["A", "B", "C"] as const;

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
  const { profile, displayName } = useAuthProfile();

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
    const completedQuestions = step + (picked !== null ? 1 : 0);
    return Math.min(100, (completedQuestions / QUESTION_IDS.length) * 100);
  }, [step, picked]);

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
    if (i === step) return "current";
    const a = answers[i];
    if (a !== null && a !== undefined) {
      return a === CORRECT[QUESTION_IDS[i]] ? "done-ok" : "done-bad";
    }
    return "todo";
  }

  return (
    <UserDashboardShell>
      <main className="paper-dots min-h-screen bg-[#FEF9EE] px-4 pb-28 pt-6 text-[#234196] sm:px-6 md:px-8 md:py-10 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-[1440px]">
        <header className="mb-8 grid gap-6 border-b-2 border-[#234196] pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="max-w-2xl">
            <span className="mb-2 inline-block font-metadata text-[10px] font-bold uppercase tracking-[.18em] text-[#E59E10]">
              {t("practice.eyebrow")}
            </span>
            <h1 className="font-headline text-[clamp(2rem,3vw,2.75rem)] font-semibold leading-tight tracking-[-.03em] text-[#234196]">
              {t("practice.title")}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#5A6B8F] sm:text-base">{t("practice.subtitle")}</p>
          </div>
          <div className="flex min-w-0 items-center rounded-2xl border-2 border-[#234196] bg-white p-2 shadow-[3px_3px_0_#234196] lg:max-w-sm">
            <Link
              href="/dashboard"
              className="shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FCB625]"
              aria-label={t("interview.select.backDashboard")}
              title={t("interview.select.backDashboard")}
            >
              {profile?.picture ? (
                  <img
                    alt=""
                    className="h-11 w-11 rounded-xl border-2 border-[#234196] object-cover"
                    src={profile.picture}
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#234196] bg-[#FCB625] font-headline text-sm font-bold text-[#234196]">
                    {displayName ? initialsFromName(displayName) : "?"}
                  </div>
                )}
            </Link>
            <div className="min-w-0 flex-1 px-3">
              <p className="truncate text-sm font-bold text-[#234196]">{displayName || t("userDash.profile.guest")}</p>
              <p className="mt-0.5 font-metadata text-[8px] text-[#5A6B8F]">{roleLabel}</p>
            </div>
            <div className="h-8 w-px shrink-0 bg-[#B7C6E6]" aria-hidden="true" />
            <LanguageToggleButton className="ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#234196] transition-colors hover:bg-[#F0F4FC]" />
          </div>
        </header>

        {!done ? (
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-8">
              <div className="overflow-hidden rounded-2xl border-2 border-[#234196] bg-white shadow-[5px_5px_0_#234196]">
                <div className="h-2 w-full bg-[#DCE3F1]">
                  <div
                    className="h-full rounded-r-full bg-[#FCB625] transition-[width] duration-500 ease-out"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="p-6 sm:p-8">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <span className="sticker -rotate-1 bg-[#FCB625] text-[9px]">
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
                                ? "bg-[#2E7D32]"
                                : s === "done-bad"
                                  ? "bg-[#D32F2F]"
                                  : s === "current"
                                    ? "bg-[#234196] ring-2 ring-[#FCB625] ring-offset-2 ring-offset-white"
                                    : "bg-[#B7C6E6]"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <h2 className="mb-6 font-headline text-xl font-semibold leading-snug text-[#17244A] sm:text-2xl">
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
                          className={`group flex min-h-[72px] w-full items-center rounded-xl border-2 p-4 text-left transition-all duration-200 sm:p-5 ${
                            isPicked
                              ? "border-[#234196] bg-[#F0F4FC] shadow-[3px_3px_0_#234196]"
                              : "border-[#B7C6E6] bg-white hover:border-[#234196] hover:bg-[#FEF9EE]"
                          }`}
                        >
                          <div
                            className={`mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-bold transition-colors ${
                              isPicked
                                ? "border-[#234196] bg-[#FCB625] text-[#234196]"
                                : "border-[#B7C6E6] text-[#5A6B8F] group-hover:border-[#234196] group-hover:text-[#234196]"
                            }`}
                          >
                            {LETTERS[i]}
                          </div>
                          <span
                            className={`leading-snug ${
                              isPicked ? "font-bold text-[#17244A]" : "font-medium text-[#344467]"
                            }`}
                          >
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {picked !== null && (
                    <div className="mt-6 rounded-xl border-2 border-[#234196] bg-[#FFF5D6] p-4">
                      <p className="text-sm leading-relaxed text-[#344467]">
                        <span className="font-bold text-[#234196]">{t("practice.coachNote")}: </span>
                        {t(`practice.${qid}.feedback`)}
                      </p>
                    </div>
                  )}

                  {picked === null && (
                    <p className="mt-4 text-sm text-[#5A6B8F]">{t("practice.pickHint")}</p>
                  )}

                  <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={step === 0}
                      className="chunky-secondary inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 text-sm disabled:pointer-events-none disabled:opacity-35"
                    >
                      <span className="material-symbols-outlined select-none text-lg leading-none" aria-hidden="true">arrow_back</span>
                      {t("practice.prev")}
                    </button>
                    <button
                      type="button"
                      disabled={picked === null}
                      onClick={handleNext}
                      className="chunky-primary inline-flex min-h-12 items-center justify-center gap-2 px-8 py-3 font-headline font-bold disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {step >= QUESTION_IDS.length - 1 ? t("practice.finish") : t("practice.next")}
                      <span className="material-symbols-outlined select-none text-lg leading-none" aria-hidden="true">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 lg:col-span-4">
              <div className="rounded-2xl border-2 border-[#234196] bg-[#234196] p-6 text-white shadow-[5px_5px_0_#FCB625]">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-white bg-[#FCB625] text-[#234196]">
                    <span
                      className="material-symbols-outlined select-none text-xl leading-none"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                      aria-hidden="true"
                    >
                      lightbulb
                    </span>
                  </div>
                  <h3 className="font-headline text-lg font-bold">{t("practice.tip.title")}</h3>
                </div>
                <p className="mb-4 text-sm leading-relaxed text-white/80">{t("practice.tip.body")}</p>
                <Link
                  href="/resources"
                  className="inline-flex min-h-11 items-center text-xs font-bold underline decoration-[#FCB625] decoration-4 underline-offset-4 transition-opacity hover:opacity-90"
                >
                  {t("practice.tip.link")}
                </Link>
              </div>

              <div className="rounded-2xl border-2 border-[#234196] bg-white p-6 shadow-[3px_3px_0_#234196]">
                <h3 className="mb-5 font-headline text-lg font-bold text-[#234196]">
                  {t("practice.stats.title")}
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-[#5A6B8F]">{t("practice.stats.accuracy")}</span>
                      <span className="font-bold text-[#2E7D32]">
                        {answeredCount ? `${runningPct}%` : "—"}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#DCE3F1]">
                      <div
                        className="h-full rounded-full bg-[#2E7D32] transition-all duration-500"
                        style={{ width: `${answeredCount ? runningPct : 8}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-[#5A6B8F]">{t("practice.stats.pace")}</span>
                      <span className="font-bold text-[#234196]">{t("practice.stats.paceValue")}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#DCE3F1]">
                      <div className="h-full w-[65%] rounded-full bg-[#234196]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border-2 border-[#234196] bg-[#234196] shadow-[3px_3px_0_#234196]">
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
                    className="chunky-primary inline-flex min-h-11 w-fit items-center px-4 py-2 text-xs"
                  >
                    {t("practice.promo.cta")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-lg">
            <div className="overflow-hidden rounded-2xl border-2 border-[#234196] bg-white text-center shadow-[6px_6px_0_#234196]">
              <div className="bg-[#234196] px-8 py-10 text-white">
                <span className="sticker bg-[#FCB625] text-[9px] text-[#234196]">{t("practice.finish")}</span>
                <p className="mt-2 font-headline text-5xl font-black tabular-nums">
                  {score}/{QUESTION_IDS.length}
                </p>
                <p className="mt-2 text-sm font-medium text-white/80">
                  {t("practice.result")
                    .replace("{score}", String(score))
                    .replace("{total}", String(QUESTION_IDS.length))}
                </p>
              </div>
              <div className="space-y-4 p-8">
                <p className="text-sm leading-6 text-[#5A6B8F]">{t("practice.done.encouragement")}</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={restart}
                    className="chunky-primary min-h-12 px-6 py-3 font-bold"
                  >
                    {t("practice.restart")}
                  </button>
                  <Link
                    href="/dashboard"
                    className="chunky-secondary inline-flex min-h-12 items-center justify-center px-6 py-3 font-bold"
                  >
                    {t("practice.done.backDash")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </UserDashboardShell>
  );
}
