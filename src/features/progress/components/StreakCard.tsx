"use client";

import { Fragment } from "react";
import { Flame, Snowflake, Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { localeOf } from "@/i18n/format";
import { cn } from "@/utils";
import type { ActivityDay, PracticeProgress, StreakWeek } from "../services/progress.service";
import { fill, shortDate } from "../utils/progressFormat";

const GOALS = [1, 2, 3, 4, 5, 6, 7];
const DAY_MS = 86_400_000;

/** ISO day (yyyy-mm-dd) of a local date, without time zone shifts. */
function isoDay(day: Date): string {
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}

function parseDay(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/**
 * The calendar grid: one column per week (Monday first), 7 rows. Columns come
 * from the streak history so the week states (frozen, repaired, progress) line
 * up with the days.
 */
export function calendarWeeks(
  history: StreakWeek[],
  days: ActivityDay[],
  today: string,
): { week: StreakWeek; days: { date: string; future: boolean; activity: ActivityDay | null }[] }[] {
  const byDate = new Map(days.map((day) => [day.date, day]));
  return history.map((week) => {
    const start = parseDay(week.weekStart);
    return {
      week,
      days: Array.from({ length: 7 }, (_, offset) => {
        const date = isoDay(new Date(start.getTime() + offset * DAY_MS + 12 * 3_600_000));
        return { date, future: date > today, activity: byDate.get(date) ?? null };
      }),
    };
  });
}

/**
 * Weekly streak (research 24/10, PROGRESS_VISIBLE_STREAK_RESEARCH): weeks
 * meeting the goal with *valid* sessions (enough real answers), one saved week
 * a month, a missed week earned back by one extra session the week after.
 * A broken streak is never highlighted; the calendar shades days by valid
 * sessions (not by how many were started) and outlines days a missed point was
 * fixed.
 */
export function WeeklyStreakCard({
  progress,
  onGoal,
  savingGoal,
}: {
  progress: PracticeProgress;
  onGoal: (goal: number) => void;
  savingGoal: boolean;
}) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  const { streak } = progress;
  const today = progress.activity?.to ?? isoDay(new Date());
  const weeks = calendarWeeks(streak.history, progress.activity?.days ?? [], today);
  const started = streak.startedThisWeek ?? streak.thisWeekCount;
  const notCounted = Math.max(0, started - streak.thisWeekCount);
  const progressWeeks = streak.history.filter((week) => week.progress).length;
  const status = streak.earnBack
    ? fill(t("practiceProgress.streak.earnBack"), { n: streak.earnBack.remaining })
    : streak.thisWeekRemaining > 0
      ? streak.weeks > 0
        ? fill(t("practiceProgress.streak.remaining"), { n: streak.thisWeekRemaining })
        : fill(t("practiceProgress.streak.start"), { n: streak.thisWeekRemaining })
      : t("practiceProgress.streak.met");
  const rows = [0, 1, 2, 3, 4, 5, 6];

  return (
    <section className="min-w-0 rounded-2xl border border-[#DCE4F3] bg-white p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold text-[#14244B]">{t("practiceProgress.streak.title")}</h2>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <Flame className="size-6 self-center text-orange-500" aria-hidden="true" />
          <span className="font-display text-3xl font-extrabold tabular-nums text-[#14244B] sm:text-4xl">{streak.weeks}</span>
          <span className="text-sm font-semibold text-[#607096]">{t("practiceProgress.streak.unit")}</span>
        </div>
        <div className="min-w-0 text-right text-xs text-[#607096]">
          <p className="font-semibold text-[#14244B]">
            {fill(t("practiceProgress.streak.thisWeek"), { count: streak.thisWeekCount, goal: streak.goal })}
          </p>
          <p className={cn(streak.earnBack && "font-semibold text-[#8A5A0B]")}>{status}</p>
        </div>
      </div>
      {notCounted > 0 && (
        <p className="mt-2 rounded-lg bg-[#F8FAFC] px-3 py-2 text-[11px] text-[#4A5878] ring-1 ring-[#EAEFF8]">
          {fill(t("practiceProgress.streak.notCounted"), { n: notCounted, min: streak.validMinAnswers ?? 3 })}
        </p>
      )}

      <div
        className="mt-4 grid gap-[3px]"
        style={{ gridTemplateColumns: `1.5rem repeat(${weeks.length}, minmax(0, 1fr))` }}
        role="group"
        aria-label={t("practiceProgress.streak.calendar")}
      >
        <span aria-hidden="true" />
        {weeks.map(({ week }, index) => {
          const start = parseDay(week.weekStart);
          const showMonth = index === 0 || start.getDate() <= 7;
          return (
            <span key={week.weekStart} aria-hidden="true" className="h-4 overflow-visible whitespace-nowrap text-[9px] font-medium text-[#8B98B5]">
              {showMonth ? new Intl.DateTimeFormat(locale, { month: "short" }).format(start) : ""}
            </span>
          );
        })}
        {rows.map((row) => (
          <Fragment key={row}>
            <span aria-hidden="true" className="flex items-center text-[9px] font-medium text-[#8B98B5]">
              {row % 2 === 0 ? t(`practiceProgress.streak.day.${row}`) : ""}
            </span>
            {weeks.map(({ week, days }) => {
              const day = days[row];
              const activity = day.activity;
              const valid = activity?.valid ?? 0;
              const label = [
                shortDate(day.date, locale),
                valid > 0
                  ? fill(t("practiceProgress.streak.dayValid"), { n: valid })
                  : activity?.started
                    ? t("practiceProgress.streak.dayStarted")
                    : t("practiceProgress.streak.dayNone"),
                activity?.fixed ? fill(t("practiceProgress.streak.dayFixed"), { n: activity.fixed }) : null,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <span
                  key={`${week.weekStart}-${row}`}
                  title={day.future ? undefined : label}
                  role={day.future ? undefined : "img"}
                  aria-label={day.future ? undefined : label}
                  className={cn(
                    "mx-auto block aspect-square w-full max-w-[22px] rounded-[4px]",
                    day.future
                      ? "bg-transparent"
                      : valid >= 2
                        ? "bg-[#183275]"
                        : valid === 1
                          ? "bg-[#4D6FC4]"
                          : activity?.started
                            ? "bg-[#DCE4F3]"
                            : "bg-[#F1F4FA]",
                    activity?.fixed && "ring-2 ring-inset ring-[#2E9E5B]",
                    day.date === today && "outline outline-1 outline-offset-1 outline-[#14244B]",
                  )}
                />
              );
            })}
          </Fragment>
        ))}
        <span aria-hidden="true" />
        {weeks.map(({ week }) => (
          <span key={`m-${week.weekStart}`} className="flex h-4 items-center justify-center">
            <span className="sr-only">
              {fill(t("practiceProgress.streak.weekSummary"), {
                date: shortDate(week.weekStart, locale),
                state: t(
                  `practiceProgress.streak.week.${week.current ? "current" : week.met ? "met" : week.frozen ? "frozen" : week.repaired ? "repaired" : "missed"}`,
                ),
              })}
            </span>
            <span aria-hidden="true" className="inline-flex">
              {week.frozen ? (
                <Snowflake className="size-3 text-[#2C6CB0]" />
              ) : week.progress ? (
                <Sparkles className="size-3 text-[#2E9E5B]" />
              ) : (week.met || week.repaired) && !week.current ? (
                <span className="block h-1 w-3 rounded-full bg-[#204195]" />
              ) : null}
            </span>
          </span>
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#607096]">
        <li className="flex items-center gap-1">
          <span className="size-2.5 rounded-[3px] bg-[#4D6FC4]" aria-hidden="true" />
          {t("practiceProgress.streak.legend.valid")}
        </li>
        <li className="flex items-center gap-1">
          <span className="size-2.5 rounded-[3px] bg-[#DCE4F3]" aria-hidden="true" />
          {t("practiceProgress.streak.legend.started")}
        </li>
        <li className="flex items-center gap-1">
          <span className="size-2.5 rounded-[3px] bg-[#F1F4FA] ring-2 ring-inset ring-[#2E9E5B]" aria-hidden="true" />
          {t("practiceProgress.streak.legend.fixed")}
        </li>
        <li className="flex items-center gap-1">
          <Snowflake className="size-3 text-[#2C6CB0]" aria-hidden="true" />
          {t("practiceProgress.streak.legend.frozen")}
        </li>
      </ul>
      <p className="mt-3 text-xs text-[#607096]">
        {streak.freezeAvailableThisMonth ? t("practiceProgress.streak.freezeAvailable") : t("practiceProgress.streak.freezeUsed")}{" "}
        {progressWeeks > 0 && fill(t("practiceProgress.streak.progressWeeks"), { n: progressWeeks })}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#EAEFF8] pt-4">
        <span className="text-xs font-semibold text-[#14244B]">{t("practiceProgress.streak.goal")}</span>
        <div className="flex gap-1" role="radiogroup" aria-label={t("practiceProgress.streak.goal")}>
          {GOALS.map((goal) => (
            <button
              key={goal}
              type="button"
              role="radio"
              aria-checked={progress.weeklyGoal === goal}
              disabled={savingGoal}
              onClick={() => onGoal(goal)}
              className={cn(
                "size-8 rounded-lg text-xs font-bold transition-colors disabled:opacity-60",
                progress.weeklyGoal === goal
                  ? "bg-[#204195] text-white"
                  : "bg-[#F8FAFC] text-[#14244B] ring-1 ring-[#DCE4F3] hover:bg-[#F0F4FC]",
              )}
            >
              {goal}
            </button>
          ))}
        </div>
        <span className="text-xs text-[#607096]">{t("practiceProgress.streak.goalUnit")}</span>
      </div>
    </section>
  );
}
