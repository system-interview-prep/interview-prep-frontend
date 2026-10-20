"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { ArrowRight, Check, Plus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { localeOf } from "@/i18n/format";
import { cn } from "@/utils";
import { ConfirmDialog } from "@components/shared/ConfirmDialog";
import { useDialogA11y } from "@components/shared/useDialogA11y";
import {
  progressApi,
  type GapItem,
  type JobReadiness,
  type PracticeProgress,
  type RealInterviewInput,
  type RealInterviewReport,
  type RealInterviewResult,
  type RealInterviewStage,
  type RoundStatus,
  type SkillArea,
} from "../services/progress.service";
import { fill, shortDate } from "../utils/progressFormat";
import { FOCUSABLE_AREAS, lastResumeFor, practiceHref } from "../utils/progressModel";

/*
 * Research 20/10 ("Ứng viên có quan tâm không"): before a real interview the
 * candidate asks "am I ready, where am I still weak, what do I practise now",
 * then goes to the real interview. These cards answer those three questions by
 * interview round, and collect what happened in the real interview so the
 * "ready" claim can be checked against real results.
 */

const STATUS_TONE: Record<RoundStatus, string> = {
  ready: "bg-[#E7F5EC] text-[#1F5C3A] ring-[#BFE3CC]",
  almost: "bg-[#EEF3FF] text-[#204195] ring-[#C9D6F5]",
  practice: "bg-[#FFF4E0] text-[#8A5A0B] ring-[#F3D9A6]",
  thin: "bg-[#F4F6FA] text-[#4A5878] ring-[#DCE4F3]",
  unseen: "bg-[#F4F6FA] text-[#4A5878] ring-[#DCE4F3]",
};

function StatusChip({ status }: { status: RoundStatus }) {
  const { t } = useLanguage();
  return (
    <span className={cn("inline-flex shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ring-1", STATUS_TONE[status])}>
      {t(`practiceProgress.rounds.status.${status}`)}
    </span>
  );
}

