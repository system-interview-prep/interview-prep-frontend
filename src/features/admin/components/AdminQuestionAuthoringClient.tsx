"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import AdminPageHeader from "./primitives/AdminPageHeader";
import ConceptPicker from "./ConceptPicker";
import { DIFFICULTY_BANDS, QUESTION_TYPES, questionBankApi, type CreateQuestionDraftPayload } from "@features/admin/services/questionBank.service";
import { taxonomyApi, type ActiveTaxonomy, type TaxonomyConcept } from "@features/admin/services/taxonomy.service";
import { RUBRIC_TEMPLATE_JSON, parseRubricCriteria } from "./questionRubricTemplate";

// Mirrors Core `_MAPPING_KINDS` (question_bank/service.py): career codes are seeded
// as kind `competency`, so TARGET_ROLE accepts both `job_role` and `competency`.
const PRIMARY_KINDS = ["competency"];
const SKILL_KINDS = ["skill"];
const ROLE_KINDS = ["job_role", "competency"];

const errorMessage = (error: unknown, fallback: string) => {
  const detail = (error as { response?: { data?: { detail?: unknown; message?: string } } }).response?.data;
  return typeof detail?.detail === "string" ? detail.detail : detail?.message || fallback;
};

type FormState = {
  stableKey: string; canonicalText: string; objective: string; primaryCompetency: string;
  skillIds: string[]; roleIds: string[]; questionType: string; difficultyBand: string;
  thinking: string; soft: string; hard: string; rubric: string; contextPolicy: string; personalizationPolicy: string;
};
type FieldKey = "stableKey" | "canonicalText" | "objective" | "primaryCompetency" | "targets" | "thinking" | "soft" | "hard" | "rubric" | "contextPolicy" | "personalizationPolicy";
type TaxonomyState = { status: "loading" } | { status: "ready"; taxonomy: ActiveTaxonomy } | { status: "error"; forbidden: boolean };

