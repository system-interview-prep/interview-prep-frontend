"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import { ConfirmDialog } from "@components/shared/ConfirmDialog";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminSection from "./primitives/AdminSection";
import AdminStatusBadge from "./primitives/AdminStatusBadge";
import { BlueprintPreviewTable } from "./InterviewBlueprintsClient";
import {
  BLUEPRINT_STATUS_TONE,
  blueprintErrorCode,
  interviewBlueprintApi,
  type BlueprintDefinition,
  type BlueprintPreviewRow,
  type BlueprintVersion,
} from "@features/admin/services/interviewBlueprint.service";

type Section = keyof Omit<BlueprintDefinition, "schemaVersion">;

const inputClass =
  "w-24 rounded-lg border border-[#DCE4F3] bg-white px-2 py-1.5 text-right text-sm tabular-nums disabled:bg-[#F8FAFC] disabled:text-[#607096]";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm text-[#14244B]">
      <span>{label}</span>
      <span className="flex items-center gap-2">{children}</span>
    </label>
  );
}

export default function InterviewBlueprintEditorClient({ id }: { id: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [version, setVersion] = useState<BlueprintVersion | null>(null);
  const [draft, setDraft] = useState<BlueprintDefinition | null>(null);
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState<BlueprintPreviewRow[]>([]);
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);
  const [invalid, setInvalid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmActivate, setConfirmActivate] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apply = useCallback((next: BlueprintVersion) => {
    setVersion(next);
    setDraft(next.definition);
    setName(next.name);
    setSummary(next.changeSummary);
    setDescription(next.description);
    setPreview(next.preview);
    setPreviewErrors(next.activationErrors);
    setInvalid(false);
  }, []);

  useEffect(() => {
    interviewBlueprintApi
      .get(id)
      .then(({ data }) => apply(data))
      .catch(() => setMessage(t("blueprint.error.generic")));
  }, [id, apply, t]);

  const editable = Boolean(version?.actions.edit);

  // Preview is computed by Core, the same rules that block submission.
  useEffect(() => {
    if (!draft || !editable) return;
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(async () => {
      try {
        const { data } = await interviewBlueprintApi.preview(draft);
        setPreview(data.preview);
        setPreviewErrors(data.activationErrors);
        setInvalid(false);
      } catch {
        setInvalid(true);
      }
    }, 400);
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, [draft, editable]);

  const fail = (error: unknown) => {
    const code = blueprintErrorCode(error);
    const key = code ? `blueprint.error.${code}` : "";
    const text = key ? t(key) : "";
    setMessage(text && text !== key ? text : t("blueprint.error.generic"));
  };

  const run = async (action: () => Promise<{ data: BlueprintVersion }>, done: string) => {
    setBusy(true);
    setMessage(null);
    try {
      const { data } = await action();
      apply(data);
      setMessage(t(done));
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  const fields = () => ({ name, description, changeSummary: summary, definition: draft! });
  const save = () => run(() => interviewBlueprintApi.update(id, fields()), "blueprint.saved");
  const submit = () =>
    run(async () => {
      await interviewBlueprintApi.update(id, fields());
      return interviewBlueprintApi.submit(id);
    }, "blueprint.submitted");

  const copy = async () => {
    setBusy(true);
    try {
      const { data } = await interviewBlueprintApi.create({ basedOnId: id });
      router.push(`/admin/interview-blueprints/${data.id}`);
    } catch (error) {
      fail(error);
      setBusy(false);
    }
  };

  if (!version || !draft) {
    return <p className="text-sm text-[#607096]">{message ?? "…"}</p>;
  }

  const set = <S extends Section, K extends keyof BlueprintDefinition[S]>(section: S, key: K, value: BlueprintDefinition[S][K]) =>
    setDraft((current) => (current ? { ...current, [section]: { ...current[section], [key]: value } } : current));

  const seconds = <S extends Section>(section: S, key: keyof BlueprintDefinition[S] & string, disabled = false) => (
    <>
      <input
        type="number"
        min={0}
        className={inputClass}
        disabled={!editable || disabled}
        value={Number(draft[section][key] as number)}
        onChange={(event) => set(section, key, Number(event.target.value) as never)}
      />
      <span className="w-20 text-xs text-[#607096]">{t("blueprint.seconds")}</span>
    </>
  );

  const count = <S extends Section>(section: S, key: keyof BlueprintDefinition[S] & string, disabled = false) => (
    <>
      <input
        type="number"
        min={1}
        className={inputClass}
        disabled={!editable || disabled}
        value={Number(draft[section][key] as number)}
        onChange={(event) => set(section, key, Number(event.target.value) as never)}
      />
      <span className="w-20" />
    </>
  );

  const percent = <S extends Section>(section: S, key: keyof BlueprintDefinition[S] & string, disabled = false) => (
    <>
      <input
        type="number"
        min={1}
        max={100}
        className={inputClass}
        disabled={!editable || disabled}
        value={Math.round(Number(draft[section][key] as number) * 100)}
        onChange={(event) => set(section, key, (Number(event.target.value) / 100) as never)}
      />
      <span className="w-20 text-xs text-[#607096]">{t("blueprint.percent")}</span>
    </>
  );

  const toggle = <S extends Section>(section: S, key: keyof BlueprintDefinition[S] & string, label: string) => (
    <Row label={label}>
      <input
        type="checkbox"
        className="h-4 w-4 accent-[#204195]"
        disabled={!editable}
        checked={Boolean(draft[section][key])}
        onChange={(event) => set(section, key, event.target.checked as never)}
      />
    </Row>
  );

  const validateOff = !draft.validate.enabled;
  const behavioralOff = !draft.behavioral.enabled;
  const qnaOff = !draft.closing.qnaEnabled;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`${fmt(t("blueprint.versionLabel"), { n: version.version })} · ${version.name}`}
        breadcrumbs={[{ label: t("blueprint.title"), href: "/admin/interview-blueprints" }, { label: `v${version.version}` }]}
        statusBadge={<AdminStatusBadge status={BLUEPRINT_STATUS_TONE[version.status]} label={t(`blueprint.status.${version.status}`)} />}
        primaryAction={
          <div className="flex flex-wrap gap-2">
            {version.actions.edit && (
              <button type="button" onClick={save} disabled={busy || invalid} className="rounded-xl border border-[#DCE4F3] px-4 py-2 text-sm font-semibold text-[#14244B] disabled:opacity-60">
                {busy ? t("blueprint.saving") : t("blueprint.save")}
              </button>
            )}
            {version.actions.submit && (
              <button type="button" onClick={submit} disabled={busy || invalid || previewErrors.length > 0} className="rounded-xl bg-[#204195] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {t("blueprint.submit")}
              </button>
            )}
            {version.actions.activate && (
              <button type="button" onClick={() => setConfirmActivate(true)} disabled={busy} className="rounded-xl bg-[#204195] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {t("blueprint.activate")}
              </button>
            )}
            {version.actions.reject && (
              <button type="button" onClick={() => setRejecting(true)} disabled={busy} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-60">
                {t("blueprint.reject")}
              </button>
            )}
            {!editable && (
              <button type="button" onClick={copy} disabled={busy} className="rounded-xl border border-[#DCE4F3] px-4 py-2 text-sm font-semibold text-[#14244B] disabled:opacity-60">
                {t("blueprint.copy")}
              </button>
            )}
          </div>
        }
      />
      {message && <p className="text-sm text-[#607096]">{message}</p>}
      {!editable && <p className="text-sm text-[#607096]">{t("blueprint.readOnly")}</p>}
      {version.reviewNote && (
        <p className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-3 text-sm text-[#14244B]">
          <span className="font-semibold">{t("blueprint.reviewNote")}: </span>
          {version.reviewNote}
        </p>
      )}

      {rejecting && (
        <div className="space-y-2 rounded-2xl border border-red-200 bg-white p-4">
          <label className="block text-sm font-semibold text-[#14244B]" htmlFor="blueprint-reject-note">{t("blueprint.rejectNote")}</label>
          <textarea id="blueprint-reject-note" value={rejectNote} onChange={(event) => setRejectNote(event.target.value)} rows={3} className="w-full rounded-xl border border-[#DCE4F3] p-2 text-sm" />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || !rejectNote.trim()}
              onClick={() => run(() => interviewBlueprintApi.reject(id, rejectNote), "blueprint.rejected").then(() => setRejecting(false))}
              className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {t("blueprint.reject")}
            </button>
            <button type="button" onClick={() => setRejecting(false)} className="rounded-xl border border-[#DCE4F3] px-4 py-2 text-sm font-semibold text-[#14244B]">
              {t("blueprint.cancel")}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <AdminSection title={t("blueprint.name")}>
            <div className="space-y-3">
              <input value={name} disabled={!editable} onChange={(event) => setName(event.target.value)} maxLength={160} className="w-full rounded-xl border border-[#DCE4F3] px-3 py-2 text-sm disabled:bg-[#F8FAFC]" aria-label={t("blueprint.name")} />
              <textarea value={description} disabled={!editable} onChange={(event) => setDescription(event.target.value)} maxLength={400} rows={2} placeholder={t("blueprint.type.descriptionPlaceholder")} className="w-full rounded-xl border border-[#DCE4F3] px-3 py-2 text-sm disabled:bg-[#F8FAFC]" aria-label={t("blueprint.type.description")} />
              <textarea value={summary} disabled={!editable} onChange={(event) => setSummary(event.target.value)} rows={2} placeholder={t("blueprint.changeSummary")} className="w-full rounded-xl border border-[#DCE4F3] px-3 py-2 text-sm disabled:bg-[#F8FAFC]" aria-label={t("blueprint.changeSummary")} />
            </div>
          </AdminSection>

          <AdminSection title={t("blueprint.contract.title")}>
            <div className="space-y-3">
              <p className="text-xs leading-5 text-[#607096]">{t("blueprint.contract.help")}</p>
              <label className="block space-y-1 text-sm text-[#14244B]">
                <span>{t("blueprint.contract.objective")}</span>
                <textarea
                  value={draft.contract.objective}
                  disabled={!editable}
                  maxLength={500}
                  rows={3}
                  onChange={(event) => set("contract", "objective", event.target.value)}
                  className="w-full rounded-xl border border-[#DCE4F3] px-3 py-2 text-sm disabled:bg-[#F8FAFC]"
                />
              </label>
              <label className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm text-[#14244B]">
                <span>{t("blueprint.contract.coverage")}</span>
                <select
                  value={draft.contract.coverageTarget}
                  disabled={!editable}
                  onChange={(event) => set("contract", "coverageTarget", event.target.value as BlueprintDefinition["contract"]["coverageTarget"])}
                  className="rounded-lg border border-[#DCE4F3] bg-white px-2 py-1.5 text-sm disabled:bg-[#F8FAFC]"
                >
                  <option value="all_frozen_questions">{t("blueprint.contract.coverageAll")}</option>
                  <option value="job_must_haves">{t("blueprint.contract.coverageMustHave")}</option>
                </select>
              </label>
              {toggle("contract", "requireBehavioralWhenEnabled", t("blueprint.contract.requireBehavioral"))}
              <Row label={t("blueprint.contract.maxProbes")}>
                <input
                  type="number"
                  min={0}
                  max={3}
                  className={inputClass}
                  disabled={!editable}
                  value={draft.contract.maxProbesPerQuestion}
                  onChange={(event) => set("contract", "maxProbesPerQuestion", Number(event.target.value))}
                />
              </Row>
            </div>
          </AdminSection>

          <AdminSection title={`1. ${t("blueprint.stage.warmUp")}`}>
            <Row label={t("blueprint.soft")}>{seconds("warmUp", "softAnswerSeconds")}</Row>
            <Row label={t("blueprint.hard")}>{seconds("warmUp", "hardAnswerSeconds")}</Row>
          </AdminSection>

          <AdminSection title={`2. ${t("blueprint.stage.validate")}`}>
            {toggle("validate", "enabled", t("blueprint.enabled"))}
            <Row label={t("blueprint.soft")}>{seconds("validate", "softAnswerSeconds", validateOff)}</Row>
            <Row label={t("blueprint.hard")}>{seconds("validate", "hardAnswerSeconds", validateOff)}</Row>
            <Row label={t("blueprint.validate.untilRatio")}>{percent("validate", "untilRatio", validateOff)}</Row>
            {!validateOff && toggle("validate", "probeEnabled", t("blueprint.probe"))}
          </AdminSection>

          <AdminSection title={`3. ${t("blueprint.stage.technical")}`}>
            <Row label={t("blueprint.technical.maxQuestions")}>{count("technical", "maxQuestions")}</Row>
            <Row label={t("blueprint.technical.expectedSeconds")}>{seconds("technical", "expectedSecondsPerQuestion")}</Row>
            <Row label={t("blueprint.technical.deepDiveUntil")}>{percent("technical", "deepDiveUntilRatio")}</Row>
            <Row label={t("blueprint.technical.challengeUntil")}>{percent("technical", "challengeUntilRatio")}</Row>
            {toggle("technical", "probeEnabled", t("blueprint.probe"))}
            {toggle("technical", "challengeForCoding", t("blueprint.technical.challengeForCoding"))}
            {toggle("technical", "challengeForCvGaps", t("blueprint.technical.challengeForGaps"))}
            <Row label={t("blueprint.technical.fastFail")}>{count("technical", "fastFailAfterGiveUps")}</Row>
          </AdminSection>

          <AdminSection title={`4. ${t("blueprint.stage.behavioral")}`}>
            {toggle("behavioral", "enabled", t("blueprint.enabled"))}
            <Row label={t("blueprint.soft")}>{seconds("behavioral", "softAnswerSeconds", behavioralOff)}</Row>
            <Row label={t("blueprint.hard")}>{seconds("behavioral", "hardAnswerSeconds", behavioralOff)}</Row>
            <Row label={t("blueprint.behavioral.reserve")}>{seconds("behavioral", "reserveSeconds", behavioralOff)}</Row>
          </AdminSection>

          <AdminSection title={`5. ${t("blueprint.stage.closing")}`}>
            {toggle("closing", "qnaEnabled", t("blueprint.closing.qna"))}
            <Row label={t("blueprint.closing.maxQuestions")}>{count("closing", "maxQuestions", qnaOff)}</Row>
            <Row label={t("blueprint.closing.budget")}>{seconds("closing", "budgetSeconds", qnaOff)}</Row>
            <Row label={t("blueprint.closing.minToOpen")}>{seconds("closing", "minSecondsToOpen", qnaOff)}</Row>
            <Row label={t("blueprint.closing.reserve")}>{seconds("closing", "reserveSeconds")}</Row>
          </AdminSection>

          <AdminSection title={t("blueprint.stage.pacing")}>
            <Row label={t("blueprint.pacing.cutoff")}>{seconds("pacing", "emergencyCutoffSeconds")}</Row>
            <Row label={t("blueprint.pacing.behind")}>{percent("pacing", "behindScheduleRatio")}</Row>
          </AdminSection>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <AdminSection title={t("blueprint.preview")}>
            <BlueprintPreviewTable rows={preview} />
            {invalid && <p className="mt-3 text-xs text-red-700">{t("blueprint.error.invalid_blueprint")}</p>}
            {previewErrors.map((error) => (
              <p key={error} className="mt-3 text-xs text-red-700">{error}</p>
            ))}
          </AdminSection>
        </div>
      </div>

      <ConfirmDialog
        open={confirmActivate}
        title={t("blueprint.activateTitle")}
        body={t("blueprint.activateBody")}
        confirmLabel={t("blueprint.activate")}
        cancelLabel={t("blueprint.cancel")}
        busy={busy}
        onConfirm={() => run(() => interviewBlueprintApi.activate(id), "blueprint.activated").then(() => setConfirmActivate(false))}
        onCancel={() => setConfirmActivate(false)}
      />
    </div>
  );
}
