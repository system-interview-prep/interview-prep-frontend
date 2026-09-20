"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { questionBankApi } from "@features/admin/services/questionBank.service";

export default function AdminQuestionAuthoringClient() {
  const [form, setForm] = useState({ stableKey: "", taxonomyVersion: "", canonicalText: "", objective: "", primaryCompetency: "", soft: "180", hard: "300", contextPolicy: "{}", personalizationPolicy: "{}" });
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const update = (key: keyof typeof form, value: string) => setForm((valueMap) => ({ ...valueMap, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault(); setMessage(null);
    let contextPolicy: Record<string, unknown>; let personalizationPolicy: Record<string, unknown>;
    try { contextPolicy = JSON.parse(form.contextPolicy); personalizationPolicy = JSON.parse(form.personalizationPolicy); }
    catch { setMessage("Policy JSON không đúng cú pháp."); return; }
    const soft = Number(form.soft); const hard = Number(form.hard);
    if (!form.primaryCompetency || hard < soft) { setMessage("Cần đúng một primary competency và hard duration phải lớn hơn hoặc bằng soft duration."); return; }
    try {
      setSaving(true);
      const result = await questionBankApi.createDraft({ stableKey: form.stableKey, version: "1.0.0", taxonomyVersion: form.taxonomyVersion, questionType: "CONCEPTUAL", difficultyBand: "MEDIUM", canonicalLocale: "vi-VN", canonicalText: form.canonicalText, objective: form.objective, thinkingSeconds: 0, softAnswerSeconds: soft, hardAnswerSeconds: hard, contextPolicy, personalizationPolicy, changeSummary: "", taxonomyMappings: [{ conceptId: form.primaryCompetency, purpose: "PRIMARY_COMPETENCY", relevance: 1 }] });
      setMessage(`Đã tạo draft ${result.data.questionVersionId}. Hoàn thiện rubric/source trước khi submit review.`);
    } catch (error: unknown) { setMessage((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Không thể tạo draft."); }
    finally { setSaving(false); }
  }
  return <div className="mx-auto max-w-4xl space-y-6"><div><Link href="/admin/question-bank" className="text-sm text-[#204195]">← Ngân hàng câu hỏi</Link><h1 className="mt-3 text-2xl font-bold text-[#14244B]">Thêm câu hỏi thủ công</h1><p className="mt-1 text-sm text-[#607096]">Lưu bản nháp trước; Core kiểm tra taxonomy và lifecycle.</p></div><form onSubmit={submit} className="space-y-5 rounded-2xl border border-[#DCE4F3] bg-white p-6"><div className="grid gap-4 sm:grid-cols-2"><Field label="Stable key" value={form.stableKey} onChange={(v) => update("stableKey", v)} required /><Field label="Taxonomy version" value={form.taxonomyVersion} onChange={(v) => update("taxonomyVersion", v)} required /><Field label="Primary competency ID" value={form.primaryCompetency} onChange={(v) => update("primaryCompetency", v)} required /><Field label="Soft duration (seconds)" type="number" value={form.soft} onChange={(v) => update("soft", v)} required /><Field label="Hard duration (seconds)" type="number" value={form.hard} onChange={(v) => update("hard", v)} required /></div><Field label="Câu hỏi chuẩn" value={form.canonicalText} onChange={(v) => update("canonicalText", v)} required multiline /><Field label="Objective" value={form.objective} onChange={(v) => update("objective", v)} required multiline /><Field label="Context policy (JSON)" value={form.contextPolicy} onChange={(v) => update("contextPolicy", v)} required multiline /><Field label="Personalization policy (JSON)" value={form.personalizationPolicy} onChange={(v) => update("personalizationPolicy", v)} required multiline />{message && <p className="rounded-xl bg-[#EEF2FD] p-3 text-sm text-[#14244B]">{message}</p>}<button disabled={saving} className="rounded-xl bg-[#204195] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Đang lưu…" : "Lưu draft"}</button></form></div>;
}
function Field({ label, value, onChange, required, multiline, type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; multiline?: boolean; type?: string }) { const className = "mt-1 w-full rounded-xl border border-[#DCE4F3] p-2 text-sm"; return <label className="block text-sm font-semibold text-[#14244B]">{label}{multiline ? <textarea className={className} value={value} onChange={(e) => onChange(e.target.value)} required={required} rows={3} /> : <input className={className} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} />}</label>; }
