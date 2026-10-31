"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import { Pagination } from "@components/shared/Pagination";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminStatusBadge from "./primitives/AdminStatusBadge";
import {
  BLUEPRINT_STATUS_TONE,
  interviewBlueprintApi,
  type BlueprintList,
  type BlueprintPreviewRow,
} from "@features/admin/services/interviewBlueprint.service";

const PAGE_SIZE = 10;

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

export default function InterviewBlueprintsClient() {
  const { t } = useLanguage();
  const router = useRouter();
  const [data, setData] = useState<BlueprintList | null>(null);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    interviewBlueprintApi
      .list()
      .then(({ data: list }) => setData(list))
      .catch(() => setError(t("blueprint.error.generic")));
  }, [t]);

  const createDraft = async () => {
    setCreating(true);
    try {
      const { data: draft } = await interviewBlueprintApi.create({});
      router.push(`/admin/interview-blueprints/${draft.id}`);
    } catch {
      setError(t("blueprint.error.generic"));
      setCreating(false);
    }
  };

  const active = data?.items.find((item) => item.id === data.activeVersionId) ?? null;
  const items = data?.items ?? [];
  const paged = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("blueprint.title")}
        description={t("blueprint.subtitle")}
        primaryAction={
          <button
            type="button"
            onClick={createDraft}
            disabled={creating}
            className="rounded-xl bg-[#204195] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {creating ? t("blueprint.creating") : t("blueprint.newDraft")}
          </button>
        }
      />
      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="rounded-2xl border border-[#DCE4F3] bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase text-[#607096]">{t("blueprint.inUse")}</span>
          <span className="text-sm font-bold text-[#14244B]">
            {active ? `${fmt(t("blueprint.versionLabel"), { n: active.version })} · ${active.name}` : t("blueprint.systemDefault")}
          </span>
        </div>
        <div className="mt-4 max-w-md">
          <BlueprintPreviewTable rows={active?.preview ?? data?.systemDefault.preview ?? []} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white">
        {items.length === 0 ? (
          <p className="p-6 text-sm text-[#607096]">{data ? t("blueprint.empty") : "…"}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] text-[11px] font-bold uppercase text-[#607096]">
                  <th className="px-4 py-3">{t("blueprint.col.version")}</th>
                  <th className="px-4 py-3">{t("blueprint.col.name")}</th>
                  <th className="px-4 py-3">{t("blueprint.col.status")}</th>
                  <th className="px-4 py-3">{t("blueprint.col.updated")}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFF8] text-[#14244B]">
                {paged.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 tabular-nums">v{item.version}</td>
                    <td className="px-4 py-3 font-semibold">{item.name}</td>
                    <td className="px-4 py-3">
                      <AdminStatusBadge status={BLUEPRINT_STATUS_TONE[item.status]} label={t(`blueprint.status.${item.status}`)} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-xs text-[#607096]">
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("vi-VN") : ""}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/interview-blueprints/${item.id}`} className="text-sm font-semibold text-[#204195] hover:underline">
                        {t("blueprint.open")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {items.length > PAGE_SIZE && (
          <div className="border-t border-[#EAEFF8] bg-[#F8FAFC] px-4 py-3">
            <Pagination page={page} pageSize={PAGE_SIZE} total={items.length} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