export default function AdminQuestionAuthoringClient() {
  const { t } = useLanguage();
  const [form, setForm] = useState<FormState>({ stableKey: "", canonicalText: "", objective: "", primaryCompetency: "", skillIds: [], roleIds: [], questionType: "technical", difficultyBand: "intermediate", thinking: "30", soft: "180", hard: "300", rubric: RUBRIC_TEMPLATE_JSON, contextPolicy: "{}", personalizationPolicy: "{}" });
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [message, setMessage] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [createdQuestionId, setCreatedQuestionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [taxonomyState, setTaxonomyState] = useState<TaxonomyState>({ status: "loading" });
  const [taxonomyReload, setTaxonomyReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    taxonomyApi.active()
      .then(({ data }) => { if (!cancelled) setTaxonomyState({ status: "ready", taxonomy: data }); })
      .catch((error: unknown) => {
        if (!cancelled) setTaxonomyState({ status: "error", forbidden: (error as { response?: { status?: number } }).response?.status === 403 });
      });
    return () => { cancelled = true; };
  }, [taxonomyReload]);
  const retryTaxonomy = useCallback(() => { setTaxonomyState({ status: "loading" }); setTaxonomyReload((n) => n + 1); }, []);

  const taxonomyVersion = taxonomyState.status === "ready" ? taxonomyState.taxonomy.version : null;
  const pools = useMemo(() => {
    const concepts = taxonomyState.status === "ready" ? taxonomyState.taxonomy.concepts.filter((concept) => concept.is_active) : [];
    const ofKinds = (kinds: string[]) => concepts
      .filter((concept) => kinds.includes(concept.kind))
      .sort((a, b) => a.label.localeCompare(b.label, "vi"));
    return { primary: ofKinds(PRIMARY_KINDS), skills: ofKinds(SKILL_KINDS), roles: ofKinds(ROLE_KINDS) } satisfies Record<string, TaxonomyConcept[]>;
  }, [taxonomyState]);
  const taxonomyBlocker = taxonomyState.status === "loading" ? t("fixAdmin.ops.qb.author.taxonomyLoadingBlock")
    : taxonomyState.status === "error" ? t(taxonomyState.forbidden ? "fixAdmin.ops.qb.author.taxonomyForbidden" : "fixAdmin.ops.qb.author.taxonomyErrorBlock")
    : !taxonomyVersion ? t("fixAdmin.ops.qb.author.taxonomyNoActive")
    : null;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    const field: FieldKey | null = key === "skillIds" || key === "roleIds" ? "targets" : key === "questionType" || key === "difficultyBand" ? null : (key as FieldKey);
    if (field) setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  };

  async function submit(event: FormEvent) {
    event.preventDefault(); setMessage(null); setCreatedQuestionId(null);
    if (taxonomyBlocker || !taxonomyVersion) return;
    const next: Partial<Record<FieldKey, string>> = {};
    const required = t("fixAdmin.ops.qb.author.required");
    if (!form.stableKey.trim()) next.stableKey = required;
    if (!form.canonicalText.trim()) next.canonicalText = required;
    if (!form.objective.trim()) next.objective = required;
    if (!form.primaryCompetency) next.primaryCompetency = t("fixAdmin.ops.qb.author.primaryRequired");
    // The interview selector matches JD skills on TARGET_SKILL and the career fallback on TARGET_ROLE;
    // a question with only a primary competency is never picked for a skill-based interview.
    if (form.skillIds.length === 0 && form.roleIds.length === 0) next.targets = t("fixAdmin.ops.qb.author.targetsRequired");
    const seconds = (raw: string, min: number) => { const value = Number(raw); return raw.trim() !== "" && Number.isInteger(value) && value >= min ? value : null; };
    const thinking = seconds(form.thinking, 0); const soft = seconds(form.soft, 1); const hard = seconds(form.hard, 1);
    if (thinking === null) next.thinking = t("fixAdmin.ops.qb.author.secondsInvalid");
    if (soft === null) next.soft = t("fixAdmin.ops.qb.author.secondsPositive");
    if (hard === null) next.hard = t("fixAdmin.ops.qb.author.secondsPositive");
    else if (soft !== null && hard < soft) next.hard = t("fixAdmin.ops.qb.author.hardBelowSoft");
    const parseObject = (raw: string): Record<string, unknown> | null => {
      try { const value: unknown = JSON.parse(raw); return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; } catch { return null; }
    };
    const contextPolicy = parseObject(form.contextPolicy); const personalizationPolicy = parseObject(form.personalizationPolicy);
    if (!contextPolicy) next.contextPolicy = t("fixAdmin.ops.qb.author.policyInvalid");
    if (!personalizationPolicy) next.personalizationPolicy = t("fixAdmin.ops.qb.author.policyInvalid");
    const rubric = parseRubricCriteria(form.rubric);
    if ("error" in rubric) next.rubric = rubric.error;
    setErrors(next);
    if (Object.keys(next).length > 0 || "error" in rubric || !contextPolicy || !personalizationPolicy || thinking === null || soft === null || hard === null) {
      setMessage({ tone: "error", text: t("fixAdmin.ops.qb.author.fixErrors") });
      return;
    }
    const taxonomyMappings: CreateQuestionDraftPayload["taxonomyMappings"] = [
      { conceptId: form.primaryCompetency, purpose: "PRIMARY_COMPETENCY", relevance: 1 },
      ...form.skillIds.map((conceptId) => ({ conceptId, purpose: "TARGET_SKILL" as const, relevance: 1 })),
      ...form.roleIds.map((conceptId) => ({ conceptId, purpose: "TARGET_ROLE" as const, relevance: 1 })),
    ];
    setSaving(true);
    let draft: { questionId: string; questionVersionId: string };
    try {
      draft = (await questionBankApi.createDraft({ stableKey: form.stableKey.trim(), version: "1.0.0", taxonomyVersion, questionType: form.questionType, difficultyBand: form.difficultyBand, canonicalLocale: "vi-VN", canonicalText: form.canonicalText, objective: form.objective, thinkingSeconds: thinking, softAnswerSeconds: soft, hardAnswerSeconds: hard, contextPolicy, personalizationPolicy, changeSummary: "", taxonomyMappings })).data;
    } catch (error: unknown) { setMessage({ tone: "error", text: errorMessage(error, t("fixAdmin.ops.qb.author.createFailed")) }); setSaving(false); return; }
    setCreatedQuestionId(draft.questionId);
    try {
      await questionBankApi.attachRubric(draft.questionVersionId, { criteria: rubric.criteria });
      setMessage({ tone: "info", text: t("fixAdmin.ops.qb.author.created") });
    } catch (error: unknown) {
      setMessage({ tone: "error", text: fmt(t("fixAdmin.ops.qb.author.rubricFailed"), { error: errorMessage(error, t("fixAdmin.ops.qb.author.unknownError")) }) });
    } finally { setSaving(false); }
  }

  const typeLabel = (value: string) => t(`fixAdmin.ops.qb.author.type.${value}`);
  const difficultyLabel = (value: string) => t(`fixAdmin.ops.qb.author.difficulty.${value}`);
  const pickersDisabled = taxonomyState.status !== "ready" || !taxonomyVersion;

  return <div className="space-y-6">
    <AdminPageHeader
      title={t("fixAdmin.ops.qb.author.title")}
      description={t("fixAdmin.ops.qb.author.subtitle")}
      breadcrumbs={[{ label: t("fixAdmin.ops.qb.author.crumbAdmin"), href: "/admin/dashboard" }, { label: t("fixAdmin.ops.qb.author.crumbBank"), href: "/admin/question-bank" }, { label: t("fixAdmin.ops.qb.author.crumbNew") }]}
     
    />
    <form onSubmit={submit} noValidate className="min-w-0 space-y-5 rounded-2xl border border-[#DCE4F3] bg-white p-4 sm:p-6">
      {taxonomyState.status === "error" && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-[#F3C4C4] bg-[#FFF8F8] p-3 text-sm text-[#B42323] sm:flex-row sm:items-center sm:justify-between">
          <span className="flex min-w-0 items-start gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span className="min-w-0 break-words">{t(taxonomyState.forbidden ? "fixAdmin.ops.qb.author.taxonomyForbidden" : "fixAdmin.ops.qb.author.taxonomyError")}</span></span>
          {!taxonomyState.forbidden && <button type="button" onClick={retryTaxonomy} className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-xl border border-[#F3C4C4] bg-white px-3 py-1.5 text-xs font-semibold text-[#B42323] hover:border-[#C43B3B] sm:self-auto"><RotateCcw className="size-3.5" aria-hidden="true" />{t("fixAdmin.ops.qb.author.retry")}</button>}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("fixAdmin.ops.qb.author.stableKey")} hint={t("fixAdmin.ops.qb.author.stableKeyHint")} value={form.stableKey} onChange={(v) => update("stableKey", v)} error={errors.stableKey} />
        <div className="block min-w-0 text-xs font-semibold text-[#14244B]">
          <span>{t("fixAdmin.ops.qb.author.taxonomyVersion")}</span>
          <span className="mt-0.5 block font-normal text-[#607096]">{t("fixAdmin.ops.qb.author.taxonomyVersionHint")} <Link href="/admin/taxonomy" className="font-semibold text-[#204195] underline">{t("fixAdmin.ops.qb.author.taxonomyLink")}</Link></span>
          <div className="mt-1 flex min-h-[38px] min-w-0 items-center gap-2 rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] px-2 py-2 text-sm font-normal" aria-live="polite">
            {taxonomyState.status === "loading"
              ? <span className="inline-flex items-center gap-1.5 text-[#607096]"><Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />{t("fixAdmin.ops.qb.author.taxonomyLoading")}</span>
              : taxonomyVersion
                ? <span className="min-w-0 break-all font-mono text-[13px] text-[#14244B]">{taxonomyVersion}</span>
                : <span className="text-[#B42323]">{t(taxonomyState.status === "error" ? "fixAdmin.ops.qb.author.taxonomyUnavailable" : "fixAdmin.ops.qb.author.taxonomyNoActiveShort")}</span>}
          </div>
        </div>
        <div className="sm:col-span-2">
          <ConceptPicker mode="single" label={t("fixAdmin.ops.qb.author.primary")} hint={t("fixAdmin.ops.qb.author.primaryHint")} concepts={pools.primary} value={form.primaryCompetency} onChange={(v) => update("primaryCompetency", v)} disabled={pickersDisabled} error={errors.primaryCompetency} />
        </div>
        <ConceptPicker mode="multi" label={t("fixAdmin.ops.qb.author.skills")} hint={t("fixAdmin.ops.qb.author.skillsHint")} concepts={pools.skills} value={form.skillIds} onChange={(v) => update("skillIds", v)} disabled={pickersDisabled} invalid={Boolean(errors.targets)} />
        <ConceptPicker mode="multi" label={t("fixAdmin.ops.qb.author.roles")} hint={t("fixAdmin.ops.qb.author.rolesHint")} concepts={pools.roles} value={form.roleIds} onChange={(v) => update("roleIds", v)} disabled={pickersDisabled} invalid={Boolean(errors.targets)} />
        {errors.targets && <p role="alert" className="-mt-2 text-xs text-[#C43B3B] sm:col-span-2">{errors.targets}</p>}
        <Select label={t("fixAdmin.ops.qb.author.questionType")} value={form.questionType} options={QUESTION_TYPES} label_={typeLabel} onChange={(v) => update("questionType", v)} />
        <Select label={t("fixAdmin.ops.qb.author.difficulty")} value={form.difficultyBand} options={DIFFICULTY_BANDS} label_={difficultyLabel} onChange={(v) => update("difficultyBand", v)} />
        <Field label={t("fixAdmin.ops.qb.author.thinking")} type="number" value={form.thinking} onChange={(v) => update("thinking", v)} error={errors.thinking} />
        <Field label={t("fixAdmin.ops.qb.author.soft")} type="number" value={form.soft} onChange={(v) => update("soft", v)} error={errors.soft} />
        <Field label={t("fixAdmin.ops.qb.author.hard")} type="number" value={form.hard} onChange={(v) => update("hard", v)} error={errors.hard} />
      </div>
      <Field label={t("fixAdmin.ops.qb.author.canonicalText")} value={form.canonicalText} onChange={(v) => update("canonicalText", v)} multiline error={errors.canonicalText} />
      <Field label={t("fixAdmin.ops.qb.author.objective")} value={form.objective} onChange={(v) => update("objective", v)} multiline error={errors.objective} />
      <Field label={t("fixAdmin.ops.qb.author.rubric")} value={form.rubric} onChange={(v) => update("rubric", v)} multiline rows={12} error={errors.rubric} />
      <Field label={t("fixAdmin.ops.qb.author.contextPolicy")} value={form.contextPolicy} onChange={(v) => update("contextPolicy", v)} multiline mono error={errors.contextPolicy} />
      <Field label={t("fixAdmin.ops.qb.author.personalizationPolicy")} value={form.personalizationPolicy} onChange={(v) => update("personalizationPolicy", v)} multiline mono error={errors.personalizationPolicy} />
      {message && <p role={message.tone === "error" ? "alert" : "status"} className={`rounded-xl p-3 text-sm break-words [overflow-wrap:anywhere] ${message.tone === "error" ? "bg-[#FFF8F8] text-[#B42323]" : "bg-[#EEF2FD] text-[#14244B]"}`}>{message.text}{createdQuestionId && <> <Link href={`/admin/question-bank/${createdQuestionId}`} className="font-semibold text-[#204195] underline">{t("fixAdmin.ops.qb.author.openDetail")}</Link></>}</p>}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button type="submit" disabled={saving || Boolean(taxonomyBlocker)} aria-describedby={taxonomyBlocker ? "qb-author-submit-blocker" : undefined} className="rounded-xl bg-[#204195] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{saving ? t("fixAdmin.ops.qb.author.saving") : t("fixAdmin.ops.qb.author.save")}</button>
        {taxonomyBlocker && <span id="qb-author-submit-blocker" className="text-xs text-[#607096]">{taxonomyBlocker}</span>}
      </div>
    </form>
  </div>;
}

function Field({ label, hint, value, onChange, error, multiline, mono, rows = 3, type = "text" }: { label: string; hint?: string; value: string; onChange: (value: string) => void; error?: string; multiline?: boolean; mono?: boolean; rows?: number; type?: string }) {
  const className = `mt-1 w-full min-w-0 rounded-xl border p-2 text-sm font-normal ${error ? "border-[#C43B3B]" : "border-[#DCE4F3]"}`;
  return <label className="block min-w-0 text-xs font-semibold text-[#14244B]">{label}{hint && <span className="mt-0.5 block font-normal text-[#607096]">{hint}</span>}
    {multiline
      ? <textarea className={rows > 3 || mono ? `${className} font-mono text-xs` : className} value={value} onChange={(e) => onChange(e.target.value)} rows={rows} aria-invalid={error ? true : undefined} />
      : <input className={className} type={type} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined} />}
    {error && <span role="alert" className="mt-1 block font-normal text-[#C43B3B]">{error}</span>}
  </label>;
}
function Select({ label, value, options, label_, onChange }: { label: string; value: string; options: readonly string[]; label_: (value: string) => string; onChange: (value: string) => void }) {
  return <label className="block min-w-0 text-xs font-semibold text-[#14244B]">{label}<select className="mt-1 w-full rounded-xl border border-[#DCE4F3] bg-white p-2 text-sm font-normal" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option} value={option}>{label_(option)}</option>)}</select></label>;
}
