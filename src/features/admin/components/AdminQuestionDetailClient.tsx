"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
    catch (error: unknown) { setMessage(errorMessage(error, "Thao tác thất bại.")); }
    finally { setBusy(false); }
  }

  const header = (status?: string) => <AdminPageHeader title={question ? question.stableKey : "Chi tiết câu hỏi"} description="Nội dung, taxonomy mapping, rubric và vòng đời duyệt câu hỏi" breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Ngân hàng câu hỏi", href: "/admin/question-bank" }, { label: question?.stableKey ?? questionId }]} statusBadge={status ? <AdminStatusBadge status={status === "APPROVED" ? "success" : "info"} label={status} /> : undefined} primaryAction={<Link href="/admin/question-bank" className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#14244B]"><ArrowLeft className="size-3.5" /><span>Quay lại ngân hàng</span></Link>} />;

  if (state === "loading") return <div className="space-y-6">{header()}<p className="text-sm text-[#607096]">Đang tải…</p></div>;
  if (state === "error" || !question) return <div className="space-y-6">{header()}<AdminEmptyState variant="error" title="Không tải được câu hỏi" description="Câu hỏi không tồn tại hoặc bạn không có quyền xem." /></div>;

  const version = question.currentVersion;
  const versionId = version.questionVersionId;
  const editable = EDITABLE.has(version.status);
  const inReview = version.status === "IN_REVIEW";
  const revisable = REVISABLE.has(version.status);
  const review = (decision: ReviewDecision, success: string) => run(() => questionBankApi.review(versionId, decision, comment || undefined), success);
  const attachRubric = () => {
    const parsed = parseRubricCriteria(rubricJson);
    if ("error" in parsed) { setMessage(parsed.error); return; }
    void run(() => questionBankApi.attachRubric(versionId, { criteria: parsed.criteria }), "Đã gắn rubric.");
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
      <p className="text-[#607096]"><span className="font-semibold text-[#14244B]">Objective:</span> {version.objective}</p>
      <p className="text-xs text-[#607096]">v{version.version} · {version.questionType} · {version.difficultyBand} · {version.canonicalLocale} · soft {version.softAnswerSeconds}s</p>
      <div className="flex flex-wrap gap-2">{mappings.map(([purpose, conceptId]) => <span key={`${purpose}:${conceptId}`} className="rounded-lg bg-[#EEF2FD] px-2 py-1 text-xs"><b>{purpose}</b> {conceptId}</span>)}</div>
      {question.taxonomy.skills.length === 0 && question.taxonomy.roles.length === 0 && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Câu hỏi chưa có TARGET_SKILL hoặc TARGET_ROLE nên sẽ không được chọn trong phỏng vấn theo JD.</p>}
      {editable && question.approvedVersionId && question.approvedVersionId !== versionId && <p className="rounded-xl bg-[#EEF2FD] p-3 text-xs">Đây là bản sửa đổi. Phỏng vấn vẫn dùng phiên bản đã duyệt trước đó cho tới khi bản này được phê duyệt.</p>}
      {editable && <DraftEditor key={versionId} version={version} busy={busy} onSave={(payload) => run(() => questionBankApi.updateDraft(versionId, payload), "Đã lưu bản nháp.")} />}
    </section>
    <section className="space-y-3 rounded-2xl border border-[#DCE4F3] bg-white p-6 text-sm text-[#14244B]">
      <h2 className="font-bold">Rubric</h2>
      {question.rubric ? <ul className="space-y-1">{question.rubric.criteria.map((criterion) => <li key={criterion.stableKey}><b>{criterion.name}</b> ({criterion.weight}) — <span className="text-[#607096]">{criterion.description}</span></li>)}</ul> : <p className="text-[#607096]">Chưa có rubric. Câu hỏi không thể gửi review khi thiếu rubric.</p>}
      {editable && <><textarea className="w-full rounded-xl border border-[#DCE4F3] p-2 font-mono text-xs" rows={10} value={rubricJson} onChange={(e) => setRubricJson(e.target.value)} /><button type="button" disabled={busy} onClick={attachRubric} className={`${button} border border-[#DCE4F3] text-[#14244B]`}>{question.rubric ? "Thay rubric" : "Gắn rubric"}</button></>}
    </section>
    <section className="space-y-3 rounded-2xl border border-[#DCE4F3] bg-white p-6 text-sm text-[#14244B]">
      <h2 className="font-bold">Vòng đời duyệt</h2>
      <p className="text-xs text-[#607096]">Tác giả gửi review → reviewer chấp thuận nội dung → Question Bank admin phê duyệt cuối. Người phê duyệt cuối phải khác tác giả.</p>
      {inReview && <input className="w-full rounded-xl border border-[#DCE4F3] p-2 text-sm" placeholder="Nhận xét review (tuỳ chọn)" value={comment} onChange={(e) => setComment(e.target.value)} />}
      <div className="flex flex-wrap gap-2">
        {editable && <button type="button" disabled={busy || !question.rubric} onClick={() => run(() => questionBankApi.submit(versionId), "Đã gửi review.")} className={`${button} bg-[#204195] text-white`}>Gửi review</button>}
        {inReview && <button type="button" disabled={busy} onClick={() => review("APPROVE", "Đã ghi nhận review chấp thuận.")} className={`${button} border border-[#DCE4F3] text-[#14244B]`}>Review: chấp thuận</button>}
        {inReview && <button type="button" disabled={busy} onClick={() => review("REQUEST_CHANGES", "Đã yêu cầu tác giả chỉnh sửa.")} className={`${button} border border-[#DCE4F3] text-[#14244B]`}>Review: yêu cầu sửa</button>}
        {inReview && <button type="button" disabled={busy} onClick={() => run(() => questionBankApi.approve(versionId), "Đã phê duyệt. Câu hỏi có thể được chọn trong phỏng vấn.")} className={`${button} bg-emerald-600 text-white`}>Phê duyệt cuối</button>}
        {revisable && <button type="button" disabled={busy} onClick={() => run(() => questionBankApi.revise(versionId), "Đã tạo bản sửa đổi ở trạng thái DRAFT.")} className={`${button} border border-[#DCE4F3] text-[#14244B]`}>Tạo bản sửa đổi</button>}
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
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const input = "mt-1 w-full rounded-xl border border-[#DCE4F3] p-2 text-sm";
  const save = () => onSave({
    canonicalText: form.canonicalText, objective: form.objective, questionType: form.questionType,
    difficultyBand: form.difficultyBand, thinkingSeconds: Number(form.thinking),
    softAnswerSeconds: Number(form.soft), hardAnswerSeconds: Number(form.hard),
  });
  return <div className="space-y-3 border-t border-[#DCE4F3] pt-4">
    <h3 className="font-bold">Sửa bản nháp</h3>
    <label className="block text-xs font-semibold">Câu hỏi chuẩn<textarea className={input} rows={3} value={form.canonicalText} onChange={(e) => update("canonicalText", e.target.value)} /></label>
    <label className="block text-xs font-semibold">Objective<textarea className={input} rows={2} value={form.objective} onChange={(e) => update("objective", e.target.value)} /></label>
    <div className="grid gap-3 sm:grid-cols-5">
      <label className="block text-xs font-semibold">Loại<select className={input} value={form.questionType} onChange={(e) => update("questionType", e.target.value)}>{QUESTION_TYPES.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
      <label className="block text-xs font-semibold">Độ khó<select className={input} value={form.difficultyBand} onChange={(e) => update("difficultyBand", e.target.value)}>{DIFFICULTY_BANDS.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
      <label className="block text-xs font-semibold">Thinking (s)<input className={input} type="number" value={form.thinking} onChange={(e) => update("thinking", e.target.value)} /></label>
      <label className="block text-xs font-semibold">Soft (s)<input className={input} type="number" value={form.soft} onChange={(e) => update("soft", e.target.value)} /></label>
      <label className="block text-xs font-semibold">Hard (s)<input className={input} type="number" value={form.hard} onChange={(e) => update("hard", e.target.value)} /></label>
    </div>
    <button type="button" disabled={busy} onClick={save} className="rounded-xl border border-[#DCE4F3] px-3.5 py-2 text-xs font-semibold text-[#14244B] disabled:opacity-60">Lưu thay đổi</button>
  </div>;
}
