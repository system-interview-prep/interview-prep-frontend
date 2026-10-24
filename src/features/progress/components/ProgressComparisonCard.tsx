"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Sparkles, Target, TrendingUp } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/utils";
import { localeOf } from "@/i18n/format";
import { progressApi, type ProgressComparison, type Retry } from "../services/progress.service";
import { fill, longDate, percent, tierLabel } from "../utils/progressFormat";
import { recordText } from "./ProgressOverview";

/**
 * "So với lần trước" on the report: what this session did for the first time
 * (checklist evidence), skill level changes, things that improved beyond the
 * session noise, and one to keep practising, against the previous graded
 * interview (same position when there is one). Renders nothing for a first
 * interview or when loading fails.
 */
export function ProgressComparisonCard({ sessionId }: { sessionId: string }) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  const [comparison, setComparison] = useState<ProgressComparison | null>(null);

  useEffect(() => {
    let active = true;
    progressApi
      .compare(sessionId)
      .then((value) => {
        if (active) setComparison(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [sessionId]);

  if (!comparison) return null;
  const { overall, behavior } = comparison;
  const rateBefore = behavior.firstTimeSufficientRate.before;
  const rateNow = behavior.firstTimeSufficientRate.now;
  const habitLines = [
    rateBefore !== null && rateNow !== null && Math.abs(rateNow - rateBefore) >= 0.05
      ? fill(t("practiceProgress.compare.firstTime"), { before: percent(rateBefore), now: percent(rateNow) })
      : null,
    behavior.skipped.before !== behavior.skipped.now
      ? fill(t("practiceProgress.compare.skipped"), { before: behavior.skipped.before, now: behavior.skipped.now })
      : null,
    behavior.coreCoverage &&
    behavior.coreCoverage.before !== null &&
    behavior.coreCoverage.now !== null &&
    Math.abs(behavior.coreCoverage.now - behavior.coreCoverage.before) >= 0.1
      ? fill(t("practiceProgress.compare.coreCoverage"), {
          before: percent(behavior.coreCoverage.before),
          now: percent(behavior.coreCoverage.now),
        })
      : null,
  ].filter((line): line is string => Boolean(line));
  const after = comparison.after ?? null;
  // With the round ladder (backend 24/10) "Sau buổi này" tells level changes and
  // records; the older skill levels and firsts would say the same twice.
  const levelUps = after ? [] : (comparison.levelChanges ?? []).filter((change) => change.to > change.from);
  const levelDowns = after ? [] : (comparison.levelChanges ?? []).filter((change) => change.to < change.from);
  const firsts = after ? [] : (comparison.firsts ?? []);
  const nothing =
    comparison.improvedSkills.length === 0 &&
    habitLines.length === 0 &&
    levelUps.length === 0 &&
    !(overall && overall.status !== "flat");

  return (
    <section className="min-w-0 rounded-2xl border border-[#DCE4F3] bg-white p-5 sm:p-6 print:break-inside-avoid [overflow-wrap:anywhere]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold text-[#14244B]">{t("practiceProgress.compare.title")}</h3>
          <p className="mt-1 text-xs text-[#607096]">
            {fill(t(comparison.sameJob ? "practiceProgress.compare.sameJob" : "practiceProgress.compare.otherJob"), {
              date: longDate(comparison.previousDate, locale),
            })}
          </p>
        </div>
        <Link href="/dashboard/progress" className="inline-flex items-center gap-1 text-xs font-bold text-[#204195] hover:underline print:hidden">
          {t("practiceProgress.compare.link")}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      {after && <AfterSession after={after} />}

      {overall && (
        <p className="mt-4 text-sm font-semibold text-[#14244B]">
          {overall.comparable
            ? fill(t("practiceProgress.compare.overall"), { before: overall.before.toFixed(1), now: overall.now.toFixed(1) })
            : fill(t("practiceProgress.compare.notComparable"), {
                before: tierLabel(comparison.tier.before, t),
                now: tierLabel(comparison.tier.now, t),
              })}
        </p>
      )}

      {(firsts.length > 0 || levelUps.length > 0) && (
        <ul className="mt-4 space-y-1.5 rounded-xl bg-[#F5F8FF] p-3 text-sm text-[#14244B] ring-1 ring-[#DCE4F3]">
          {levelUps.map((change) => (
            <li key={`level-${change.skill}`} className="flex items-start gap-2 font-semibold">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-[#D99A19]" aria-hidden="true" />
              {fill(t("practiceProgress.compare.levelUp"), {
                skill: change.skill,
                level: t(`practiceProgress.level.${change.to}`),
              })}
            </li>
          ))}
          {firsts.map((kind) => (
            <li key={kind} className="flex items-start gap-2">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-[#D99A19]" aria-hidden="true" />
              {t(`practiceProgress.compare.first.${kind}`)}
            </li>
          ))}
        </ul>
      )}

      {(comparison.retries ?? []).length > 0 && (
        <div className="mt-4 space-y-3">
          {(comparison.retries ?? []).map((retry) => (
            <RetryCompare key={`${retry.skill}-${retry.before.sessionId}`} retry={retry} />
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#287A4B]">
            <TrendingUp className="size-4" aria-hidden="true" />
            {t("practiceProgress.compare.improved")}
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-[#14244B]">
            {comparison.improvedSkills.map((item) => (
              <li key={item.skill}>
                {item.skill}: <span className="tabular-nums">{item.before?.toFixed(1)} → {item.now.toFixed(1)}</span>
              </li>
            ))}
            {habitLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
            {nothing && <li className="text-[#607096]">{t("practiceProgress.compare.none")}</li>}
          </ul>
        </div>
        {comparison.focusSkills.length > 0 && (
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8A5A00]">
              <Target className="size-4" aria-hidden="true" />
              {t("practiceProgress.compare.focus")}
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-[#14244B]">
              {levelDowns.map((change) => (
                <li key={`down-${change.skill}`}>
                  {fill(t("practiceProgress.compare.levelDown"), {
                    skill: change.skill,
                    level: t(`practiceProgress.level.${change.to}`),
                  })}
                </li>
              ))}
              {comparison.focusSkills.map((item) => (
                <li key={item.skill}>
                  {item.skill}:{" "}
                  <span className="tabular-nums">
                    {item.before !== undefined ? `${item.before.toFixed(1)} → ` : ""}
                    {item.now.toFixed(1)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

const AFTER_TONE = {
  up: "bg-[#E7F5EC] text-[#1F5C3A]",
  down: "bg-[#FFF1DC] text-[#8A5A0B]",
  same: "bg-[#F1F4FA] text-[#33415F]",
  best: "bg-[#FFF3D6] text-[#7A4E00]",
};

/** "Sau buổi này": rounds that moved a level, rounds kept, records, against the usual level. */
function AfterSession({ after }: { after: NonNullable<ProgressComparison["after"]> }) {
  const { t } = useLanguage();
  const level = (value: number) => t(`practiceProgress.ladder.level.${value}`);
  const round = (area: string) => t(`practiceProgress.area.${area}`);
  const downs = after.levelChanges.filter((change) => change.to < change.from);
  return (
    <div className="mt-4 rounded-xl bg-[#FAFBFE] p-3 ring-1 ring-[#DCE4F3] sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base font-extrabold text-[#14244B]">{t("practiceProgress.after.title")}</p>
        {after.baseline && (
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold",
              AFTER_TONE[after.baseline === "above" ? "up" : after.baseline === "below" ? "down" : "same"],
            )}
          >
            {t(`practiceProgress.timeline.baseline.${after.baseline}`)}
          </span>
        )}
      </div>
      <ul className="mt-3 space-y-2 text-sm text-[#14244B]">
        {after.levelChanges.map((change) => (
          <li key={change.area} className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-lg px-2.5 py-1 text-xs font-bold", AFTER_TONE[change.to > change.from ? "up" : "down"])}>
              {t(change.to > change.from ? "practiceProgress.after.levelUp" : "practiceProgress.after.levelDown")}
            </span>
            {fill(t("practiceProgress.after.change"), { round: round(change.area), from: level(change.from), to: level(change.to) })}
          </li>
        ))}
        {after.kept > 0 && (
          <li className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-lg px-2.5 py-1 text-xs font-bold", AFTER_TONE.same)}>{t("practiceProgress.after.kept")}</span>
            {fill(t("practiceProgress.after.keptLine"), { n: after.kept })}
          </li>
        )}
        {after.records.map((record, index) => (
          <li key={`${record.kind}-${index}`} className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-lg px-2.5 py-1 text-xs font-bold", AFTER_TONE.best)}>{t("practiceProgress.after.record")}</span>
            <span className="min-w-0">
              {recordText(record, t)}
              {record.quote && <span className="italic text-[#33415F]"> “…{record.quote}”</span>}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-[#607096]">
        {after.baseline && t("practiceProgress.after.baselineNote")} {downs.length === 0 && t("practiceProgress.after.noneDown")}
      </p>
    </div>
  );
}

/**
 * "Lần trước – Lần này" (research 24/10): a skill asked again after an answer
 * that missed key points. Two columns with the earlier and the new question;
 * the points are compared one by one only for the very same question. A
 * different question of the same skill is the fairer evidence (a repeated
 * question can be answered from memory), so it shows how much of the new
 * checklist was covered instead.
 */
export function RetryCompare({ retry }: { retry: Retry }) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  const fixed = new Set(retry.fixedPoints);
  return (
    <div className="rounded-xl bg-[#FAFBFE] p-3 ring-1 ring-[#DCE4F3] sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-[#14244B]">
          {fill(t("practiceProgress.retry.title"), { skill: retry.skill })}
        </p>
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#4A5878] ring-1 ring-[#DCE4F3]">
          {t(retry.sameQuestion ? "practiceProgress.retry.same" : "practiceProgress.retry.equivalent")}
        </span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#607096]">
            {fill(t("practiceProgress.retry.before"), { date: longDate(retry.before.date, locale) })}
          </p>
          {!retry.sameQuestion && <p className="mt-1 text-xs italic text-[#4A5878]">{retry.before.question}</p>}
          <ul className="mt-1.5 space-y-1 text-xs">
            {retry.before.missing.map((miss) => (
              <li key={miss.point} className={cn("flex items-start gap-1.5", fixed.has(miss.point) ? "text-[#607096] line-through" : "text-[#8A5A0B]")}>
                <span aria-hidden="true">•</span>
                {fill(t("practiceProgress.retry.missed"), { point: miss.point })}
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#204195]">{t("practiceProgress.retry.now")}</p>
          {!retry.sameQuestion && <p className="mt-1 text-xs italic text-[#4A5878]">{retry.now.question}</p>}
          <ul className="mt-1.5 space-y-1 text-xs">
            {retry.fixedPoints.map((point) => (
              <li key={point} className="flex items-start gap-1.5 font-semibold text-[#1F5C3A]">
                <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                {fill(t("practiceProgress.retry.added"), { point })}
              </li>
            ))}
            {retry.now.total > 0 && (
              <li className="text-[#14244B]">
                {fill(t("practiceProgress.retry.coverage"), { covered: retry.now.covered, total: retry.now.total })}
              </li>
            )}
            {retry.now.missing.map((miss) => (
              <li key={miss.point} className="flex items-start gap-1.5 text-[#8A5A0B]">
                <span aria-hidden="true">•</span>
                {fill(t("practiceProgress.retry.stillMissing"), { point: miss.point })}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {retry.sameQuestion && <p className="mt-2 text-[11px] text-[#607096]">{t("practiceProgress.retry.sameNote")}</p>}
    </div>
  );
}
