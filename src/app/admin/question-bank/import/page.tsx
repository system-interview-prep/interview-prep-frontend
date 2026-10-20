"use client";

import { ChangeEvent, useState } from "react";
import { Pagination } from "@components/shared/Pagination";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import { questionBankApi, type ImportRow, type ImportSummary } from "@features/admin/services/questionBank.service";

const ROW_PAGE_SIZE = 20;

export default function ImportQuestionsPage() {
  const { t } = useLanguage();
  const enumLabel = (key: string, fallback: string) => { const text = t(key); return text && text !== key ? text : fallback; };
  const [rowPage, setRowPage] = useState(1);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [message, setMessage] = useState("");
  const [templateFormat, setTemplateFormat] = useState<"csv" | "xlsx">("csv");
  const [downloading, setDownloading] = useState(false);
  const [committing, setCommitting] = useState(false);

  async function download() {
    setDownloading(true); setMessage("");
    try {
      const { data } = await questionBankApi.downloadImportTemplate(templateFormat);
      const url = URL.createObjectURL(data); const link = document.createElement("a");
      link.href = url; link.download = `question-bank-import-v1.${templateFormat}`;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } }).response?.status;
      setMessage(status === 401 || status === 403 ? t("fixAdmin.qbImport.errForbidden") : status ? fmt(t("fixAdmin.qbImport.errHttp"), { status }) : t("fixAdmin.qbImport.errOffline"));
    } finally { setDownloading(false); }
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    const input = event.target;
    try { const { data } = await questionBankApi.uploadImport(file); setSummary(data); const response = await questionBankApi.getImportRows(data.importId); setRows(response.data.items); setRowPage(1); setMessage(t("fixAdmin.qbImport.parsed")); }
    catch (error: unknown) { setMessage((error as { response?: { data?: { message?: string } } }).response?.data?.message || t("fixAdmin.qbImport.uploadFailed")); }
    finally { input.value = ""; }
  }

  async function commitDrafts() {
    if (!summary) return;
    setCommitting(true);
    setMessage("");
    try {
      const idempotencyKey = crypto.randomUUID();
      const { data } = await questionBankApi.commitImport(summary.importId, idempotencyKey);
      setSummary((current) => current ? { ...current, status: data.status } : current);
      setMessage(fmt(t("fixAdmin.qbImport.committed"), { n: data.created?.length || 0 }));
    } catch (error: unknown) {
      setMessage((error as { response?: { data?: { message?: string } } }).response?.data?.message || t("fixAdmin.qbImport.commitFailed"));
    } finally {
      setCommitting(false);
    }
  }

  const rowStatus = (value: string) => enumLabel(`fixAdmin.qbImport.rowStatus.${value}`, value);
  const errorText = (item: { field: string; code: string }) => `${item.field}: ${enumLabel(`fixAdmin.qbImport.errCode.${item.code}`, item.code)}`;
  const pagedRows = rows.slice((rowPage - 1) * ROW_PAGE_SIZE, rowPage * ROW_PAGE_SIZE);

  return <div className="space-y-6">
    <AdminPageHeader
      title={t("fixAdmin.qbImport.title")}
      description={t("fixAdmin.qbImport.subtitle")}
      breadcrumbs={[{ label: "Quản trị", href: "/admin/dashboard" }, { label: t("fixAdmin.qd.bankCrumb"), href: "/admin/question-bank" }, { label: t("fixAdmin.qbImport.title") }]}
      statusBadge={summary ? <AdminStatusBadge status={summary.status === "COMMITTED" ? "success" : "info"} label={enumLabel(`fixAdmin.qbImport.runStatus.${summary.status}`, summary.status)} /> : undefined}
     
    />
    <div className="rounded-2xl border border-[#DCE4F3] bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="qb-import-format">{t("fixAdmin.qbImport.formatLabel")}</label>
        <select id="qb-import-format" value={templateFormat} onChange={(event) => setTemplateFormat(event.target.value as "csv" | "xlsx")} className="rounded-xl border border-[#DCE4F3] bg-white px-3 py-2 text-sm"><option value="csv">CSV</option><option value="xlsx">XLSX</option></select>
        <button type="button" onClick={download} disabled={downloading} className="rounded-xl border border-[#DCE4F3] px-4 py-2 text-sm font-semibold text-[#14244B] disabled:opacity-60">{downloading ? t("fixAdmin.qbImport.downloading") : t("fixAdmin.qbImport.downloadTemplate")}</button>
        <label className="cursor-pointer rounded-xl bg-[#204195] px-4 py-2 text-sm font-semibold text-white">{t("fixAdmin.qbImport.choose")}<input className="hidden" type="file" accept=".csv,.xlsx" onChange={upload} /></label>
      </div>
      {message && <p className="mt-4 text-sm text-[#607096] break-words [overflow-wrap:anywhere]">{message}</p>}
    </div>
    {summary && <div className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <p className="min-w-0 text-sm font-bold text-[#14244B]">{fmt(t("fixAdmin.qbImport.summary"), { valid: summary.validRows, errors: summary.errorRows, total: summary.totalRows })}</p>
        {summary.status !== "COMMITTED" && <button type="button" onClick={commitDrafts} disabled={committing} className="shrink-0 self-start rounded-xl bg-[#204195] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:self-auto">{committing ? t("fixAdmin.qbImport.committing") : t("fixAdmin.qbImport.commit")}</button>}
      </div>
      <div className="overflow-x-auto border-t border-[#EAEFF8]">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead><tr className="bg-[#F8FAFC] text-[11px] font-bold uppercase text-[#607096]"><th className="px-4 py-3">{t("fixAdmin.qbImport.colRow")}</th><th className="px-4 py-3">{t("fixAdmin.qbImport.colStableKey")}</th><th className="px-4 py-3">{t("fixAdmin.qbImport.colStatus")}</th><th className="px-4 py-3">{t("fixAdmin.qbImport.colErrors")}</th></tr></thead>
          <tbody className="divide-y divide-[#EAEFF8]">{pagedRows.map((row) => <tr key={row.rowId} className="align-top text-[#14244B]">
            <td className="px-4 py-3 tabular-nums">{row.rowNumber}</td>
            <td className="max-w-[260px] px-4 py-3 font-mono [overflow-wrap:anywhere]">{String(row.payload.stable_key || "—")}</td>
            <td className="whitespace-nowrap px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${row.status === "ERROR" ? "bg-red-50 text-red-700" : row.status === "VALID" ? "bg-emerald-50 text-emerald-700" : "bg-[#F1F5F9] text-[#475569]"}`}>{rowStatus(row.status)}</span></td>
            <td className="px-4 py-3 text-red-700 break-words [overflow-wrap:anywhere]">{row.errors.map(errorText).join("; ") || "—"}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {rows.length > ROW_PAGE_SIZE && <div className="border-t border-[#EAEFF8] bg-[#F8FAFC] px-4 py-3 sm:px-6"><Pagination page={rowPage} pageSize={ROW_PAGE_SIZE} total={rows.length} onPageChange={setRowPage} /></div>}
    </div>}
  </div>;
}
