"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/utils";
import type { Activity, Garden } from "../services/progress.service";
import { fill } from "../utils/progressFormat";
import { isoDay, parseDay } from "./StreakCard";

/** Practised days needed to reach each stage (seed → in bloom). */
export const GARDEN_STAGE_DAYS = [0, 1, 3, 7, 14, 30] as const;
const DAY_MS = 86_400_000;
const POURED_KEY = "intervia:garden:poured";
const POUR_MS = 3000;
/** Horizontal scatter of the poured drops, in px (fixed so renders match). */
const POUR_OFFSETS = [-6, 4, -2, 7, -8, 1, 5, -4, 8, -1, 3, -7];

const LEAF = "#3C9A62";
const LEAF_DARK = "#287A4B";
const SOIL = "#8A6A4A";
const SOIL_DARK = "#6F5338";
const SEED = "#D9B77E";
const YELLOW = "#FCB625";
const PETAL = "#F2971B";
const WATER = "#4F8FE0";
const BRAND = "#204195";

export function gardenStage(days: number): number {
  let stage = 0;
  GARDEN_STAGE_DAYS.forEach((needed, index) => {
    if (days >= needed) stage = index;
  });
  return stage;
}

/** Where the plant stands between its stage and the next one. */
export function gardenProgress(days: number): { stage: number; remaining: number; percent: number } {
  const stage = gardenStage(days);
  const next = GARDEN_STAGE_DAYS[stage + 1];
  if (next === undefined) return { stage, remaining: 0, percent: 100 };
  const from = GARDEN_STAGE_DAYS[stage];
  return { stage, remaining: next - days, percent: Math.round(((days - from) / (next - from)) * 100) };
}

/** The last 7 days ending today; `weekday` is 0 for Monday. */
export function lastSevenDays(
  today: string,
  activity: Activity | undefined,
  wateredToday: boolean,
): { date: string; weekday: number; watered: boolean; today: boolean }[] {
  const valid = new Set((activity?.days ?? []).filter((day) => day.valid > 0).map((day) => day.date));
  const end = parseDay(today).getTime() + 12 * 3_600_000;
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(end - (6 - index) * DAY_MS);
    const date = isoDay(day);
    const isToday = date === today;
    return { date, weekday: (day.getDay() + 6) % 7, watered: isToday ? wateredToday : valid.has(date), today: isToday };
  });
}

