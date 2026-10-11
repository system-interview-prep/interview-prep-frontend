"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";
import { DIFFICULTY_BANDS, QUESTION_TYPES, questionBankApi, type QuestionDetail, type ReviewDecision, type UpdateDraftPayload } from "@features/admin/services/questionBank.service";
import { RUBRIC_TEMPLATE_JSON, parseRubricCriteria } from "./questionRubricTemplate";

const EDITABLE = new Set(["DRAFT", "NEEDS_REVISION"]);
// Versions that are finished; a change needs a new revision.
const REVISABLE = new Set(["APPROVED", "CALIBRATED", "REJECTED"]);
const errorMessage = (error: unknown, fallback: string) => {
  const data = (error as { response?: { data?: { detail?: unknown; message?: string } } }).response?.data;
  return typeof data?.detail === "string" ? data.detail : data?.message || fallback;
};

export default function AdminQuestionDetailClient({ questionId }: { questionId: string }) {
  const { t } = useLanguage();
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

  const header = (status?: string) => <AdminPageHeader title={question ? question.stableKey : t("fixAdmin.qd.detailTitle")} description={t("fixAdmin.qd.pageDesc")} breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: t("fixAdmin.qd.bankCrumb"), href: "/admin/question-bank" }, { label: question?.stableKey ?? questionId }]} statusBadge={status ? <AdminStatusBadge status={status === "APPROVED" ? "success" : "info"} label={status} /> : undefined} primaryAction={<Link href="/admin/question-bank" className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#14244B]"><ArrowLeft className="size-3.5" /><span>{t("fixAdmin.qd.backToBank")}</span></Link>} />;

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
    <section className="space-y-3 rounded-2xl border border-[#DCE4F3] bg-white p-6 text-sm text-[#14244B]">
      <p className="text-base font-semibold">{version.canonicalText}</p>
      <p className="text-[#607096]"><span className="font-semibold text-[#14244B]">{t("fixAdmin.qd.objective")}:</span> {version.objective}</p>
      <p className="text-xs text-[#607096]">v{version.version} · {version.questionType} · {version.difficultyBand} · {version.canonicalLocale} · {fmt(t("fixAdmin.qd.softMeta"), { n: version.softAnswerSeconds })}</p>
      <div className="flex flex-wrap gap-2">{mappings.map(([purpose, conceptId]) => <span key={`${purpose}:${conceptId}`} className="rounded-lg bg-[#EEF2FD] px-2 py-1 text-xs"><b>{purpose}</b> {conceptId}</span>)}</div>
      {question.taxonomy.skills.length === 0 && question.taxonomy.roles.length === 0 && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">{t("fixAdmin.qd.noTargets")}</p>}
      {editable && question.approvedVersionId && question.approvedVersionId !== versionId && <p className="rounded-xl bg-[#EEF2FD] p-3 text-xs">{t("fixAdmin.qd.revisionNote")}</p>}
      {editable && <DraftEditor key={versionId} version={version} busy={busy} onSave={(payload) => run(() => questionBankApi.updateDraft(versionId, payload), t("fixAdmin.qd.draftSaved"))} />}
    </section>
    <section className="space-y-3 rounded-2xl border border-[#DCE4F3] bg-white p-6 text-sm text-[#14244B]">
      <h2 className="font-bold">{t("fixAdmin.ops.rubrics.table.rubric")}</h2>
      {question.rubric ? <ul className="space-y-1">{question.rubric.criteria.map((criterion) => <li key={criterion.stableKey}><b>{criterion.name}</b> ({criterion.weight}) — <span className="text-[#607096]">{criterion.description}</span></li>)}</ul> : <p className="text-[#607096]">{t("fixAdmin.qd.noRubric")}</p>}
      {editable && <><textarea className="w-full rounded-xl border border-[#DCE4F3] p-2 font-mono text-xs" rows={10} value={rubricJson} onChange={(e) => setRubricJson(e.target.value)} /><button type="button" disabled={busy} onClick={attachRubric} className={`${button} border border-[#DCE4F3] text-[#14244B]`}>{question.rubric ? t("fixAdmin.qd.replaceRubric") : t("fixAdmin.qd.attachRubric")}</button></>}
    </section>
    <section className="space-y-3 rounded-2xl border border-[#DCE4F3] bg-white p-6 text-sm text-[#14244B]">
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
      {message && <p className="rounded-xl bg-[#EEF2FD] p-3 text-sm">{message}</p>}
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
    <div className="grid gap-3 sm:grid-cols-5">
      <label className="block text-xs font-semibold">{t("fixAdmin.qd.type")}<select className={input} value={form.questionType} onChange={(e) => update("questionType", e.target.value)}>{QUESTION_TYPES.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
      <label className="block text-xs font-semibold">{t("fixAdmin.qd.difficulty")}<select className={input} value={form.difficultyBand} onChange={(e) => update("difficultyBand", e.target.value)}>{DIFFICULTY_BANDS.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
      <label className="block text-xs font-semibold">{t("fixAdmin.qd.thinkingSeconds")}<input className={input} type="number" value={form.thinking} onChange={(e) => update("thinking", e.target.value)} /></label>
      <label className="block text-xs font-semibold">{t("fixAdmin.qd.softSeconds")}<input className={input} type="number" value={form.soft} onChange={(e) => update("soft", e.target.value)} /></label>
      <label className="block text-xs font-semibold">{t("fixAdmin.qd.hardSeconds")}<input className={input} type="number" value={form.hard} onChange={(e) => update("hard", e.target.value)} /></label>
    </div>
    <button type="button" disabled={busy} onClick={save} className="rounded-xl border border-[#DCE4F3] px-3.5 py-2 text-xs font-semibold text-[#14244B] disabled:opacity-60">{t("fixAdmin.qd.saveChanges")}</button>
  </div>;
}
