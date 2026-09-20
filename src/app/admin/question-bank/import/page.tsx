"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";
import { questionBankApi, type ImportRow, type ImportSummary } from "@features/admin/services/questionBank.service";

export default function ImportQuestionsPage() {
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [message, setMessage] = useState("");
  const [templateFormat, setTemplateFormat] = useState<"csv" | "xlsx">("csv");
  const [downloading, setDownloading] = useState(false);

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
      setMessage(status === 401 || status === 403 ? "Bạn chưa có quyền tải template Question Bank." : status ? `Không thể tải template (HTTP ${status}). Kiểm tra Core Backend đã được cập nhật.` : "Không kết nối được Core Backend tại http://localhost:5000. Khởi động lại/rebuild Core rồi thử lại.");
    } finally { setDownloading(false); }
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    try { const { data } = await questionBankApi.uploadImport(file); setSummary(data); const response = await questionBankApi.getImportRows(data.importId); setRows(response.data.items); setMessage("Đã parse vào staging. Kiểm tra từng row trước khi commit."); }
    catch (error: unknown) { setMessage((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Upload không thành công."); }
  }

  return <div className="mx-auto max-w-5xl space-y-6"><div><Link href="/admin/question-bank" className="text-sm text-[#204195]">← Ngân hàng câu hỏi</Link><h1 className="mt-3 text-2xl font-bold text-[#14244B]">Import câu hỏi</h1><p className="mt-1 text-sm text-[#607096]">CSV/XLSX được parse vào staging; dữ liệu lỗi không thể trở thành draft.</p></div><div className="rounded-2xl border border-[#DCE4F3] bg-white p-6"><div className="flex flex-wrap items-center gap-3"><select value={templateFormat} onChange={(event) => setTemplateFormat(event.target.value as "csv" | "xlsx")} className="rounded-xl border border-[#DCE4F3] px-3 py-2 text-sm"><option value="csv">CSV</option><option value="xlsx">XLSX</option></select><button type="button" onClick={download} disabled={downloading} className="rounded-xl border border-[#DCE4F3] px-4 py-2 text-sm font-semibold disabled:opacity-60">{downloading ? "Đang tải..." : "Tải template"}</button><label className="cursor-pointer rounded-xl bg-[#204195] px-4 py-2 text-sm font-semibold text-white">Chọn CSV/XLSX<input className="hidden" type="file" accept=".csv,.xlsx" onChange={upload} /></label></div>{message && <p className="mt-4 text-sm text-[#607096]">{message}</p>}</div>{summary && <div className="rounded-2xl border border-[#DCE4F3] bg-white p-6"><p className="font-bold">Review staging: {summary.validRows} hợp lệ, {summary.errorRows} lỗi / {summary.totalRows} rows</p><table className="mt-4 w-full text-left text-xs"><thead><tr><th>Row</th><th>Stable key</th><th>Status</th><th>Lỗi syntax/business</th></tr></thead><tbody>{rows.map((row) => <tr key={row.rowId} className="border-t"><td className="p-2">{row.rowNumber}</td><td className="p-2">{String(row.payload.stable_key || "—")}</td><td className="p-2">{row.status}</td><td className="p-2 text-red-700">{row.errors.map((item) => `${item.field}: ${item.code}`).join(", ") || "—"}</td></tr>)}</tbody></table></div>}</div>;
}
