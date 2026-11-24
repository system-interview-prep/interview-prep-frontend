"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import { ConfirmDialog } from "@components/shared/ConfirmDialog";
import { bankInsightsApi, percent, suggestionAbilities, type BankSuggestion } from "@features/admin/services/bankInsights.service";

const SEVERITY_TONE: Record<BankSuggestion["severity"], string> = {
  HIGH: "bg-[#FDF3F3] text-[#C43B3B]",
  MEDIUM: "bg-[#FFF6E0] text-[#8A5A00]",
  LOW: "bg-[#EEF2FD] text-[#204195]",
};

/** The numbers behind a suggestion, in a few short facts. */
export function evidenceFacts(suggestion: Pick<BankSuggestion, "kind" | "evidence">, t: (key: string) => string): string[] {
  const e = suggestion.evidence;
  const facts: string[] = [];
  if (e.asked !== undefined) facts.push(fmt(t("bankAi.fact.asked"), { asked: e.asked, graded: e.graded ?? 0 }));
  if (suggestion.kind === "RUBRIC_GAP" && e.missedRate !== undefined)
    facts.push(fmt(t("bankAi.fact.missed"), { rate: percent(e.missedRate), n: e.criterionAnswers ?? 0 }));
  if (e.skipRate) facts.push(fmt(t("bankAi.fact.skip"), { rate: percent(e.skipRate) }));
  if (e.overtimeRate) facts.push(fmt(t("bankAi.fact.overtime"), { rate: percent(e.overtimeRate) }));
  if (e.meanScore !== null && e.meanScore !== undefined) facts.push(fmt(t("bankAi.fact.mean"), { score: e.meanScore.toFixed(1) }));
  if (e.discrimination !== null && e.discrimination !== undefined)
    facts.push(fmt(t("bankAi.fact.discrimination"), { r: e.discrimination.toFixed(2) }));
  if (e.repeatUsers) facts.push(fmt(t("bankAi.fact.repeat"), { n: e.repeatUsers }));
  if (e.twinStableKey) facts.push(fmt(t("bankAi.fact.twin"), { key: e.twinStableKey }));
  return facts;
}

function named(t: (key: string) => string, key: string, fallback: string): string {
  const text = t(key);
  return text && text !== key ? text : fallback;
}

/**
 * One suggestion: what the data shows, what the AI proposes (rubric gaps), and
 * accept / dismiss for the roles that may. Accepting asks first, because it
 * creates a revision draft, generates questions or retires one.
 */