function Drop({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 18" aria-hidden="true" className={className}>
      <path d="M8 1C8 1 2 8.5 2 12a6 6 0 0 0 12 0C14 8.5 8 1 8 1Z" fill={WATER} stroke={WATER} strokeWidth="1.5" />
      <path d="M5.2 11.6a2.9 2.9 0 0 0 2.2 2.6" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function Leaf({ y, angle, size, dark }: { y: number; angle: number; size: number; dark?: boolean }) {
  const s = size;
  return (
    <g transform={`translate(100,${y}) rotate(${angle})`}>
      <path
        d={`M0 0C${s * 0.3} ${-s * 0.5},${s * 0.8} ${-s * 0.45},${s} 0C${s * 0.8} ${s * 0.45},${s * 0.3} ${s * 0.5},0 0Z`}
        fill={dark ? LEAF_DARK : LEAF}
      />
    </g>
  );
}

function Sunflower() {
  const cx = 96;
  const cy = 50;
  const ring = Array.from({ length: 16 }, (_, k) => k);
  return (
    <>
      {ring.map((k) => (
        <ellipse key={`o${k}`} cx={cx} cy={cy - 24} rx="6.5" ry="14" fill={YELLOW} transform={`rotate(${k * 22.5} ${cx} ${cy})`} />
      ))}
      {ring.map((k) => (
        <ellipse key={`i${k}`} cx={cx} cy={cy - 19} rx="5" ry="11" fill={PETAL} transform={`rotate(${k * 22.5 + 11.25} ${cx} ${cy})`} />
      ))}
      <circle cx={cx} cy={cy} r="17" fill={SOIL_DARK} />
      <circle cx={cx} cy={cy} r="10" fill={SOIL} />
      {Array.from({ length: 12 }, (_, k) => (
        <circle
          key={`s${k}`}
          cx={(cx + 13.5 * Math.cos((k * Math.PI) / 6)).toFixed(1)}
          cy={(cy + 13.5 * Math.sin((k * Math.PI) / 6)).toFixed(1)}
          r="1.3"
          fill={SEED}
        />
      ))}
      <g className="garden-scent" fill="none" stroke={YELLOW} strokeWidth="2.2" strokeLinecap="round">
        <path d="M44 74c5-5-5-10 0-16" />
        <path d="M48 30c5-5-5-10 0-16" />
        <path d="M152 92c5-5-5-10 0-16" />
      </g>
    </>
  );
}

/** The plant at one of the six stages, drawn on a 200×200 box with the soil at the bottom. */
export function GardenPlant({ stage, label, className }: { stage: number; label: string; className?: string }) {
  const height = [0, 22, 46, 74, 104, 104][stage] ?? 0;
  const top = 158 - height;
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={label} className={className}>
      {stage > 0 && (
        <path
          d={`M100 158C${100 - height * 0.06} ${158 - height * 0.5},${100 + height * 0.06} ${158 - height * 0.8},100 ${top}`}
          fill="none"
          stroke={LEAF_DARK}
          strokeWidth={3 + stage * 0.6}
          strokeLinecap="round"
        />
      )}
      {stage === 1 && (
        <>
          <Leaf y={top} angle={-150} size={12} />
          <Leaf y={top} angle={-30} size={12} />
        </>
      )}
      {stage >= 2 && stage < 5 && (
        <>
          <Leaf y={top + 2} angle={-155} size={26} />
          <Leaf y={top + 2} angle={-25} size={26} />
        </>
      )}
      {stage >= 3 && stage < 5 && (
        <>
          <Leaf y={top + 28} angle={-170} size={30} dark />
          <Leaf y={top + 28} angle={-10} size={30} dark />
          <Leaf y={top} angle={-90} size={16} />
        </>
      )}
      {stage >= 4 && (
        <>
          <Leaf y={top + 58} angle={-165} size={36} />
          <Leaf y={top + 58} angle={-15} size={36} />
          <Leaf y={top + 84} angle={-175} size={30} dark />
          <Leaf y={top + 84} angle={-5} size={30} dark />
        </>
      )}
      {stage >= 5 && <Sunflower />}
      <ellipse cx="100" cy="170" rx="78" ry="16" fill={SOIL} />
      <ellipse cx="100" cy="174" rx="78" ry="13" fill={SOIL_DARK} />
      {stage === 0 && <ellipse cx="100" cy="160" rx="11" ry="8" fill={SEED} transform="rotate(-18 100 160)" />}
    </svg>
  );
}

function WateringCan({ pouring }: { pouring: boolean }) {
  return (
    <svg
      viewBox="0 0 96 72"
      aria-hidden="true"
      className={cn("garden-can absolute left-[64%] top-[3%] h-auto w-[30%]", pouring && "garden-can-pour")}
    >
      <path d="M40 32L13 15" fill="none" stroke={BRAND} strokeWidth="7" strokeLinecap="round" />
      <ellipse cx="11" cy="13" rx="5" ry="9" transform="rotate(-35 11 13)" fill={YELLOW} />
      <path d="M76 30C95 30 95 56 76 56" fill="none" stroke={BRAND} strokeWidth="6" strokeLinecap="round" />
      <rect x="36" y="22" width="42" height="44" rx="9" fill={BRAND} />
      <rect x="36" y="35" width="42" height="6" fill={YELLOW} />
    </svg>
  );
}

/**
 * The practice garden: a plant that grows with the days practised. It only
 * shows figures the progress API reports (valid days, today, day streak), so a
 * session without real answers never waters it. The pour plays once, the first
 * time the page is opened after practising that day; between pours the can
 * drips one drop at a time.
 */
export function GardenCard({ garden, activity }: { garden: Garden; activity?: Activity }) {
  const { t } = useLanguage();
  const today = activity?.to ?? isoDay(new Date());
  const [pouring, setPouring] = useState(false);

  useEffect(() => {
    if (!garden.wateredToday) return;
    try {
      if (window.localStorage.getItem(POURED_KEY) === today) return;
      window.localStorage.setItem(POURED_KEY, today);
    } catch {
      return; // No storage: skip the pour instead of replaying it on every visit.
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = window.setTimeout(() => setPouring(true), 0);
    const end = window.setTimeout(() => setPouring(false), POUR_MS);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(end);
    };
  }, [garden.wateredToday, today]);

  const { stage, remaining, percent } = gardenProgress(garden.days);
  // While the water falls the plant is still yesterday's; it grows when the pour ends.
  const shownStage = pouring ? gardenStage(Math.max(0, garden.days - 1)) : stage;
  const stageName = (index: number) => t(`practiceProgress.garden.stage.${index}`);
  const week = lastSevenDays(today, activity, garden.wateredToday);

  return (
    <section className="min-w-0 rounded-2xl border border-[#DCE4F3] bg-white p-5 sm:p-6">
      <div className="grid gap-5 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl font-bold text-[#14244B] sm:text-4xl">{stageName(stage)}</h2>
              <p className="mt-1 text-sm text-[#607096]">{fill(t("practiceProgress.garden.days"), { n: garden.days })}</p>
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                garden.wateredToday ? "bg-[#EAF5EE] text-[#287A4B]" : "bg-[#FFF6DF] text-[#5A3D00]",
              )}
            >
              {t(garden.wateredToday ? "practiceProgress.garden.watered" : "practiceProgress.garden.notWatered")}
            </span>
          </div>

          <div className="rounded-2xl border border-[#DCE4F3] bg-[#F7F9FD] p-4">
            <div className="flex items-center justify-between gap-3 text-sm font-semibold text-[#14244B]">
              <span>
                {remaining > 0
                  ? fill(t("practiceProgress.garden.next"), { n: remaining, stage: stageName(stage + 1) })
                  : t("practiceProgress.garden.full")}
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs tabular-nums text-[#607096] ring-1 ring-[#DCE4F3]">{percent}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white ring-1 ring-[#DCE4F3]">
              <div className="h-full rounded-full bg-[#3C9A62]" style={{ width: `${percent}%` }} />
            </div>
            <ol className="mt-4 grid grid-cols-6 gap-1">
              {GARDEN_STAGE_DAYS.map((_, index) => (
                <li
                  key={index}
                  aria-current={index === stage ? "step" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1.5 text-center text-[11px] font-medium text-[#607096]",
                    index === stage && "font-semibold text-[#14244B]",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-[30px] place-items-center rounded-[10px] text-xs font-bold tabular-nums",
                      index < stage && "text-[#287A4B]",
                      index === stage && "bg-[#FCB625] text-[#3A2800]",
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {stageName(index)}
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#DCE4F3] bg-[#F7F9FD] p-4">
            <p className="flex items-baseline gap-2 text-sm font-semibold text-[#14244B]">
              <span className="font-display text-4xl font-bold leading-none tabular-nums">{garden.dayStreak}</span>
              {t("practiceProgress.garden.dayStreak")}
            </p>
            <ul className="grid min-w-[220px] max-w-[300px] flex-1 grid-cols-7 gap-1.5" aria-label={t("practiceProgress.garden.week")}>
              {week.map((day) => (
                <li
                  key={day.date}
                  className={cn("flex flex-col items-center gap-1 text-[11px] text-[#607096]", day.today && "font-semibold text-[#14244B]")}
                >
                  <span
                    className={cn(
                      "grid size-[26px] place-items-center rounded-full border-[1.5px] border-[#DCE4F3]",
                      day.watered && "border-[#3C9A62] bg-[#EAF5EE]",
                      day.today && "border-2 border-[#FCB625]",
                    )}
                  >
                    {day.watered && <Drop className="size-3" />}
                  </span>
                  {t(`practiceProgress.streak.day.${day.weekday}`)}
                  <span className="sr-only">
                    {t(day.watered ? "practiceProgress.garden.watered" : "practiceProgress.garden.notWatered")}
                  </span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <div className="order-first flex min-h-[220px] items-center justify-center overflow-hidden rounded-2xl bg-[#F7F9FD] md:order-none">
          <div className="relative w-[210px] max-w-full md:w-[260px]">
            <GardenPlant key={shownStage} stage={shownStage} label={stageName(shownStage)} className={cn("block h-auto w-full", !pouring && "anim-pop")} />
            <WateringCan pouring={pouring} />
            {pouring ? (
              <div className="garden-track pointer-events-none absolute left-[59%] top-[21%] h-[53%] w-0" aria-hidden="true">
                {POUR_OFFSETS.map((offset, index) => (
                  <span
                    key={index}
                    className="garden-fall absolute top-0 block w-[18px]"
                    style={{ left: offset - 9, animationDelay: `${0.55 + index * 0.13}s` }}
                  >
                    <Drop className="block h-auto w-full" />
                  </span>
                ))}
                {[0, 1, 2, 3].map((index) => (
                  <i
                    key={index}
                    className="garden-splash absolute left-[-15px] top-full mt-2 block h-[9px] w-[30px] rounded-[50%] border-2 border-[#4F8FE0]"
                    style={{ animationDelay: `${1.5 + index * 0.4}s` }}
                  />
                ))}
              </div>
            ) : (
              <div className="garden-track pointer-events-none absolute left-[65.5%] top-[12%] -ml-2 h-[58%] w-4" aria-hidden="true">
                <span className="garden-drip absolute left-0 top-0 block w-4">
                  <Drop className="block h-auto w-full" />
                </span>
                <i className="garden-ring absolute left-1/2 top-full -ml-[15px] mt-3.5 block h-[9px] w-[30px] rounded-[50%] border-2 border-[#4F8FE0]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
