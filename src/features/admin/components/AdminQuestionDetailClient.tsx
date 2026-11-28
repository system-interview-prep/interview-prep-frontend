"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import { lifecycleTone } from "@features/admin/components/primitives/statusTone";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";
import { DIFFICULTY_BANDS, QUESTION_TYPES, questionBankApi, type ActionPermission, type QuestionAction, type QuestionDetail, type ReviewDecision, type RubricCriterionInput, type UpdateDraftPayload } from "@features/admin/services/questionBank.service";
import RubricEditor, { validateRubric } from "./RubricEditor";
import { RUBRIC_TEMPLATE } from "./questionRubricTemplate";
import QuestionSuggestionsSection from "./QuestionSuggestionsSection";

const EDITABLE = new Set(["DRAFT", "NEEDS_REVISION"]);
// Versions that are finished; a change needs a new revision.
const REVISABLE = new Set(["APPROVED", "CALIBRATED", "REJECTED"]);
const IN_REVIEW = new Set(["IN_REVIEW", "PILOT_READY"]);
// Reasons that only mean "this step is not for now" (wrong status or role): hide the button.
const HIDDEN_REASONS = new Set(["no_role", "not_editable", "not_in_review", "not_finished"]);
const copyRubricCriteria = (criteria: NonNullable<QuestionDetail["rubric"]>["criteria"]) => criteria.map((criterion) => ({
  ...criterion,
  anchors: ([0, 1, 2, 3] as const).map((level) => ({
    level,
    description: criterion.anchors?.find((anchor) => anchor.level === level)?.description ?? "",
  })),
}));

/**
 * Permission of one action. The backend sends it (question_bank/permissions.py);
 * an older backend without `actions` falls back to the status alone.
 */
export function actionPermission(question: Pick<QuestionDetail, "actions" | "currentVersion" | "rubric">, action: QuestionAction): ActionPermission {
  const fromCore = question.actions?.[action];
  if (fromCore) return fromCore;
  const status = question.currentVersion.status;
  const allowed =
    action === "edit" ? EDITABLE.has(status)
      : action === "submit" ? EDITABLE.has(status) && Boolean(question.rubric)
        : action === "revise" ? REVISABLE.has(status)
          : IN_REVIEW.has(status);
  return { allowed, reason: allowed ? null : "not_in_review" };
}