export default function BankSuggestionCard({
  suggestion,
  roles,
  showQuestion = true,
  onDecided,
}: {
  suggestion: BankSuggestion;
  roles: readonly string[];
  showQuestion?: boolean;
  onDecided: () => void;
}) {
  const { t } = useLanguage();
  const [pending, setPending] = useState<"ACCEPT" | "DISMISS" | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string; href?: string } | null>(null);
  const can = suggestionAbilities(suggestion.kind, roles);
  const p = suggestion.proposal;
  const open = suggestion.status === "OPEN";

  const decide = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      const { data } = await bankInsightsApi.decide(suggestion.id, pending, note);
      const href = data.result.revisionVersionId && suggestion.questionId ? `/admin/question-bank/${suggestion.questionId}` : undefined;
      setMessage({
        ok: true,
        text:
          pending === "DISMISS"
            ? t("bankAi.done.dismissed")
            : data.result.revisionVersionId
              ? t("bankAi.done.revision")
              : data.result.generated
                ? fmt(t("bankAi.done.generated"), { n: data.result.generated })
                : data.result.retired
                  ? t("bankAi.done.retired")
                  : t("bankAi.done.accepted"),
        href,
      });
      onDecided();
    } catch (error: unknown) {
      const detail = (error as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setMessage({ ok: false, text: named(t, `bankAi.error.${detail}`, detail || t("bankAi.error.unknown")) });
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  return (
    <li className="min-w-0 space-y-2 rounded-2xl border border-[#DCE4F3] bg-white p-4 text-sm text-[#14244B]">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-semibold ${SEVERITY_TONE[suggestion.severity]}`}>{named(t, `bankAi.kind.${suggestion.kind}`, suggestion.kind)}</span>
        <span className="font-semibold">{named(t, `bankAi.reason.${suggestion.reason}`, suggestion.reason)}</span>
        {suggestion.evidence.lowData ? <span className="rounded-full bg-[#F2F5FC] px-2 py-0.5 text-[11px] text-[#607096]" title={t("bankAi.lowDataHint")}>{t("bankAi.lowData")}</span> : null}
        {!open ? <span className="ml-auto text-[#607096]">{named(t, `bankAi.status.${suggestion.status}`, suggestion.status)}{suggestion.note === "auto_resolved" ? ` · ${t("bankAi.autoResolved")}` : ""}</span> : null}
      </div>
      {showQuestion && suggestion.questionId ? (
        <p className="min-w-0 text-xs text-[#607096]">
          <Link href={`/admin/question-bank/${suggestion.questionId}`} className="font-semibold text-[#204195] hover:underline [overflow-wrap:anywhere]">
            {suggestion.stableKey}
          </Link>
          {suggestion.questionText ? <span className="line-clamp-2 [overflow-wrap:anywhere]"> {suggestion.questionText}</span> : null}
        </p>
      ) : null}
      {suggestion.evidence.criterion ? (
        <p className="text-xs">
          <span className="font-semibold text-[#607096]">{t("bankAi.criterion")}: </span>
          {suggestion.evidence.criterion}
        </p>
      ) : null}
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#475569]">
        {evidenceFacts(suggestion, t).map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ul>
      {suggestion.kind === "DIFFICULTY" && p.difficultyBand ? <p className="text-xs">{fmt(t("bankAi.proposal.band"), { band: named(t, `fixAdmin.ops.qb.difficulty.${p.difficultyBand}`, p.difficultyBand) })}</p> : null}
      {p.probe ? (
        <div className="space-y-1 rounded-xl bg-[#F8FAFE] p-3 text-xs">
          <p className="font-semibold text-[#204195]">{fmt(t("bankAi.proposal.ai"), { n: p.basedOnAnswers ?? 0 })}</p>
          {p.misconception ? <p><span className="font-semibold">{t("bankAi.proposal.misconception")}: </span>{p.misconception}</p> : null}
          <p><span className="font-semibold">{t("bankAi.proposal.probe")}: </span>{p.probe}</p>
          {p.anchor_partial ? <p><span className="font-semibold">{t("bankAi.proposal.partial")}: </span>{p.anchor_partial}</p> : null}
          {p.anchor_full ? <p><span className="font-semibold">{t("bankAi.proposal.full")}: </span>{p.anchor_full}</p> : null}
        </div>
      ) : suggestion.kind === "RUBRIC_GAP" ? (
        <p className="text-[11px] text-[#8A98B8]">{t("bankAi.proposal.none")}</p>
      ) : null}
      {open && (can.accept || can.dismiss) ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {can.accept ? (
            <button type="button" disabled={busy} onClick={() => setPending("ACCEPT")} className="rounded-full bg-[#204195] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#183275] disabled:opacity-50">
              {named(t, `bankAi.accept.${suggestion.kind}`, t("bankAi.accept.default"))}
            </button>
          ) : null}
          {can.dismiss ? (
            <button type="button" disabled={busy} onClick={() => setPending("DISMISS")} className="rounded-full border border-[#DCE4F3] px-3 py-1.5 text-xs font-semibold text-[#607096] hover:text-[#204195] disabled:opacity-50">
              {t("bankAi.dismiss")}
            </button>
          ) : null}
        </div>
      ) : null}
      {open && !can.accept && !can.dismiss ? <p className="text-[11px] text-[#8A98B8]">{t("bankAi.noRole")}</p> : null}
      {message ? (
        <p role="status" className={`text-xs font-semibold ${message.ok ? "text-[#1F7A4D]" : "text-[#C43B3B]"}`}>
          {message.text}
          {message.href ? <> · <Link href={message.href} className="underline">{t("bankAi.openQuestion")}</Link></> : null}
        </p>
      ) : null}
      <ConfirmDialog
        open={pending !== null}
        title={pending === "DISMISS" ? t("bankAi.confirm.dismissTitle") : named(t, `bankAi.confirm.${suggestion.kind}`, t("bankAi.confirm.default"))}
        body={
          <label className="block text-xs font-semibold text-[#607096]">
            {t("bankAi.confirm.note")}
            <input value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full rounded-lg border border-[#DCE4F3] px-2 py-1.5 text-sm text-[#14244B]" />
          </label>
        }
        confirmLabel={pending === "DISMISS" ? t("bankAi.dismiss") : named(t, `bankAi.accept.${suggestion.kind}`, t("bankAi.accept.default"))}
        cancelLabel={t("adminOps.cancel")}
        tone={pending === "ACCEPT" && (suggestion.kind === "RETIRE" || suggestion.kind === "DUPLICATE") ? "danger" : "default"}
        busy={busy}
        onConfirm={() => void decide()}
        onCancel={() => setPending(null)}
      />
    </li>
  );
}
