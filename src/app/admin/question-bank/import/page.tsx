"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import { questionBankApi, type ImportRow, type ImportSummary } from "@features/admin/services/questionBank.service";

export default function ImportQuestionsPage() {
  const { t } = useLanguage();
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
    try { const { data } = await questionBankApi.uploadImport(file); setSummary(data); const response = await questionBankApi.getImportRows(data.importId); setRows(response.data.items); setMessage(t("fixAdmin.qbImport.parsed")); }
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

  return <div className="mx-auto max-w-5xl space-y-6"><div><Link href="/admin/question-bank" className="text-sm text-[#204195]">{t("fixAdmin.qbImport.back")}</Link><h1 className="mt-3 text-2xl font-bold text-[#14244B]">{t("fixAdmin.qbImport.title")}</h1><p className="mt-1 text-sm text-[#607096]">{t("fixAdmin.qbImport.subtitle")}</p></div><div className="rounded-2xl border border-[#DCE4F3] bg-white p-6"><div className="flex flex-wrap items-center gap-3"><select value={templateFormat} onChange={(event) => setTemplateFormat(event.target.value as "csv" | "xlsx")} className="rounded-xl border border-[#DCE4F3] px-3 py-2 text-sm"><option value="csv">CSV</option><option value="xlsx">XLSX</option></select><button type="button" onClick={download} disabled={downloading} className="rounded-xl border border-[#DCE4F3] px-4 py-2 text-sm font-semibold disabled:opacity-60">{downloading ? t("fixAdmin.qbImport.downloading") : t("fixAdmin.qbImport.downloadTemplate")}</button><label className="cursor-pointer rounded-xl bg-[#204195] px-4 py-2 text-sm font-semibold text-white">{t("fixAdmin.qbImport.choose")}<input className="hidden" type="file" accept=".csv,.xlsx" onChange={upload} /></label></div>{message && <p className="mt-4 text-sm text-[#607096]">{message}</p>}</div>{summary && <div className="rounded-2xl border border-[#DCE4F3] bg-white p-6"><div className="flex items-center justify-between gap-4"><p className="font-bold">{fmt(t("fixAdmin.qbImport.summary"), { valid: summary.validRows, errors: summary.errorRows, total: summary.totalRows })}</p>{summary.status !== "COMMITTED" && <button type="button" onClick={commitDrafts} disabled={committing} className="rounded-xl bg-[#204195] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{committing ? t("fixAdmin.qbImport.committing") : t("fixAdmin.qbImport.commit")}</button>}</div><table className="mt-4 w-full text-left text-xs"><thead><tr><th>{t("fixAdmin.qbImport.colRow")}</th><th>{t("fixAdmin.qbImport.colStableKey")}</th><th>{t("fixAdmin.qbImport.colStatus")}</th><th>{t("fixAdmin.qbImport.colErrors")}</th></tr></thead><tbody>{rows.map((row) => <tr key={row.rowId} className="border-t"><td className="p-2">{row.rowNumber}</td><td className="p-2">{String(row.payload.stable_key || "—")}</td><td className="p-2">{row.status}</td><td className="p-2 text-red-700">{row.errors.map((item) => `${item.field}: ${item.code}`).join(", ") || "—"}</td></tr>)}</tbody></table></div>}</div>;
}
