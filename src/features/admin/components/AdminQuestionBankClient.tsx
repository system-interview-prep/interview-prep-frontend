"use client";

import { useEffect, useState } from "react";
import { Clock, FileQuestion, Filter, Search } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { questionBankApi, type QuestionBankItem } from "@features/admin/services/questionBank.service";
import AdminEmptyState from "./primitives/AdminEmptyState";
import AdminMetricCard from "./primitives/AdminMetricCard";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminStatusBadge from "./primitives/AdminStatusBadge";

export default function AdminQuestionBankClient() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error" | "forbidden">("loading");

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        setState("loading");
        const { data } = await questionBankApi.list({ q: searchQuery || undefined, difficultyBand: difficultyFilter === "all" ? undefined : difficultyFilter });
        setQuestions(data.items); setTotal(data.total); setState("ready");
      } catch (error: unknown) {
        setState((error as { response?: { status?: number } }).response?.status === 403 ? "forbidden" : "error");
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery, difficultyFilter]);

  const pending = state === "loading";
  return <div className="space-y-6">
    <AdminPageHeader title={t("admin.questionBank.title") || "Ngân hàng câu hỏi phỏng vấn"} description={t("admin.questionBank.subtitle") || "Kho câu hỏi versioned, taxonomy và rubric từ Core"} breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: t("admin.sidebar.questionBank") || "Ngân hàng câu hỏi" }]} statusBadge={<AdminStatusBadge status={state === "error" ? "error" : "info"} label={pending ? "Đang tải" : "Dữ liệu từ Core"} />} />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><AdminMetricCard title="Tổng số câu hỏi" value={total} subtitle="Theo bộ lọc hiện tại" icon={FileQuestion} isPending={pending} /><AdminMetricCard title="Năng lực đánh giá" value={null} subtitle="Có trong trang chi tiết" icon={Filter} isPending={pending} /><AdminMetricCard title="Thời lượng trả lời" value={null} subtitle="Theo từng version" icon={Clock} isPending={pending} /></div>
    <div className="flex flex-col gap-3 rounded-2xl border border-[#DCE4F3] bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between"><div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#607096]" /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] py-2 pl-9 pr-4 text-xs" placeholder="Tìm stable key hoặc nội dung câu hỏi..." /></div><div className="flex items-center gap-2 overflow-x-auto">{["all", "EASY", "MEDIUM", "HARD"].map((value) => <button key={value} type="button" onClick={() => setDifficultyFilter(value)} className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold ${difficultyFilter === value ? "bg-[#204195] text-white" : "border border-[#DCE4F3] text-[#607096]"}`}>{value === "all" ? "Tất cả" : value}</button>)}</div></div>
    <div className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs"><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b bg-[#F8FAFC] text-[11px] font-bold uppercase text-[#607096]"><th className="px-6 py-4">Question</th><th className="px-6 py-4">Năng lực chính</th><th className="px-6 py-4 text-center">Độ khó</th><th className="px-6 py-4 text-center">Loại</th><th className="px-6 py-4 text-center">Thời lượng</th><th className="px-6 py-4 text-right">Trạng thái</th></tr></thead><tbody className="divide-y divide-[#EAEFF8]">
      {pending ? <tr><td colSpan={6} className="p-8 text-center text-[#607096]">Đang tải Question Bank…</td></tr> : state === "forbidden" ? <tr><td colSpan={6} className="p-8 text-center text-red-700">Bạn không có quyền truy cập Ngân hàng câu hỏi.</td></tr> : state === "error" ? <tr><td colSpan={6} className="p-8"><AdminEmptyState variant="error" title="Không tải được dữ liệu" description="Core không phản hồi. Vui lòng thử lại sau." /></td></tr> : questions.length === 0 ? <tr><td colSpan={6} className="p-8"><AdminEmptyState title="Chưa có câu hỏi phù hợp" description="Thay đổi bộ lọc hoặc tạo dữ liệu draft từ workflow authoring." /></td></tr> : questions.map((question) => <tr key={question.questionId} className="hover:bg-[#F8FAFC]"><td className="px-6 py-4"><p className="font-bold text-[#14244B]">{question.stableKey} <span className="font-medium text-[#607096]">v{question.currentVersion.version}</span></p><p className="mt-1 max-w-md truncate text-[#607096]">{question.currentVersion.canonicalText}</p></td><td className="px-6 py-4">{question.taxonomy.primaryCompetency?.conceptId || "—"}</td><td className="px-6 py-4 text-center">{question.currentVersion.difficultyBand}</td><td className="px-6 py-4 text-center">{question.currentVersion.questionType}</td><td className="px-6 py-4 text-center">{question.currentVersion.softAnswerSeconds}s</td><td className="px-6 py-4 text-right">{question.currentVersion.status}</td></tr>)}
    </tbody></table></div></div>
  </div>;
}
