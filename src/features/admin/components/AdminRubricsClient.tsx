"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, Search } from "lucide-react";
import { rubricsApi, type RubricItem } from "@features/admin/services/rubrics.service";
import AdminEmptyState from "./primitives/AdminEmptyState";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminStatusBadge from "./primitives/AdminStatusBadge";

export default function AdminRubricsClient() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<RubricItem[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error" | "forbidden">("loading");
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try { setState("loading"); const { data } = await rubricsApi.list(query || undefined); setItems(data.items); setState("ready"); }
      catch (error: unknown) { setState((error as { response?: { status?: number } }).response?.status === 403 ? "forbidden" : "error"); }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);
  return <div className="space-y-6">
    <AdminPageHeader title="Tiêu chí chấm điểm" description="Rubric version, criteria và tổng trọng số từ Core" breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Tiêu chí chấm điểm" }]} statusBadge={<AdminStatusBadge status={state === "error" ? "error" : "info"} label={state === "loading" ? "Đang tải" : "Dữ liệu từ Core"} />} />
    <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#607096]" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full rounded-xl border border-[#DCE4F3] bg-white py-2 pl-9 pr-4 text-xs" placeholder="Tìm stable key rubric..." /></div>
    <div className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white"><table className="w-full text-left text-xs"><thead><tr className="border-b bg-[#F8FAFC] text-[11px] font-bold uppercase text-[#607096]"><th className="px-6 py-4">Rubric</th><th className="px-6 py-4">Version</th><th className="px-6 py-4 text-center">Criteria</th><th className="px-6 py-4 text-center">Tổng weight</th><th className="px-6 py-4 text-right">Trạng thái</th></tr></thead><tbody className="divide-y divide-[#EAEFF8]">{state === "loading" ? <tr><td colSpan={5} className="p-8 text-center">Đang tải Rubrics…</td></tr> : state === "forbidden" ? <tr><td colSpan={5} className="p-8 text-center text-red-700">Bạn không có quyền truy cập Rubrics.</td></tr> : state === "error" ? <tr><td colSpan={5} className="p-8"><AdminEmptyState variant="error" title="Không tải được rubrics" description="Vui lòng thử lại sau." /></td></tr> : items.length === 0 ? <tr><td colSpan={5} className="p-8"><AdminEmptyState title="Chưa có rubric" description="Rubric draft được tạo qua workflow Core." icon={ClipboardCheck} /></td></tr> : items.map((item) => <tr key={item.rubricId}><td className="px-6 py-4 font-bold text-[#14244B]">{item.stableKey}</td><td className="px-6 py-4">{item.currentVersion?.version || "—"}</td><td className="px-6 py-4 text-center">{item.currentVersion?.criteriaCount || 0}</td><td className="px-6 py-4 text-center">{item.currentVersion?.totalWeight ?? "—"}</td><td className="px-6 py-4 text-right">{item.currentVersion?.status || "DRAFT"}</td></tr>)}</tbody></table></div>
  </div>;
}
