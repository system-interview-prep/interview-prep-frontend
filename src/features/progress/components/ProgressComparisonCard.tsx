"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Target, TrendingUp } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { localeOf } from "@/i18n/format";
import { progressApi, type ProgressComparison } from "../services/progress.service";
import { fill, longDate, percent, tierLabel } from "../utils/progressFormat";

/**
 * "So với lần trước" on the report: 2–3 things that improved and one to keep
 * practising, against the previous graded interview (same position when there
 * is one). Renders nothing for a first interview or when loading fails.
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
  ].filter((line): line is string => Boolean(line));
  const nothing = comparison.improvedSkills.length === 0 && habitLines.length === 0 && !(overall && overall.status !== "flat");

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
