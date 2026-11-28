"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardCheck, ExternalLink, Info, Search } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import { Pagination } from "@components/shared/Pagination";
import { rubricsApi, type RubricItem } from "@features/admin/services/rubrics.service";
import AdminEmptyState from "./primitives/AdminEmptyState";
import AdminRowAction, { AdminRowActions } from "./primitives/AdminRowAction";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminStatusBadge from "./primitives/AdminStatusBadge";
import { lifecycleTone } from "./primitives/statusTone";

const PAGE_SIZE = 20;
const questionHref = (questionId: string) => `/admin/question-bank/${encodeURIComponent(questionId)}`;

export default function AdminRubricsClient() {
  const { t } = useLanguage();
  const router = useRouter();
  const statusLabel = (value: string) => {
    const key = `fixAdmin.ops.qb.status.${value}`;
    const text = t(key);
    return text && text !== key ? text : value;
  };
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);
  const [items, setItems] = useState<RubricItem[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error" | "forbidden">("loading");
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try { setState("loading"); const { data } = await rubricsApi.list(query || undefined); setItems(data.items); setPage(1); setState("ready"); }
      catch (error: unknown) { setState((error as { response?: { status?: number } }).response?.status === 403 ? "forbidden" : "error"); }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, reloadToken]);

  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const title = t("fixAdmin.ops.rubrics.title");
  const th = "px-6 py-4";

  return <div className="space-y-6">
    <AdminPageHeader title={title} description={t("fixAdmin.ops.rubrics.subtitle")} breadcrumbs={[{ label: "Quản trị", href: "/admin/dashboard" }, { label: title }]} statusBadge={<AdminStatusBadge status={state === "error" ? "error" : "info"} label={state === "loading" ? t("admin.common.loading") : t("fixAdmin.ops.common.fromCore")} />} />
    <p className="-mt-3 flex items-start gap-2 text-sm text-[#607096]"><Info className="mt-0.5 size-4 shrink-0 text-[#204195]" aria-hidden="true" /><span>{t("fixAdmin.ops.rubrics.editHint")}</span></p>
    <div className="relative w-full sm:max-w-md">
      <label htmlFor="admin-rubrics-search" className="sr-only">{t("fixAdmin.ops.rubrics.searchLabel")}</label>
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#607096]" aria-hidden="true" />
      <input id="admin-rubrics-search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} className="w-full rounded-full border border-[#DCE4F3] bg-white py-2 pl-9 pr-4 text-xs text-[#14244B] focus:border-[#204195] focus:outline-none" placeholder={t("fixAdmin.ops.rubrics.searchPlaceholder")} />
    </div>
    <div className="overflow-hidden rounded-3xl border border-[#DCE4F3] bg-white">
      <div className="relative overflow-x-auto"><table className="w-full min-w-[860px] text-left text-xs"><thead><tr className="border-b border-[#EAEFF8] bg-[#F8FAFC] text-[11px] font-bold uppercase text-[#607096]">
        <th className={th}>{t("fixAdmin.ops.rubrics.table.rubric")}</th>
        <th className={th}>{t("fixAdmin.ops.rubrics.table.version")}</th>
        <th className={`${th} whitespace-nowrap text-center`}>{t("fixAdmin.ops.rubrics.table.criteria")}</th>
        <th className={`${th} whitespace-nowrap text-center`}>{t("fixAdmin.ops.rubrics.table.totalWeight")}</th>
        <th className={`${th} whitespace-nowrap text-right`}>{t("fixAdmin.ops.rubrics.table.status")}</th>
        <th className={`${th} whitespace-nowrap text-right`}><span className="sr-only">{t("fixAdmin.ops.rubrics.table.actions")}</span></th>
      </tr></thead><tbody className="divide-y divide-[#EAEFF8]">
        {state === "loading" ? <tr><td colSpan={6} className="p-8 text-center text-[#607096]">{t("fixAdmin.ops.rubrics.loading")}</td></tr>
          : state === "forbidden" ? <tr><td colSpan={6} className="p-8 text-center text-[#C43B3B]">{t("fixAdmin.ops.rubrics.forbidden")}</td></tr>
          : state === "error" ? <tr><td colSpan={6} className="p-8"><AdminEmptyState variant="error" title={t("fixAdmin.ops.rubrics.errorTitle")} description={t("fixAdmin.ops.rubrics.errorDesc")} onRetry={() => setReloadToken((n) => n + 1)} /></td></tr>
          : items.length === 0 ? <tr><td colSpan={6} className="p-8"><AdminEmptyState title={t("fixAdmin.ops.rubrics.emptyTitle")} description={t("fixAdmin.ops.rubrics.emptyDesc")} icon={ClipboardCheck} /></td></tr>
          : pagedItems.map((item) => <tr key={item.rubricId} className="hover:bg-[#F8FAFC]">
            <td className="w-1/2 px-6 py-4 align-top [overflow-wrap:anywhere]">
              {item.questionId
                ? <Link href={questionHref(item.questionId)} title={item.stableKey} className="font-bold text-[#14244B] hover:text-[#204195] hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#204195]/40">{item.stableKey}</Link>
                : <span className="font-bold text-[#14244B]" title={item.stableKey}>{item.stableKey}</span>}
              <span className="mt-1 block text-[11px] text-[#607096]">
                {item.questionId
                  ? fmt(t("fixAdmin.ops.rubrics.questionRef"), { key: item.questionStableKey || "—", version: item.questionVersion || "—" })
                  : t("fixAdmin.ops.rubrics.noQuestion")}
              </span>
            </td>
            <td className="whitespace-nowrap px-6 py-4 align-top text-[#14244B]">{item.currentVersion?.version || "—"}</td>
            <td className="px-6 py-4 text-center align-top text-[#14244B] tabular-nums">{item.currentVersion?.criteriaCount || 0}</td>
            <td className="px-6 py-4 text-center align-top text-[#14244B] tabular-nums">{item.currentVersion?.totalWeight ?? "—"}</td>
            <td className="px-6 py-4 text-right align-top"><AdminStatusBadge status={lifecycleTone(item.currentVersion?.status)} label={statusLabel(item.currentVersion?.status || "NONE")} className="whitespace-nowrap" /></td>
            <td className="px-6 py-4 text-right align-top"><AdminRowActions>
              <AdminRowAction icon={ExternalLink} label={t("fixAdmin.ops.rubrics.openQuestion")} tone="neutral" disabled={!item.questionId} title={item.questionId ? undefined : t("fixAdmin.ops.rubrics.noQuestion")} onClick={() => { if (item.questionId) router.push(questionHref(item.questionId)); }} />
            </AdminRowActions></td>
          </tr>)}
      </tbody></table></div>
      {state === "ready" && items.length > PAGE_SIZE && (
        <div className="border-t border-[#EAEFF8] bg-[#F8FAFC] px-6 py-3">
          <Pagination page={currentPage} pageSize={PAGE_SIZE} total={items.length} onPageChange={setPage} />
        </div>
      )}
    </div>
  </div>;
}
