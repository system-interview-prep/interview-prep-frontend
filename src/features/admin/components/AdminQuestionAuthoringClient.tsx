"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { DEFAULT_TAXONOMY_VERSION, DIFFICULTY_BANDS, QUESTION_TYPES, questionBankApi, type CreateQuestionDraftPayload } from "@features/admin/services/questionBank.service";
import { RUBRIC_TEMPLATE_JSON, parseRubricCriteria } from "./questionRubricTemplate";

const splitIds = (value: string) => Array.from(new Set(value.split(",").map((item) => item.trim()).filter(Boolean)));
const errorMessage = (error: unknown, fallback: string) => {
  const detail = (error as { response?: { data?: { detail?: unknown; message?: string } } }).response?.data;
  return typeof detail?.detail === "string" ? detail.detail : detail?.message || fallback;
};

export default function AdminQuestionAuthoringClient() {
  const [form, setForm] = useState({ stableKey: "", taxonomyVersion: DEFAULT_TAXONOMY_VERSION, canonicalText: "", objective: "", primaryCompetency: "", skillIds: "", roleIds: "", questionType: "technical", difficultyBand: "intermediate", thinking: "30", soft: "180", hard: "300", rubric: RUBRIC_TEMPLATE_JSON, contextPolicy: "{}", personalizationPolicy: "{}" });
  const [message, setMessage] = useState<string | null>(null);
  const [createdQuestionId, setCreatedQuestionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const update = (key: keyof typeof form, value: string) => setForm((valueMap) => ({ ...valueMap, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault(); setMessage(null); setCreatedQuestionId(null);
    let contextPolicy: Record<string, unknown>; let personalizationPolicy: Record<string, unknown>;
    try { contextPolicy = JSON.parse(form.contextPolicy); personalizationPolicy = JSON.parse(form.personalizationPolicy); }
    catch { setMessage("Policy JSON không đúng cú pháp."); return; }
    const rubric = parseRubricCriteria(form.rubric);
    if ("error" in rubric) { setMessage(rubric.error); return; }
    const soft = Number(form.soft); const hard = Number(form.hard);
    if (!form.primaryCompetency || hard < soft) { setMessage("Cần đúng một primary competency và hard duration phải lớn hơn hoặc bằng soft duration."); return; }
    const skillIds = splitIds(form.skillIds); const roleIds = splitIds(form.roleIds);
    // The interview selector matches JD skills on TARGET_SKILL and the career fallback on TARGET_ROLE;
    // a question with only a primary competency is never picked for a skill-based interview.
    if (skillIds.length === 0 && roleIds.length === 0) { setMessage("Cần ít nhất một skill ID hoặc career role ID để câu hỏi được chọn trong phỏng vấn."); return; }
    const taxonomyMappings: CreateQuestionDraftPayload["taxonomyMappings"] = [
      { conceptId: form.primaryCompetency.trim(), purpose: "PRIMARY_COMPETENCY", relevance: 1 },
      ...skillIds.map((conceptId) => ({ conceptId, purpose: "TARGET_SKILL" as const, relevance: 1 })),
      ...roleIds.map((conceptId) => ({ conceptId, purpose: "TARGET_ROLE" as const, relevance: 1 })),
    ];
    setSaving(true);
    let draft: { questionId: string; questionVersionId: string };
    try {
      draft = (await questionBankApi.createDraft({ stableKey: form.stableKey, version: "1.0.0", taxonomyVersion: form.taxonomyVersion, questionType: form.questionType, difficultyBand: form.difficultyBand, canonicalLocale: "vi-VN", canonicalText: form.canonicalText, objective: form.objective, thinkingSeconds: Number(form.thinking), softAnswerSeconds: soft, hardAnswerSeconds: hard, contextPolicy, personalizationPolicy, changeSummary: "", taxonomyMappings })).data;
    } catch (error: unknown) { setMessage(errorMessage(error, "Không thể tạo draft.")); setSaving(false); return; }
    setCreatedQuestionId(draft.questionId);
    try {
      await questionBankApi.attachRubric(draft.questionVersionId, { criteria: rubric.criteria });
      setMessage("Đã tạo draft kèm rubric. Mở trang chi tiết để gửi review.");
    } catch (error: unknown) {
      setMessage(`Đã tạo draft nhưng chưa gắn được rubric: ${errorMessage(error, "lỗi không xác định")}. Gắn lại rubric ở trang chi tiết.`);
    } finally { setSaving(false); }
  }
  return <div className="mx-auto max-w-4xl space-y-6"><div><Link href="/admin/question-bank" className="text-sm text-[#204195]">← Ngân hàng câu hỏi</Link><h1 className="mt-3 text-2xl font-bold text-[#14244B]">Thêm câu hỏi thủ công</h1><p className="mt-1 text-sm text-[#607096]">Lưu bản nháp kèm rubric; Core kiểm tra taxonomy và lifecycle.</p></div><form onSubmit={submit} className="space-y-5 rounded-2xl border border-[#DCE4F3] bg-white p-6"><div className="grid gap-4 sm:grid-cols-2"><Field label="Stable key" value={form.stableKey} onChange={(v) => update("stableKey", v)} required /><Field label="Taxonomy version" value={form.taxonomyVersion} onChange={(v) => update("taxonomyVersion", v)} required /><Field label="Primary competency ID (specialization)" value={form.primaryCompetency} onChange={(v) => update("primaryCompetency", v)} required /><Field label="Skill IDs (vd: skill-python, skill-sql)" value={form.skillIds} onChange={(v) => update("skillIds", v)} /><Field label="Career role IDs (cho phỏng vấn theo career)" value={form.roleIds} onChange={(v) => update("roleIds", v)} /><Select label="Loại câu hỏi" value={form.questionType} options={QUESTION_TYPES} onChange={(v) => update("questionType", v)} /><Select label="Độ khó" value={form.difficultyBand} options={DIFFICULTY_BANDS} onChange={(v) => update("difficultyBand", v)} /><Field label="Thinking (seconds)" type="number" value={form.thinking} onChange={(v) => update("thinking", v)} required /><Field label="Soft duration (seconds)" type="number" value={form.soft} onChange={(v) => update("soft", v)} required /><Field label="Hard duration (seconds)" type="number" value={form.hard} onChange={(v) => update("hard", v)} required /></div><Field label="Câu hỏi chuẩn" value={form.canonicalText} onChange={(v) => update("canonicalText", v)} required multiline /><Field label="Objective" value={form.objective} onChange={(v) => update("objective", v)} required multiline /><Field label="Rubric (JSON: tổng weight = 1.0, mỗi tiêu chí đủ anchor 0-3)" value={form.rubric} onChange={(v) => update("rubric", v)} required multiline rows={12} /><Field label="Context policy (JSON)" value={form.contextPolicy} onChange={(v) => update("contextPolicy", v)} required multiline /><Field label="Personalization policy (JSON)" value={form.personalizationPolicy} onChange={(v) => update("personalizationPolicy", v)} required multiline />{message && <p className="rounded-xl bg-[#EEF2FD] p-3 text-sm text-[#14244B]">{message}{createdQuestionId && <> <Link href={`/admin/question-bank/${createdQuestionId}`} className="font-semibold text-[#204195] underline">Mở chi tiết</Link></>}</p>}<button disabled={saving} className="rounded-xl bg-[#204195] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Đang lưu…" : "Lưu draft"}</button></form></div>;
}
function Field({ label, value, onChange, required, multiline, rows = 3, type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; multiline?: boolean; rows?: number; type?: string }) { const className = "mt-1 w-full rounded-xl border border-[#DCE4F3] p-2 text-sm"; return <label className="block text-sm font-semibold text-[#14244B]">{label}{multiline ? <textarea className={rows > 3 ? `${className} font-mono` : className} value={value} onChange={(e) => onChange(e.target.value)} required={required} rows={rows} /> : <input className={className} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} />}</label>; }
function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) { return <label className="block text-sm font-semibold text-[#14244B]">{label}<select className="mt-1 w-full rounded-xl border border-[#DCE4F3] bg-white p-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>; }