/** Show the button (maybe disabled with a reason), or hide it because the step does not apply. */
export function actionVisible(permission: ActionPermission): boolean {
  return permission.allowed || !HIDDEN_REASONS.has(permission.reason ?? "");
}
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
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterionInput[]>([]);
  const [rubricError, setRubricError] = useState<string | null>(null);
  const rubricDraftVersionId = useRef<string | null>(null);
  const [comment, setComment] = useState("");
  const [reviewType, setReviewType] = useState("CONTENT");

  const load = useCallback(async () => {
    try {
      const nextQuestion = (await questionBankApi.get(questionId)).data;
      setQuestion(nextQuestion);
      if (rubricDraftVersionId.current !== nextQuestion.currentVersion.questionVersionId) {
        rubricDraftVersionId.current = nextQuestion.currentVersion.questionVersionId;
        setRubricCriteria(nextQuestion.rubric
          ? copyRubricCriteria(nextQuestion.rubric.criteria)
          : copyRubricCriteria(RUBRIC_TEMPLATE));
        setRubricError(null);
      }
      setState("ready");
    }
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
  const perm = (action: QuestionAction) => actionPermission(question, action);
  const editable = perm("edit").allowed;
  const canReview = perm("review").allowed;
  const reasons = (["submit", "review", "approve", "revise"] as const)
    .map((action) => perm(action))
    .filter((p) => !p.allowed && actionVisible(p))
    .map((p) => t(`adminRoles.reason.${p.reason}`));
  const uniqueReasons = Array.from(new Set(reasons));
  const review = (decision: ReviewDecision, success: string) => run(() => questionBankApi.review(versionId, decision, comment || undefined, reviewType), success);
  const reviewTypes = question.reviewTypes ?? ["CONTENT"];
  const named = (key: string, fallback: string) => { const text = t(key); return text && text !== key ? text : fallback; };
  const attachRubric = () => {
    const validationError = validateRubric(rubricCriteria);
    if (validationError) { setRubricError(t(validationError)); return; }
    setRubricError(null);
    void run(() => questionBankApi.attachRubric(versionId, { criteria: rubricCriteria }), t("fixAdmin.qd.rubricAttached"));
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
      <p className="text-xs text-[#607096]">{t("adminRoles.author")}: <span className="font-semibold text-[#14244B]">{version.generated ? t("adminRoles.authorAi") : version.createdByName || version.createdBy}</span></p>
      <p className="text-xs text-[#607096]">v{version.version} · {label("type", version.questionType)} · {label("difficulty", version.difficultyBand)} · {version.canonicalLocale} · {fmt(t("fixAdmin.qd.softMeta"), { n: version.softAnswerSeconds })}</p>
      {mappings.length > 0 && <div className="space-y-1.5"><p className="text-xs font-semibold text-[#607096]">{t("fixAdmin.qd.taxonomyMappings")}</p><div className="flex flex-wrap gap-2">{mappings.map(([purpose, conceptId]) => <span key={`${purpose}:${conceptId}`} className="min-w-0 max-w-full rounded-lg bg-[#EEF2FD] px-2 py-1 text-xs [overflow-wrap:anywhere]"><b>{label("purpose", purpose)}</b> · <span className="font-mono">{conceptId}</span></span>)}</div></div>}
      {question.taxonomy.skills.length === 0 && question.taxonomy.roles.length === 0 && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">{t("fixAdmin.qd.noTargets")}</p>}
      {editable && question.approvedVersionId && question.approvedVersionId !== versionId && <p className="rounded-xl bg-[#EEF2FD] p-3 text-xs">{t("fixAdmin.qd.revisionNote")}</p>}
      {editable && <DraftEditor key={versionId} version={version} busy={busy} onSave={(payload) => run(() => questionBankApi.updateDraft(versionId, payload), t("fixAdmin.qd.draftSaved"))} />}
    </section>
    {editable ? <div className="space-y-3">
      <RubricEditor
        title={t("fixAdmin.qd.rubricHeading")}
        hint={t("fixAdmin.ops.qb.author.rubricHint")}
        criteria={rubricCriteria}
        onChange={(criteria) => { setRubricCriteria(criteria); setRubricError(null); }}
        error={rubricError ?? undefined}
        disabled={busy}
      />
      <div className="flex flex-wrap items-center gap-3">
        {question.rubric && <span className="text-xs text-[#607096] [overflow-wrap:anywhere]">{fmt(t("fixAdmin.qd.rubricMeta"), { key: question.rubric.stableKey, version: question.rubric.version })}</span>}
        <button type="button" disabled={busy} onClick={attachRubric} className={`${button} border border-[#DCE4F3] text-[#14244B]`}>{question.rubric ? t("fixAdmin.qd.replaceRubric") : t("fixAdmin.qd.attachRubric")}</button>
      </div>
    </div> : <section className="min-w-0 space-y-3 rounded-2xl border border-[#DCE4F3] bg-white p-4 text-sm text-[#14244B] sm:p-6">
      <div className="min-w-0">
        <h2 className="font-bold">{t("fixAdmin.qd.rubricHeading")}</h2>
        {question.rubric && <p className="mt-0.5 text-xs text-[#607096] [overflow-wrap:anywhere]">{fmt(t("fixAdmin.qd.rubricMeta"), { key: question.rubric.stableKey, version: question.rubric.version })}</p>}
      </div>
      {question.rubric ? <ul className="divide-y divide-[#EAEFF8] rounded-xl border border-[#EAEFF8]">{question.rubric.criteria.map((criterion) => <li key={criterion.stableKey} className="min-w-0 space-y-2 p-3">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <p className="min-w-0 flex-1 font-semibold [overflow-wrap:anywhere]">{criterion.name}</p>
          <span className="flex shrink-0 flex-wrap gap-1.5">
            {criterion.critical && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">{t("fixAdmin.qd.critical")}</span>}
            <span className="rounded-full bg-[#EEF2FD] px-2 py-0.5 text-[11px] font-semibold text-[#204195] tabular-nums">{fmt(t("fixAdmin.qd.weight"), { w: criterion.weight })}</span>
          </span>
        </div>
        <p className="text-xs text-[#607096] break-words [overflow-wrap:anywhere]">{criterion.description || t("fixAdmin.qd.noDescription")}</p>
        {Boolean(criterion.anchors?.length) && <div className="grid gap-2 border-t border-[#EAEFF8] pt-2 sm:grid-cols-2">{criterion.anchors?.map((anchor) => <div key={anchor.level} className="min-w-0 rounded-lg bg-[#F8FAFC] p-2">
          <p className="text-[11px] font-semibold text-[#33446B]">{named(`fixAdmin.ops.qb.author.rubricLevel${anchor.level}`, `Mức ${anchor.level}`)}</p>
          <p className="mt-1 whitespace-pre-wrap text-xs text-[#607096] break-words [overflow-wrap:anywhere]">{anchor.description}</p>
        </div>)}</div>}
      </li>)}</ul> : <p className="text-[#607096]">{t("fixAdmin.qd.noRubric")}</p>}
    </section>}
    <section className="min-w-0 space-y-3 rounded-2xl border border-[#DCE4F3] bg-white p-4 text-sm text-[#14244B] sm:p-6">
      <h2 className="font-bold">{t("fixAdmin.qd.lifecycle")}</h2>
      <p className="text-xs text-[#607096]">{t("fixAdmin.qd.lifecycleDesc")}</p>
      {canReview && <div className="grid gap-2 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
        <label className="block text-xs font-semibold">{t("adminRoles.reviewType")}<select className="mt-1 w-full rounded-xl border border-[#DCE4F3] p-2 text-sm" value={reviewType} onChange={(e) => setReviewType(e.target.value)}>{reviewTypes.map((type) => <option key={type} value={type}>{named(`adminRoles.reviewTypeValue.${type}`, type)}</option>)}</select></label>
        <label className="block text-xs font-semibold">{t("fixAdmin.qd.reviewComment")}<input className="mt-1 w-full rounded-xl border border-[#DCE4F3] p-2 text-sm" value={comment} onChange={(e) => setComment(e.target.value)} /></label>
      </div>}
      <div className="flex flex-wrap gap-2">
        {actionVisible(perm("submit")) && <button type="button" disabled={busy || !perm("submit").allowed} onClick={() => run(() => questionBankApi.submit(versionId), t("fixAdmin.qd.submitted"))} className={`${button} bg-[#204195] text-white`}>{t("fixAdmin.qd.submit")}</button>}
        {actionVisible(perm("review")) && <button type="button" disabled={busy || !canReview} onClick={() => review("APPROVE", t("fixAdmin.qd.approveRecorded"))} className={`${button} border border-[#DCE4F3] text-[#14244B]`}>{t("fixAdmin.qd.reviewApprove")}</button>}
        {actionVisible(perm("review")) && <button type="button" disabled={busy || !canReview} onClick={() => review("REQUEST_CHANGES", t("fixAdmin.qd.changesRequested"))} className={`${button} border border-[#DCE4F3] text-[#14244B]`}>{t("fixAdmin.qd.reviewRequestChanges")}</button>}
        {actionVisible(perm("review")) && <button type="button" disabled={busy || !canReview} onClick={() => review("REJECT", t("adminRoles.rejected"))} className={`${button} border border-[#F3C9C9] text-[#C43B3B]`}>{t("adminRoles.reject")}</button>}
        {actionVisible(perm("approve")) && <button type="button" disabled={busy || !perm("approve").allowed} onClick={() => run(() => questionBankApi.approve(versionId), t("fixAdmin.qd.approved"))} className={`${button} bg-emerald-600 text-white`}>{t("fixAdmin.qd.finalApprove")}</button>}
        {actionVisible(perm("revise")) && <button type="button" disabled={busy || !perm("revise").allowed} onClick={() => run(() => questionBankApi.revise(versionId), t("fixAdmin.qd.revisionCreated"))} className={`${button} border border-[#DCE4F3] text-[#14244B]`}>{t("fixAdmin.qd.createRevision")}</button>}
      </div>
      {uniqueReasons.length > 0 && <ul className="space-y-1 text-xs text-[#8A5A00]">{uniqueReasons.map((reason) => <li key={reason}>• {reason}</li>)}</ul>}
      {message && <p className="rounded-xl bg-[#EEF2FD] p-3 text-sm break-words [overflow-wrap:anywhere]">{message}</p>}
    </section>
    <QuestionSuggestionsSection questionId={questionId} onChanged={() => void load()} />
    <section className="min-w-0 space-y-3 rounded-2xl border border-[#DCE4F3] bg-white p-4 text-sm text-[#14244B] sm:p-6">
      <h2 className="font-bold">{t("adminRoles.history")}</h2>
      {(question.reviews ?? []).length === 0 ? <p className="text-xs text-[#607096]">{t("adminRoles.historyEmpty")}</p> : <ol className="divide-y divide-[#EAEFF8] rounded-xl border border-[#EAEFF8]">
        {(question.reviews ?? []).map((entry) => <li key={entry.id} className="min-w-0 space-y-0.5 p-3 text-xs">
          <p><span className="font-semibold">{entry.reviewer || entry.reviewerId}</span> · {named(`adminRoles.decision.${entry.decision}`, entry.decision)} · {named(`adminRoles.reviewTypeValue.${entry.reviewType}`, entry.reviewType)}{entry.reviewedAt ? ` · ${new Date(entry.reviewedAt).toLocaleString("vi-VN")}` : ""}</p>
          {entry.comment && <p className="text-[#607096] [overflow-wrap:anywhere]">{entry.comment}</p>}
        </li>)}
      </ol>}
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
