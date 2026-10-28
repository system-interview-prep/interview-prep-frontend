"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookOpenCheck, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import { ConfirmDialog } from "@components/shared/ConfirmDialog";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminSection from "./primitives/AdminSection";
import AdminEmptyState from "./primitives/AdminEmptyState";
import {
  approveLock,
  groupEntries,
  playbookService,
  STATUS_ORDER,
  STATUS_TONE,
  type PlaybookEntry,
  type PlaybookStatus,
  type PlaybookStep,
  type PlaybookView,
} from "@features/admin/services/playbook.service";

const STEPS: PlaybookStep[] = ["all", "evaluate_answer", "probe", "clarify"];
const POLL_MS = 3000;

function named(t: (key: string) => string, key: string, fallback: string): string {
  const text = t(key);
  return text && text !== key ? text : fallback;
}

function StatusBadge({ status }: { status: PlaybookStatus }) {
  const { t } = useLanguage();
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[status]}`}>
      {named(t, `playbook.status.${status}`, status)}
    </span>
  );
}

function dateOf(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleDateString("vi-VN") : "";
}

/** "Quyết định bởi Lan · 28/10/2026", or just the date when the name is unknown. */
function decisionLine(t: (key: string) => string, entry: PlaybookEntry): string | null {
  if (!entry.decidedAt) return null;
  const date = dateOf(entry.decidedAt);
  return entry.decidedBy ? fmt(t("playbook.decided"), { name: entry.decidedBy, date }) : fmt(t("playbook.decidedAt"), { date });
}

function ProposalCard({
  entry,
  replaced,
  onDone,
}: {
  entry: PlaybookEntry;
  replaced?: PlaybookEntry;
  onDone: () => void;
}) {
  const { t } = useLanguage();
  const op = entry.source.op ?? "ADD";
  const [text, setText] = useState(entry.text);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<"APPROVE" | "REJECT" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lock = approveLock(entry);

  const decide = async () => {
    if (!confirm) return;
    setBusy(true);
    setError(null);
    try {
      await playbookService.decide(entry.id, confirm, { text: op === "RETIRE" ? undefined : text });
      onDone();
    } catch (err) {
      const own = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail === "own_entry";
      setError(t(own ? "playbook.own" : "playbook.error"));
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  return (
    <li className="space-y-2 rounded-2xl border border-[#DCE4F3] bg-white p-4 text-sm text-[#14244B]">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <StatusBadge status={entry.status} />
        <span className="rounded-full border border-[#F3D9A4] px-2 py-0.5 font-semibold text-[#8A5A00]">{t(`playbook.op.${op}`)}</span>
        <span className="rounded-full bg-[#EEF2FD] px-2 py-0.5 font-semibold text-[#204195]">{t(`playbook.step.${entry.step}`)}</span>
        <span className="text-[#607096]">
          {entry.origin === "manual"
            ? entry.createdBy
              ? fmt(t("playbook.by"), { name: entry.createdBy })
              : t("playbook.manual")
            : t("playbook.byAi")}
          {entry.createdAt ? ` · ${dateOf(entry.createdAt)}` : ""}
        </span>
      </div>
      {replaced ? (
        <p className="text-xs text-[#607096]">
          <span className="font-semibold">{t("playbook.replaces")}: </span>
          <span className="line-through">{replaced.text}</span>
        </p>
      ) : null}
      {op === "RETIRE" ? (
        <p className="font-semibold">{entry.text}</p>
      ) : (
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={400} className="w-full rounded-xl border border-[#DCE4F3] p-2 text-sm" aria-label={t("playbook.text")} />
      )}
      {entry.source.why ? <p className="text-xs text-[#475569]"><span className="font-semibold">{t("playbook.why")}: </span>{entry.source.why}</p> : null}
      {entry.source.cases?.length ? (
        <p className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-[#607096]">
          <span className="font-semibold">{t("playbook.cases")}:</span>
          {entry.source.cases.map((c) =>
            c.sessionId ? (
              <Link key={c.case} href={`/admin/interviews/${encodeURIComponent(c.sessionId)}`} className="text-[#204195] hover:underline">
                {c.case}
                {c.flags?.length ? ` (${c.flags.join(", ")})` : ""}
              </Link>
            ) : (
              <span key={c.case}>{c.case}</span>
            ),
          )}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy || Boolean(lock) || (op !== "RETIRE" && text.trim().length < 5)} title={lock ? t("playbook.own") : undefined} onClick={() => setConfirm("APPROVE")} className="rounded-full bg-[#204195] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#183275] disabled:opacity-50">
          {t(op === "RETIRE" ? "playbook.approveRetire" : "playbook.approve")}
        </button>
        <button type="button" disabled={busy} onClick={() => setConfirm("REJECT")} className="rounded-full border border-[#DCE4F3] px-3 py-1.5 text-xs font-semibold text-[#607096] hover:text-[#204195] disabled:opacity-50">
          {t("playbook.reject")}
        </button>
      </div>
      {lock ? <p className="text-xs text-[#8A5A00]">{t("playbook.own")}</p> : null}
      {error ? <p className="text-xs font-semibold text-[#C43B3B]">{error}</p> : null}
      <ConfirmDialog
        open={confirm !== null}
        title={confirm === "REJECT" ? t("playbook.confirm.reject") : t(op === "RETIRE" ? "playbook.confirm.retire" : "playbook.confirm.approve")}
        body={confirm === "APPROVE" ? t("playbook.confirm.approveBody") : null}
        confirmLabel={confirm === "REJECT" ? t("playbook.reject") : t("playbook.approve")}
        cancelLabel={t("adminOps.cancel")}
        busy={busy}
        onConfirm={() => void decide()}
        onCancel={() => setConfirm(null)}
      />
    </li>
  );
}

/**
 * "Sổ tay người phỏng vấn": the interviewer gets better from past interviews.
 * A reflection run reads flagged and reviewed turns and proposes small lessons;
 * an admin approves them, and only approved lessons reach the prompts.
 */
export default function InterviewerPlaybookClient() {
  const { t } = useLanguage();
  const [data, setData] = useState<PlaybookView | null>(null);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const [days, setDays] = useState(14);
  const [retireId, setRetireId] = useState<string | null>(null);
  const [form, setForm] = useState<{ step: PlaybookStep; text: string; skill: string }>({ step: "probe", text: "", skill: "" });
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const refresh = useCallback(() => setReload((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    playbookService
      .view()
      .then((view) => !cancelled && (setData(view), setError(false)))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const running = Boolean(data?.run.running);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(timer);
  }, [running, refresh]);

  const startReflection = async () => {
    try {
      await playbookService.reflect(days);
    } finally {
      refresh();
    }
  };

  const addManual = async () => {
    setFormMessage(null);
    try {
      await playbookService.add({ step: form.step, text: form.text.trim(), skill: form.skill.trim() || undefined });
      setForm((current) => ({ ...current, text: "", skill: "" }));
      setFormMessage(t("playbook.add.done"));
      refresh();
    } catch {
      setFormMessage(t("playbook.error"));
    }
  };

  const retire = async () => {
    if (!retireId) return;
    try {
      await playbookService.decide(retireId, "RETIRE");
    } finally {
      setRetireId(null);
      refresh();
    }
  };

  const header = (
    <AdminPageHeader
      title={t("playbook.title")}
      description={t("playbook.subtitle")}
      breadcrumbs={[{ label: "Quản trị", href: "/admin/dashboard" }, { label: t("playbook.title") }]}
    />
  );
  if (error) return <div className="space-y-6">{header}<AdminEmptyState variant="error" title={t("playbook.loadError")} description="" onRetry={refresh} /></div>;
  if (!data) return <div className="space-y-6">{header}<p className="text-sm text-[#607096]">{t("admin.common.loading")}</p></div>;

  if (data.needsMigration)
    return (
      <div className="space-y-6">
        {header}
        <AdminEmptyState variant="error" title={t("playbook.migration.title")} description={t("playbook.migration.body")} onRetry={refresh} />
      </div>
    );
  const groups = groupEntries(data.entries);
  const byId = new Map(data.entries.map((e) => [e.id, e]));
  const run = data.run;

  return (
    <div className="space-y-6">
      {header}

      <AdminSection title={t("playbook.how.title")} description={t("playbook.how.body")}>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded-full bg-[#EEF2FD] px-3 py-1 font-semibold text-[#204195]">
            {data.version ? fmt(t("playbook.version"), { v: data.version, n: groups.ACTIVE.length }) : t("playbook.versionEmpty")}
          </span>
          <label className="inline-flex items-center gap-2 text-[#475569]">
            {t("playbook.reflect.days")}
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-lg border border-[#DCE4F3] px-2 py-1">
              {[7, 14, 30, 90].map((n) => <option key={n} value={n}>{fmt(t("playbook.reflect.daysValue"), { n })}</option>)}
            </select>
          </label>
          <button type="button" disabled={running} onClick={() => void startReflection()} className="inline-flex items-center gap-2 rounded-full bg-[#204195] px-4 py-2 font-semibold text-white hover:bg-[#183275] disabled:opacity-60">
            {running ? <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <BookOpenCheck className="size-3.5" aria-hidden="true" />}
            {running ? t("playbook.reflect.running") : t("playbook.reflect.button")}
          </button>
        </div>
        {!run.running && run.finishedAt ? (
          <p role="status" className={`mt-2 text-xs ${run.error ? "text-[#C43B3B]" : "text-[#1F7A4D]"}`}>
            {run.error
              ? fmt(t("playbook.reflect.error"), { error: run.error })
              : fmt(t("playbook.reflect.done"), {
                  cases: run.cases ?? 0,
                  bad: run.verdicts?.bad ?? 0,
                  good: run.verdicts?.good ?? 0,
                  proposed: run.proposed ?? 0,
                })}
          </p>
        ) : null}
        <p className="mt-2 text-[11px] leading-4 text-[#8A98B8]">{t("playbook.regression")}</p>
      </AdminSection>

      <AdminSection title={t("playbook.lifecycle.title")} description={t("playbook.lifecycle.body")}>
        <ul className="flex flex-wrap gap-2" aria-label={t("playbook.lifecycle.title")}>
          {STATUS_ORDER.map((status) => (
            <li key={status} className="inline-flex items-center gap-2 rounded-xl border border-[#EAEFF8] px-3 py-2 text-xs text-[#14244B]">
              <StatusBadge status={status} />
              <span className="font-semibold tabular-nums">{groups[status].length}</span>
            </li>
          ))}
        </ul>
      </AdminSection>

      <AdminSection title={fmt(t("playbook.proposed"), { n: groups.PROPOSED.length })}>
        {groups.PROPOSED.length === 0 ? (
          <p className="text-xs text-[#607096]">{t("playbook.proposedEmpty")}</p>
        ) : (
          <ul className="space-y-3">
            {groups.PROPOSED.map((entry) => (
              <ProposalCard key={entry.id} entry={entry} replaced={entry.replacesId ? byId.get(entry.replacesId) : undefined} onDone={refresh} />
            ))}
          </ul>
        )}
      </AdminSection>

      <AdminSection title={fmt(t("playbook.active"), { n: groups.ACTIVE.length })} description={t("playbook.activeNote")}>
        {groups.ACTIVE.length === 0 ? (
          <p className="text-xs text-[#607096]">{t("playbook.activeEmpty")}</p>
        ) : (
          <ul className="divide-y divide-[#EAEFF8] rounded-xl border border-[#EAEFF8]">
            {groups.ACTIVE.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-start gap-2 p-3 text-sm">
                <StatusBadge status={entry.status} />
                <span className="shrink-0 rounded-full bg-[#EEF2FD] px-2 py-0.5 text-[11px] font-semibold text-[#204195]">{t(`playbook.step.${entry.step}`)}</span>
                <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                  {entry.text}
                  {entry.skill ? <span className="ml-1 text-xs text-[#607096]">({entry.skill})</span> : null}
                  {decisionLine(t, entry) ? <span className="block text-[11px] text-[#8A98B8]">{decisionLine(t, entry)}</span> : null}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-[#607096]" title={t("playbook.countersHint")}>
                  {fmt(t("playbook.counters"), { helpful: entry.helpful, harmful: entry.harmful })}
                </span>
                <button type="button" onClick={() => setRetireId(entry.id)} className="shrink-0 text-xs font-semibold text-[#C43B3B] hover:underline">
                  {t("playbook.retire")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </AdminSection>

      <AdminSection title={t("playbook.add.title")} description={t("playbook.add.note")}>
        <div className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)_12rem_auto] sm:items-end">
          <label className="text-xs font-semibold text-[#607096]">
            {t("playbook.add.step")}
            <select value={form.step} onChange={(e) => setForm({ ...form, step: e.target.value as PlaybookStep })} className="mt-1 w-full rounded-lg border border-[#DCE4F3] px-2 py-1.5 text-sm text-[#14244B]">
              {STEPS.map((step) => <option key={step} value={step}>{t(`playbook.step.${step}`)}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-[#607096]">
            {t("playbook.text")}
            <input value={form.text} maxLength={400} onChange={(e) => setForm({ ...form, text: e.target.value })} className="mt-1 w-full rounded-lg border border-[#DCE4F3] px-2 py-1.5 text-sm text-[#14244B]" />
          </label>
          <label className="text-xs font-semibold text-[#607096]">
            {t("playbook.add.skill")}
            <input value={form.skill} maxLength={160} onChange={(e) => setForm({ ...form, skill: e.target.value })} className="mt-1 w-full rounded-lg border border-[#DCE4F3] px-2 py-1.5 text-sm text-[#14244B]" />
          </label>
          <button type="button" disabled={form.text.trim().length < 5} onClick={() => void addManual()} className="rounded-full border border-[#204195] px-4 py-2 text-xs font-semibold text-[#204195] hover:bg-[#EEF2FD] disabled:opacity-50">
            {t("playbook.add.button")}
          </button>
        </div>
        {formMessage ? <p className="mt-2 text-xs text-[#475569]">{formMessage}</p> : null}
      </AdminSection>

      {groups.RETIRED.length + groups.REJECTED.length > 0 ? (
        <details className="rounded-2xl border border-[#DCE4F3] bg-white p-4 text-sm">
          <summary className="cursor-pointer text-xs font-semibold text-[#607096]">
            {fmt(t("playbook.history"), { retired: groups.RETIRED.length, rejected: groups.REJECTED.length })}
          </summary>
          <ul className="mt-2 space-y-1 text-xs text-[#607096]">
            {[...groups.RETIRED, ...groups.REJECTED].map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-start gap-2">
                <StatusBadge status={entry.status} />
                <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                  {entry.text}
                  {entry.note && entry.note !== "retire_applied" && entry.note !== "replaced" ? ` · ${entry.note}` : ""}
                  {decisionLine(t, entry) ? <span className="block text-[11px] text-[#8A98B8]">{decisionLine(t, entry)}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <ConfirmDialog
        open={retireId !== null}
        title={t("playbook.confirm.retireActive")}
        confirmLabel={t("playbook.retire")}
        cancelLabel={t("adminOps.cancel")}
        tone="danger"
        onConfirm={() => void retire()}
        onCancel={() => setRetireId(null)}
      />
    </div>
  );
}
