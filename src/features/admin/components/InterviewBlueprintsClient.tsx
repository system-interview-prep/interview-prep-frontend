"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminStatusBadge from "./primitives/AdminStatusBadge";
import {
  BLUEPRINT_STATUS_TONE,
  blueprintErrorCode,
  interviewBlueprintApi,
  type BlueprintList,
  type BlueprintPreviewRow,
  type InterviewTypeAdmin,
} from "@features/admin/services/interviewBlueprint.service";

const VERSIONS_SHOWN = 5;

export function BlueprintPreviewTable({ rows }: { rows: BlueprintPreviewRow[] }) {
  const { t } = useLanguage();
  return (
    <table className="w-full text-left text-xs">
      <thead>
        <tr className="text-[11px] font-bold uppercase text-[#607096]">
          <th className="py-2 pr-3">{t("blueprint.preview.package")}</th>
          <th className="py-2 pr-3">{t("blueprint.preview.questions")}</th>
          <th className="py-2 pr-3">{t("blueprint.preview.expected")}</th>
          <th className="py-2" />
        </tr>
      </thead>
      <tbody className="divide-y divide-[#EAEFF8] text-[#14244B]">
        {rows.map((row) => (
          <tr key={row.durationMinutes}>
            <td className="py-2 pr-3 tabular-nums">{fmt(t("blueprint.preview.minutes"), { n: row.durationMinutes })}</td>
            <td className="py-2 pr-3 tabular-nums">{row.technicalQuestions}</td>
            <td className="py-2 pr-3 tabular-nums">{fmt(t("blueprint.preview.minutes"), { n: Math.ceil(row.expectedSeconds / 60) })}</td>
            <td className="py-2">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${row.fits ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                {t(row.fits ? "blueprint.preview.fits" : "blueprint.preview.overflow")}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-bold text-[#14244B] tabular-nums">{value}</p>
      <p className="text-[11px] text-[#607096]">{label}</p>
    </div>
  );
}

function TypeCard({
  item,
  busy,
  onNewDraft,
  onUpdate,
}: {
  item: InterviewTypeAdmin;
  busy: boolean;
  onNewDraft: (item: InterviewTypeAdmin) => void;
  onUpdate: (item: InterviewTypeAdmin, body: { isListed?: boolean; isDefault?: boolean }) => void;
}) {
  const { t } = useLanguage();
  const [showAll, setShowAll] = useState(false);
  const versions = showAll ? item.versions : item.versions.slice(0, VERSIONS_SHOWN);
  const { sessions, completionRate, averageScore } = item.stats;
  const chip = "rounded-full px-2 py-0.5 text-[11px] font-semibold";

  return (
    <div className="rounded-2xl border border-[#DCE4F3] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-[#14244B]">{item.name}</h2>
            {item.isDefault && <span className={`${chip} bg-[#EEF2FD] text-[#204195]`}>{t("blueprint.type.default")}</span>}
            <span className={`${chip} ${item.isListed ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
              {t(item.isListed ? "blueprint.type.listed" : "blueprint.type.hidden")}
            </span>
            {item.pendingReview > 0 && (
              <span className={`${chip} bg-violet-50 text-violet-700`}>{fmt(t("blueprint.type.pending"), { n: item.pendingReview })}</span>
            )}
          </div>
          {item.description && <p className="mt-1 text-xs text-[#607096]">{item.description}</p>}
          <p className="mt-1 text-xs text-[#607096]">
            {item.activeVersion ? fmt(t("blueprint.type.activeVersion"), { n: item.activeVersion.version }) : t("blueprint.type.noVersion")}
            {" · "}
            {item.preview.map((row) => `${row.durationMinutes}′: ${row.technicalQuestions}`).join(" · ")} {t("blueprint.type.technical")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {item.actions.newDraft && (
            <button type="button" disabled={busy} onClick={() => onNewDraft(item)} className="rounded-xl bg-[#204195] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
              {t("blueprint.newDraft")}
            </button>
          )}
          {item.actions.toggleListed && (
            <button type="button" disabled={busy} onClick={() => onUpdate(item, { isListed: !item.isListed })} className="rounded-xl border border-[#DCE4F3] px-3 py-1.5 text-xs font-semibold text-[#14244B] disabled:opacity-60">
              {t(item.isListed ? "blueprint.type.hide" : "blueprint.type.show")}
            </button>
          )}
          {item.actions.makeDefault && (
            <button type="button" disabled={busy} onClick={() => onUpdate(item, { isDefault: true })} className="rounded-xl border border-[#DCE4F3] px-3 py-1.5 text-xs font-semibold text-[#14244B] disabled:opacity-60">
              {t("blueprint.type.makeDefault")}
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-[#F8FAFC] p-3">
        <Stat label={t("blueprint.stats.sessions")} value={String(sessions)} />
        <Stat label={t("blueprint.stats.completion")} value={completionRate === null ? "—" : `${Math.round(completionRate * 100)}%`} />
        <Stat label={t("blueprint.stats.score")} value={averageScore === null ? "—" : String(averageScore)} />
      </div>

      {item.versions.length > 0 && (
        <ul className="mt-4 divide-y divide-[#EAEFF8] text-sm">
          {versions.map((version) => (
            <li key={version.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className="tabular-nums text-xs text-[#607096]">v{version.version}</span>
                <span className="truncate font-semibold text-[#14244B]">{version.name}</span>
                <AdminStatusBadge status={BLUEPRINT_STATUS_TONE[version.status]} label={t(`blueprint.status.${version.status}`)} size="sm" />
              </span>
              <Link href={`/admin/interview-blueprints/${version.id}`} className="text-xs font-semibold text-[#204195] hover:underline">
                {t("blueprint.open")}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {item.versions.length > VERSIONS_SHOWN && (
        <button type="button" onClick={() => setShowAll(!showAll)} className="mt-2 text-xs font-semibold text-[#204195] hover:underline">
          {showAll ? t("blueprint.type.showLess") : fmt(t("blueprint.type.showAll"), { n: item.versions.length })}
        </button>
      )}
    </div>
  );
}

export default function InterviewBlueprintsClient() {
  const { t } = useLanguage();
  const router = useRouter();
  const [data, setData] = useState<BlueprintList | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    interviewBlueprintApi
      .list()
      .then(({ data: list }) => setData(list))
      .catch(() => setError(t("blueprint.error.generic")));
  }, [t, version]);

  const fail = useCallback(
    (cause: unknown) => {
      const code = blueprintErrorCode(cause);
      const key = code ? `blueprint.error.${code}` : "";
      const text = key ? t(key) : "";
      setError(text && text !== key ? text : t("blueprint.error.generic"));
    },
    [t],
  );

  const openDraft = async (request: () => Promise<{ data: { id: string } }>) => {
    setBusy(true);
    setError(null);
    try {
      const { data: draft } = await request();
      router.push(`/admin/interview-blueprints/${draft.id}`);
    } catch (cause) {
      fail(cause);
      setBusy(false);
    }
  };

  const update = async (item: InterviewTypeAdmin, body: { isListed?: boolean; isDefault?: boolean }) => {
    setBusy(true);
    setError(null);
    try {
      await interviewBlueprintApi.updateType(item.id, body);
      setVersion((value) => value + 1);
    } catch (cause) {
      fail(cause);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("blueprint.title")}
        description={t("blueprint.subtitle")}
        primaryAction={
          <button type="button" onClick={() => setCreating(true)} disabled={busy} className="rounded-xl bg-[#204195] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {t("blueprint.type.new")}
          </button>
        }
      />
      {error && <p className="text-sm text-red-700">{error}</p>}

      {creating && (
        <div className="space-y-3 rounded-2xl border border-[#DCE4F3] bg-white p-4 sm:p-5">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            maxLength={160}
            placeholder={t("blueprint.type.namePlaceholder")}
            aria-label={t("blueprint.type.name")}
            className="w-full rounded-xl border border-[#DCE4F3] px-3 py-2 text-sm"
          />
          <textarea
            value={newDescription}
            onChange={(event) => setNewDescription(event.target.value)}
            maxLength={400}
            rows={2}
            placeholder={t("blueprint.type.descriptionPlaceholder")}
            aria-label={t("blueprint.type.description")}
            className="w-full rounded-xl border border-[#DCE4F3] px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || !newName.trim()}
              onClick={() => openDraft(() => interviewBlueprintApi.createType({ name: newName, description: newDescription }))}
              className="rounded-xl bg-[#204195] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? t("blueprint.creating") : t("blueprint.type.create")}
            </button>
            <button type="button" onClick={() => setCreating(false)} className="rounded-xl border border-[#DCE4F3] px-4 py-2 text-sm font-semibold text-[#14244B]">
              {t("blueprint.cancel")}
            </button>
          </div>
        </div>
      )}

      {!data ? (
        <p className="text-sm text-[#607096]">…</p>
      ) : (
        <div className="space-y-4">
          {data.items.map((item) => (
            <TypeCard
              key={item.id}
              item={item}
              busy={busy}
              onNewDraft={(target) => openDraft(() => interviewBlueprintApi.create({ blueprintId: target.id }))}
              onUpdate={update}
            />
          ))}
        </div>
      )}
    </div>
  );
}