/** "Sẵn sàng đi phỏng vấn thật chưa?": one row per interview round of the position. */
export function RoundsCard({ progress, job }: { progress: PracticeProgress; job: JobReadiness | null }) {
  const { t } = useLanguage();
  if (!job) {
    return (
      <section className="min-w-0 rounded-2xl border border-[#DCE4F3] bg-white p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-[#14244B]">{t("practiceProgress.rounds.title")}</h2>
        <p className="mt-3 text-xs text-[#607096]">{t("practiceProgress.goals.readyEmpty")}</p>
      </section>
    );
  }
  const counted = job.rounds.filter((round) => round.status !== "unseen");
  const ready = job.rounds.filter((round) => round.status === "ready").length;
  const resumeId = lastResumeFor(progress, job.jobId);
  return (
    <section className="min-w-0 rounded-2xl border border-[#DCE4F3] bg-white p-5 sm:p-6 [overflow-wrap:anywhere]">
      <h2 className="font-display text-lg font-bold text-[#14244B]">{t("practiceProgress.rounds.title")}</h2>
      <p className="mt-1 text-sm font-bold text-[#14244B]">{job.jobTitle ?? job.jobId}</p>
      <div className="mt-2 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#EAEFF8]" aria-hidden="true">
          <div className="h-2 rounded-full bg-[#287A4B]" style={{ width: `${Math.round((ready / Math.max(1, job.rounds.length)) * 100)}%` }} />
        </div>
        <span className="shrink-0 text-xs font-bold tabular-nums text-[#14244B]">
          {fill(t("practiceProgress.rounds.readyValue"), { ready, total: job.rounds.length })}
        </span>
      </div>
      <ul className="mt-4 divide-y divide-[#EEF2F8]">
        {job.rounds.map((round) => {
          const focusable = FOCUSABLE_AREAS.includes(round.area) && round.status !== "ready";
          return (
            <li key={round.area} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#14244B]">{t(`practiceProgress.area.${round.area}`)}</p>
                <StatusChip status={round.status} />
              </div>
              <p className="mt-1 text-xs text-[#607096]">
                {round.status === "unseen"
                  ? t(`practiceProgress.rounds.unseen.${round.area === "project" || round.area === "teamwork" ? "always" : "other"}`)
                  : fill(t("practiceProgress.rounds.line"), {
                      score: round.estimate?.toFixed(1) ?? "—",
                      n: round.sessions,
                      skills: round.skills.map((skill) => skill.label).join(", "),
                    })}
              </p>
              {round.topGap && (
                <p className="mt-1 text-xs text-[#8A5A0B]">
                  {fill(t("practiceProgress.rounds.topGap"), { point: round.topGap.point, n: round.topGap.timesMissed })}
                </p>
              )}
              {focusable && (
                <Link
                  href={practiceHref(job.jobId, resumeId, round.area)}
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-[#204195] hover:underline"
                >
                  {t("practiceProgress.rounds.practice")}
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-[11px] leading-relaxed text-[#607096]">
        {fill(t("practiceProgress.rounds.help"), { n: counted.length, sessions: job.sessions })}
      </p>
    </section>
  );
}

const GAPS_SHOWN = 6;

/** "Sổ ôn tập": key points the candidate keeps leaving out, and the ones they fixed. */
export function GapNotebookCard({ gaps }: { gaps: { open: GapItem[]; fixed: GapItem[] } }) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  const [shown, setShown] = useState(GAPS_SHOWN);
  if (gaps.open.length === 0 && gaps.fixed.length === 0) return null;
  return (
    <section className="min-w-0 rounded-2xl border border-[#DCE4F3] bg-white p-5 sm:p-6 [overflow-wrap:anywhere]">
      <h2 className="font-display text-lg font-bold text-[#14244B]">{t("practiceProgress.gaps.title")}</h2>
      <p className="mt-1 text-xs text-[#607096]">{t("practiceProgress.gaps.desc")}</p>
      {gaps.open.length === 0 ? (
        <p className="mt-4 text-sm text-[#287A4B]">{t("practiceProgress.gaps.none")}</p>
      ) : (
        <ol className="mt-4 grid gap-3 md:grid-cols-2">
          {gaps.open.slice(0, shown).map((gap) => (
            <li key={`${gap.skillKey}-${gap.point}`} className="rounded-xl p-3 ring-1 ring-[#EAEFF8]">
              <p className="text-sm font-semibold text-[#14244B]">{gap.point}</p>
              <p className="mt-1 text-[11px] text-[#607096]">
                {fill(t("practiceProgress.gaps.meta"), {
                  round: t(`practiceProgress.area.${gap.area}`),
                  skill: gap.skill,
                  missed: gap.timesMissed,
                  asked: gap.timesAsked,
                })}
              </p>
              {gap.lastSeen.question && (
                <p className="mt-1.5 line-clamp-2 text-xs text-[#33415F]">
                  {fill(t("practiceProgress.gaps.question"), { question: gap.lastSeen.question })}
                </p>
              )}
              <Link href={`/interview/results/${gap.lastSeen.sessionId}`} className="mt-1 inline-block text-[11px] font-semibold hover:underline">
                {fill(t("practiceProgress.skills.openReport"), { date: shortDate(gap.lastSeen.date, locale) })}
              </Link>
            </li>
          ))}
        </ol>
      )}
      {gaps.open.length > shown && (
        <button
          type="button"
          onClick={() => setShown((n) => n + GAPS_SHOWN)}
          className="mt-3 inline-flex h-9 items-center rounded-xl px-4 text-xs font-bold text-[#204195] ring-1 ring-[#DCE4F3] hover:bg-[#F0F4FC]"
        >
          {fill(t("practiceProgress.skills.showMore"), { n: Math.min(GAPS_SHOWN, gaps.open.length - shown) })}
        </button>
      )}
      {gaps.fixed.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-bold text-[#1F5C3A]">{t("practiceProgress.gaps.fixed")}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {gaps.fixed.map((gap) => (
              <li
                key={`${gap.skillKey}-${gap.point}`}
                className="inline-flex items-center gap-1 rounded-full bg-[#E7F5EC] px-3 py-1 text-xs text-[#1F5C3A] ring-1 ring-[#BFE3CC]"
              >
                <Check className="size-3.5 shrink-0" aria-hidden="true" />
                {fill(t("practiceProgress.gaps.fixedItem"), { point: gap.point, skill: gap.skill })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

const STAGES: RealInterviewStage[] = ["screening", "technical", "final", "other"];
const RESULTS: RealInterviewResult[] = ["passed", "failed", "waiting"];
const ASKABLE: SkillArea[] = ["project", "language", "framework", "data", "api", "infra", "ai", "teamwork"];
const RESULT_TONE: Record<RealInterviewResult, string> = {
  passed: "bg-[#E7F5EC] text-[#1F5C3A] ring-[#BFE3CC]",
  failed: "bg-[#FDECEC] text-[#9B2C2C] ring-[#F3C4C4]",
  waiting: "bg-[#F4F6FA] text-[#4A5878] ring-[#DCE4F3]",
};

function today(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** Rounds asked in the real interview that the page had not called ready at the time. */
export function notReadyAtTheTime(report: RealInterviewReport): SkillArea[] {
  const rounds = report.readiness.rounds ?? {};
  return report.askedAreas.filter((area) => {
    const state = rounds[area];
    return state !== undefined && state.status !== "ready";
  });
}

const inputClass =
  "mt-1 h-10 w-full rounded-xl border border-[#DCE4F3] bg-white px-3 text-sm text-[#14244B] focus:outline-none focus:ring-2 focus:ring-[#204195]/30";

function RealInterviewDialog({
  open,
  initial,
  jobs,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial: RealInterviewReport | null;
  jobs: { jobId: string; jobTitle: string | null }[];
  onClose: () => void;
  onSaved: (report: RealInterviewReport) => void;
}) {
  const { t } = useLanguage();
  const titleId = useId();
  const [form, setForm] = useState<RealInterviewInput>(() => ({
    jobId: null,
    company: "",
    date: today(),
    stage: "technical",
    result: "waiting",
    askedAreas: [],
    hardParts: "",
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const panelRef = useDialogA11y<HTMLDivElement>(open, saving ? undefined : onClose);

  useEffect(() => {
    if (!open) return;
    setError(false);
    setForm(
      initial
        ? {
            jobId: initial.jobId,
            company: initial.company ?? "",
            date: initial.date,
            stage: initial.stage,
            result: initial.result,
            askedAreas: initial.askedAreas,
            hardParts: initial.hardParts ?? "",
          }
        : { jobId: jobs[0]?.jobId ?? null, company: "", date: today(), stage: "technical", result: "waiting", askedAreas: [], hardParts: "" },
    );
  }, [open, initial, jobs]);

  if (!open) return null;
  const toggleArea = (area: SkillArea) =>
    setForm((value) => ({
      ...value,
      askedAreas: value.askedAreas.includes(area) ? value.askedAreas.filter((a) => a !== area) : [...value.askedAreas, area],
    }));
  const save = async () => {
    setSaving(true);
    setError(false);
    try {
      onSaved(await progressApi.saveRealInterview(form, initial?.id));
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#14244B]/40 backdrop-blur-[2px]" onClick={saving ? undefined : onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="anim-pop relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-[0_30px_80px_-30px_rgba(20,36,75,0.5)] ring-1 ring-[#DCE4F3] outline-none"
      >
        <h2 id={titleId} className="text-lg font-semibold text-[#14244B]">
          {t(initial ? "practiceProgress.real.editTitle" : "practiceProgress.real.addTitle")}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-[#607096]">
            {t("practiceProgress.real.date")}
            <input
              type="date"
              data-autofocus
              max={today()}
              value={form.date}
              onChange={(event) => setForm((value) => ({ ...value, date: event.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold text-[#607096]">
            {t("practiceProgress.real.company")}
            <input
              type="text"
              maxLength={160}
              value={form.company ?? ""}
              placeholder={t("practiceProgress.real.companyHint")}
              onChange={(event) => setForm((value) => ({ ...value, company: event.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold text-[#607096] sm:col-span-2">
            {t("practiceProgress.real.position")}
            <select
              value={form.jobId ?? ""}
              onChange={(event) => setForm((value) => ({ ...value, jobId: event.target.value || null }))}
              className={inputClass}
            >
              {jobs.map((job) => (
                <option key={job.jobId} value={job.jobId}>
                  {job.jobTitle ?? job.jobId}
                </option>
              ))}
              <option value="">{t("practiceProgress.real.positionOther")}</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-[#607096]">
            {t("practiceProgress.real.stage")}
            <select
              value={form.stage}
              onChange={(event) => setForm((value) => ({ ...value, stage: event.target.value as RealInterviewStage }))}
              className={inputClass}
            >
              {STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {t(`practiceProgress.real.stage.${stage}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-[#607096]">
            {t("practiceProgress.real.result")}
            <select
              value={form.result}
              onChange={(event) => setForm((value) => ({ ...value, result: event.target.value as RealInterviewResult }))}
              className={inputClass}
            >
              {RESULTS.map((result) => (
                <option key={result} value={result}>
                  {t(`practiceProgress.real.result.${result}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset className="mt-4">
          <legend className="text-xs font-semibold text-[#607096]">{t("practiceProgress.real.asked")}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {ASKABLE.map((area) => {
              const on = form.askedAreas.includes(area);
              return (
                <button
                  key={area}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleArea(area)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors",
                    on ? "bg-[#204195] text-white ring-[#204195]" : "bg-white text-[#14244B] ring-[#DCE4F3] hover:bg-[#F0F4FC]",
                  )}
                >
                  {t(`practiceProgress.area.${area}`)}
                </button>
              );
            })}
          </div>
        </fieldset>
        <label className="mt-4 block text-xs font-semibold text-[#607096]">
          {t("practiceProgress.real.hard")}
          <textarea
            rows={3}
            maxLength={2000}
            value={form.hardParts ?? ""}
            placeholder={t("practiceProgress.real.hardHint")}
            onChange={(event) => setForm((value) => ({ ...value, hardParts: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-[#DCE4F3] bg-white px-3 py-2 text-sm text-[#14244B] focus:outline-none focus:ring-2 focus:ring-[#204195]/30"
          />
        </label>
        {error && <p className="mt-3 text-xs font-semibold text-[#9B2C2C]">{t("practiceProgress.real.saveError")}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-11 rounded-full px-5 text-sm font-semibold text-[#14244B] ring-1 ring-[#DCE4F3] hover:bg-[#F8FAFC] disabled:opacity-50"
          >
            {t("practiceProgress.real.cancel")}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !form.date}
            className="h-11 rounded-full bg-[#204195] px-5 text-sm font-semibold text-white hover:bg-[#183275] disabled:opacity-60"
          >
            {t("practiceProgress.real.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

/** "Phỏng vấn thật": what happened outside, next to the readiness the page showed then. */
export function RealInterviewsCard({ progress, initialReports = null }: { progress: PracticeProgress; initialReports?: RealInterviewReport[] | null }) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  const [reports, setReports] = useState<RealInterviewReport[]>(initialReports ?? []);
  const [editing, setEditing] = useState<RealInterviewReport | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removing, setRemoving] = useState<RealInterviewReport | null>(null);
  const [busy, setBusy] = useState(false);
  const jobs = (progress.readiness ?? []).map((job) => ({ jobId: job.jobId, jobTitle: job.jobTitle }));

  useEffect(() => {
    if (initialReports) return;
    let active = true;
    progressApi
      .realInterviews()
      .then((value) => {
        if (active) setReports(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [initialReports]);

  const passed = reports.filter((report) => report.result === "passed").length;
  const titleOf = (jobId: string | null) => jobs.find((job) => job.jobId === jobId)?.jobTitle ?? null;
  const remove = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      await progressApi.deleteRealInterview(removing.id);
      setReports((list) => list.filter((item) => item.id !== removing.id));
      setRemoving(null);
    } catch {
      /* keep it listed */
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="min-w-0 rounded-2xl border border-[#DCE4F3] bg-white p-5 sm:p-6 [overflow-wrap:anywhere]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold text-[#14244B]">{t("practiceProgress.real.title")}</h2>
          <p className="mt-1 max-w-2xl text-xs text-[#607096]">{t("practiceProgress.real.desc")}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#204195] px-4 text-sm font-semibold text-white hover:bg-[#183275]"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t("practiceProgress.real.add")}
        </button>
      </div>
      {reports.length === 0 ? (
        <p className="mt-4 text-sm text-[#607096]">{t("practiceProgress.real.empty")}</p>
      ) : (
        <>
          <p className="mt-3 text-xs font-semibold text-[#14244B]">
            {fill(t("practiceProgress.real.summary"), { n: reports.length, passed })}
          </p>
          <ul className="mt-3 space-y-3">
            {reports.map((report) => {
              const weak = report.result === "failed" ? notReadyAtTheTime(report) : [];
              return (
                <li key={report.id} className="rounded-xl p-3 ring-1 ring-[#EAEFF8]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#14244B]">
                      {[shortDate(report.date, locale), report.company, titleOf(report.jobId), t(`practiceProgress.real.stage.${report.stage}`)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold ring-1", RESULT_TONE[report.result])}>
                      {t(`practiceProgress.real.result.${report.result}`)}
                    </span>
                  </div>
                  {report.askedAreas.length > 0 && (
                    <p className="mt-1 text-xs text-[#607096]">
                      {fill(t("practiceProgress.real.askedLine"), {
                        rounds: report.askedAreas.map((area) => t(`practiceProgress.area.${area}`)).join(", "),
                      })}
                    </p>
                  )}
                  {report.hardParts && <p className="mt-1 text-xs text-[#33415F]">{report.hardParts}</p>}
                  {weak.length > 0 && (
                    <p className="mt-1 text-xs text-[#8A5A0B]">
                      {fill(t("practiceProgress.real.notReady"), {
                        rounds: weak.map((area) => t(`practiceProgress.area.${area}`)).join(", "),
                      })}
                    </p>
                  )}
                  <div className="mt-2 flex gap-3 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(report);
                        setDialogOpen(true);
                      }}
                      className="text-[#204195] hover:underline"
                    >
                      {t(report.result === "waiting" ? "practiceProgress.real.update" : "practiceProgress.real.edit")}
                    </button>
                    <button type="button" onClick={() => setRemoving(report)} className="text-[#9B2C2C] hover:underline">
                      {t("practiceProgress.real.delete")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <RealInterviewDialog
        open={dialogOpen}
        initial={editing}
        jobs={jobs}
        onClose={() => setDialogOpen(false)}
        onSaved={(saved) => {
          setReports((list) =>
            [saved, ...list.filter((item) => item.id !== saved.id)].sort((a, b) => b.date.localeCompare(a.date)),
          );
          setDialogOpen(false);
        }}
      />
      <ConfirmDialog
        open={removing !== null}
        title={t("practiceProgress.real.deleteTitle")}
        body={t("practiceProgress.real.deleteBody")}
        confirmLabel={t("practiceProgress.real.delete")}
        cancelLabel={t("practiceProgress.real.cancel")}
        tone="danger"
        busy={busy}
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </section>
  );
}
