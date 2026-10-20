"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import { lifecycleTone } from "@features/admin/components/primitives/statusTone";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";
import { DIFFICULTY_BANDS, QUESTION_TYPES, questionBankApi, type QuestionDetail, type ReviewDecision, type UpdateDraftPayload } from "@features/admin/services/questionBank.service";
import { RUBRIC_TEMPLATE_JSON, parseRubricCriteria } from "./questionRubricTemplate";

const EDITABLE = new Set(["DRAFT", "NEEDS_REVISION"]);
// Versions that are finished; a change needs a new revision.
const REVISABLE = new Set(["APPROVED", "CALIBRATED", "REJECTED"]);
/** Vietnamese label for a Core enum value (status, type, difficulty, purpose); falls back to the raw value. */
function useEnumLabel() {
  const { t } = useLanguage();
  return (group: string, value: string) => {
    const key = `fixAdmin.ops.qb.${group}.${value}`;
    const text = t(key);
    return text && text !== key ? text : value;
  };
}

const errorMessage = (error: unknown, fallback: string) => {
  const data = (error as { response?: { data?: { detail?: unknown; message?: string } } }).response?.data;
  return typeof data?.detail === "string" ? data.detail : data?.message || fallback;
};

export default function AdminQuestionDetailClient({ questionId }: { questionId: string }) {
  const { t } = useLanguage();
  const label = useEnumLabel();
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [rubricJson, setRubricJson] = useState(RUBRIC_TEMPLATE_JSON);
  const [comment, setComment] = useState("");

  const load = useCallback(async () => {
    try { setQuestion((await questionBankApi.get(questionId)).data); setState("ready"); }
    catch { setState("error"); }
  }, [questionId]);
  useEffect(() => { void load(); }, [load]);

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true); setMessage(null);
    try { await action(); setMessage(success); await load(); }
    catch (error: unknown) { setMessage(errorMessage(error, t("fixAdmin.qd.actionFailed"))); }
    finally { setBusy(false); }
  }

  const header = (status?: string) => <AdminPageHeader title={t("fixAdmin.qd.detailTitle")} description={t("fixAdmin.qd.pageDesc")} breadcrumbs={[{ label: "Quản trị", href: "/admin/dashboard" }, { label: t("fixAdmin.qd.bankCrumb"), href: "/admin/question-bank" }, { label: t("fixAdmin.qd.detailTitle") }]} statusBadge={status ? <AdminStatusBadge status={lifecycleTone(status)} label={label("status", status)} /> : undefined} />;

  if (state === "loading") return <div className="space-y-6">{header()}<p className="text-sm text-[#607096]">{t("fixAdmin.qd.loading")}</p></div>;
  if (state === "error" || !question) return <div className="space-y-6">{header()}<AdminEmptyState variant="error" title={t("fixAdmin.qd.loadErrorTitle")} description={t("fixAdmin.qd.loadErrorDesc")} /></div>;

  const version = question.currentVersion;
  const versionId = version.questionVersionId;
  const editable = EDITABLE.has(version.status);
  const inReview = version.status === "IN_REVIEW";
  const revisable = REVISABLE.has(version.status);
  const review = (decision: ReviewDecision, success: string) => run(() => questionBankApi.review(versionId, decision, comment || undefined), success);
  const attachRubric = () => {
    const parsed = parseRubricCriteria(rubricJson);
    if ("error" in parsed) { setMessage(parsed.error); return; }
    void run(() => questionBankApi.attachRubric(versionId, { criteria: parsed.criteria }), t("fixAdmin.qd.rubricAttached"));
  };
  const mappings = [
    ...(question.taxonomy.primaryCompetency ? [["PRIMARY_COMPETENCY", question.taxonomy.primaryCompetency.conceptId]] : []),
    ...question.taxonomy.skills.map((item) => ["TARGET_SKILL", item.conceptId]),
    ...question.taxonomy.roles.map((item) => ["TARGET_ROLE", item.conceptId]),
  ];
  const button = "rounded-xl px-3.5 py-2 text-xs font-semibold disabled:opacity-60";

  return <div className="space-y-6">
    {header(version.status)}
    <section className="min-w-0 space-y-3 rounded-2xl border border-[#DCE4F3] bg-white p-4 text-sm text-[#14244B] sm:p-6">
      <p className="text-xs text-[#607096]">{t("fixAdmin.qd.stableKey")}: <span className="font-mono font-semibold text-[#14244B] [overflow-wrap:anywhere]">{question.stableKey}</span></p>
      <p className="text-base font-semibold break-words [overflow-wrap:anywhere]">{version.canonicalText}</p>
      <p className="break-words text-[#607096] [overflow-wrap:anywhere]"><span className="font-semibold text-[#14244B]">{t("fixAdmin.qd.objective")}:</span> {version.objective}</p>
      <p className="text-xs text-[#607096]">v{version.version} · {label("type", version.questionType)} · {label("difficulty", version.difficultyBand)} · {version.canonicalLocale} · {fmt(t("fixAdmin.qd.softMeta"), { n: version.softAnswerSeconds })}</p>
      {mappings.length > 0 && <div className="space-y-1.5"><p className="text-xs font-semibold text-[#607096]">{t("fixAdmin.qd.taxonomyMappings")}</p><div className="flex flex-wrap gap-2">{mappings.map(([purpose, conceptId]) => <span key={`${purpose}:${conceptId}`} className="min-w-0 max-w-full rounded-lg bg-[#EEF2FD] px-2 py-1 text-xs [overflow-wrap:anywhere]"><b>{label("purpose", purpose)}</b> · <span className="font-mono">{conceptId}</span></span>)}</div></div>}
      {question.taxonomy.skills.length === 0 && question.taxonomy.roles.length === 0 && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">{t("fixAdmin.qd.noTargets")}</p>}
      {editable && question.approvedVersionId && question.approvedVersionId !== versionId && <p className="rounded-xl bg-[#EEF2FD] p-3 text-xs">{t("fixAdmin.qd.revisionNote")}</p>}
      {editable && <DraftEditor key={versionId} version={version} busy={busy} onSave={(payload) => run(() => questionBankApi.updateDraft(versionId, payload), t("fixAdmin.qd.draftSaved"))} />}
    </section>
    <section className="min-w-0 space-y-3 rounded-2xl border border-[#DCE4F3] bg-white p-4 text-sm text-[#14244B] sm:p-6">
      <div className="min-w-0">
        <h2 className="font-bold">{t("fixAdmin.qd.rubricHeading")}</h2>
        {question.rubric && <p className="mt-0.5 text-xs text-[#607096] [overflow-wrap:anywhere]">{fmt(t("fixAdmin.qd.rubricMeta"), { key: question.rubric.stableKey, version: question.rubric.version })}</p>}
      </div>
      {question.rubric ? <ul className="divide-y divide-[#EAEFF8] rounded-xl border border-[#EAEFF8]">{question.rubric.criteria.map((criterion) => <li key={criterion.stableKey} className="min-w-0 space-y-1 p-3">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <p className="min-w-0 flex-1 font-semibold [overflow-wrap:anywhere]">{criterion.name}</p>
          <span className="flex shrink-0 flex-wrap gap-1.5">
            {criterion.critical && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">{t("fixAdmin.qd.critical")}</span>}
            <span className="rounded-full bg-[#EEF2FD] px-2 py-0.5 text-[11px] font-semibold text-[#204195] tabular-nums">{fmt(t("fixAdmin.qd.weight"), { w: criterion.weight })}</span>
          </span>
        </div>
        <p className="text-xs text-[#607096] break-words [overflow-wrap:anywhere]">{criterion.description || t("fixAdmin.qd.noDescription")}</p>
      </li>)}</ul> : <p className="text-[#607096]">{t("fixAdmin.qd.noRubric")}</p>}
      {editable && <><label className="block text-xs font-semibold">{t("fixAdmin.qd.rubricJsonLabel")}<textarea className="mt-1 w-full min-w-0 rounded-xl border border-[#DCE4F3] p-2 font-mono text-xs" rows={10} value={rubricJson} onChange={(e) => setRubricJson(e.target.value)} /></label><button type="button" disabled={busy} onClick={attachRubric} className={`${button} border border-[#DCE4F3] text-[#14244B]`}>{question.rubric ? t("fixAdmin.qd.replaceRubric") : t("fixAdmin.qd.attachRubric")}</button></>}
    </section>
    <section className="min-w-0 space-y-3 rounded-2xl border border-[#DCE4F3] bg-white p-4 text-sm text-[#14244B] sm:p-6">
      <h2 className="font-bold">{t("fixAdmin.qd.lifecycle")}</h2>
      <p className="text-xs text-[#607096]">{t("fixAdmin.qd.lifecycleDesc")}</p>
      {inReview && <input className="w-full rounded-xl border border-[#DCE4F3] p-2 text-sm" placeholder={t("fixAdmin.qd.reviewComment")} value={comment} onChange={(e) => setComment(e.target.value)} />}
      <div className="flex flex-wrap gap-2">
        {editable && <button type="button" disabled={busy || !question.rubric} onClick={() => run(() => questionBankApi.submit(versionId), t("fixAdmin.qd.submitted"))} className={`${button} bg-[#204195] text-white`}>{t("fixAdmin.qd.submit")}</button>}
        {inReview && <button type="button" disabled={busy} onClick={() => review("APPROVE", t("fixAdmin.qd.approveRecorded"))} className={`${button} border border-[#DCE4F3] text-[#14244B]`}>{t("fixAdmin.qd.reviewApprove")}</button>}
        {inReview && <button type="button" disabled={busy} onClick={() => review("REQUEST_CHANGES", t("fixAdmin.qd.changesRequested"))} className={`${button} border border-[#DCE4F3] text-[#14244B]`}>{t("fixAdmin.qd.reviewRequestChanges")}</button>}
        {inReview && <button type="button" disabled={busy} onClick={() => run(() => questionBankApi.approve(versionId), t("fixAdmin.qd.approved"))} className={`${button} bg-emerald-600 text-white`}>{t("fixAdmin.qd.finalApprove")}</button>}
        {revisable && <button type="button" disabled={busy} onClick={() => run(() => questionBankApi.revise(versionId), t("fixAdmin.qd.revisionCreated"))} className={`${button} border border-[#DCE4F3] text-[#14244B]`}>{t("fixAdmin.qd.createRevision")}</button>}
      </div>
      {message && <p className="rounded-xl bg-[#EEF2FD] p-3 text-sm break-words [overflow-wrap:anywhere]">{message}</p>}
    </section>
  </div>;
}

function DraftEditor({ version, busy, onSave }: { version: QuestionDetail["currentVersion"]; busy: boolean; onSave: (payload: UpdateDraftPayload) => void }) {
  const [form, setForm] = useState({
    canonicalText: version.canonicalText, objective: version.objective, questionType: version.questionType,
    difficultyBand: version.difficultyBand, thinking: String(version.thinkingSeconds), soft: String(version.softAnswerSeconds),
    hard: String(version.hardAnswerSeconds),
  });
  const { t } = useLanguage();
  const label = useEnumLabel();
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const input = "mt-1 w-full rounded-xl border border-[#DCE4F3] p-2 text-sm";
  const save = () => onSave({
    canonicalText: form.canonicalText, objective: form.objective, questionType: form.questionType,
    difficultyBand: form.difficultyBand, thinkingSeconds: Number(form.thinking),
    softAnswerSeconds: Number(form.soft), hardAnswerSeconds: Number(form.hard),
  });
  return <div className="space-y-3 border-t border-[#DCE4F3] pt-4">
    <h3 className="font-bold">{t("fixAdmin.qd.editDraft")}</h3>
    <label className="block text-xs font-semibold">{t("fixAdmin.qd.canonicalText")}<textarea className={input} rows={3} value={form.canonicalText} onChange={(e) => update("canonicalText", e.target.value)} /></label>
    <label className="block text-xs font-semibold">{t("fixAdmin.qd.objective")}<textarea className={input} rows={2} value={form.objective} onChange={(e) => update("objective", e.target.value)} /></label>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <label className="block text-xs font-semibold">{t("fixAdmin.qd.type")}<select className={input} value={form.questionType} onChange={(e) => update("questionType", e.target.value)}>{QUESTION_TYPES.map((option) => <option key={option} value={option}>{label("type", option)}</option>)}</select></label>
      <label className="block text-xs font-semibold">{t("fixAdmin.qd.difficulty")}<select className={input} value={form.difficultyBand} onChange={(e) => update("difficultyBand", e.target.value)}>{DIFFICULTY_BANDS.map((option) => <option key={option} value={option}>{label("difficulty", option)}</option>)}</select></label>
      <label className="block text-xs font-semibold">{t("fixAdmin.qd.thinkingSeconds")}<input className={input} type="number" value={form.thinking} onChange={(e) => update("thinking", e.target.value)} /></label>
      <label className="block text-xs font-semibold">{t("fixAdmin.qd.softSeconds")}<input className={input} type="number" value={form.soft} onChange={(e) => update("soft", e.target.value)} /></label>
      <label className="block text-xs font-semibold">{t("fixAdmin.qd.hardSeconds")}<input className={input} type="number" value={form.hard} onChange={(e) => update("hard", e.target.value)} /></label>
    </div>
    <button type="button" disabled={busy} onClick={save} className="rounded-xl border border-[#DCE4F3] px-3.5 py-2 text-xs font-semibold text-[#14244B] disabled:opacity-60">{t("fixAdmin.qd.saveChanges")}</button>
  </div>;
}
