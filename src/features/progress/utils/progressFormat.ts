import type { Milestone, PracticeTier, TrendStatus } from "../services/progress.service";

type Translate = (key: string) => string;

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

/** "19/10" (vi) or "10/19" (en), the same in every runtime. */
export function shortDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return locale.toLowerCase().startsWith("en") ? `${month}/${day}` : `${day}/${month}`;
}

/** "10/2026" style month label for folded (monthly) chart points. */
export function monthLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

export function longDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
}

export function tierLabel(tier: PracticeTier | undefined, t: Translate): string {
  return t(`practiceProgress.tier.${tier ?? "standard"}`);
}

export function trendLabel(status: TrendStatus, t: Translate): string {
  return t(`practiceProgress.trend.${status}`);
}

/** Up is good for scores and the first-try rate; the caller flips it for "fewer is better" counts. */
export function trendTone(status: TrendStatus): "good" | "bad" | "neutral" {
  return status === "up" ? "good" : status === "down" ? "bad" : "neutral";
}

export function milestoneText(milestone: Milestone, t: Translate): string {
  return fill(t(`practiceProgress.milestone.${milestone.kind}`), {
    job: milestone.jobTitle ?? "",
    tier: tierLabel(milestone.tier, t),
    skill: milestone.skill ?? "",
    score: milestone.score ?? "",
  });
}

export function percent(rate: number | null | undefined): string {
  return rate === null || rate === undefined ? "—" : `${Math.round(rate * 100)}%`;
}
