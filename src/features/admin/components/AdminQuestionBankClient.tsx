"use client";

import { useState } from "react";
import { FileQuestion, Search, Plus, Filter, Clock } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminStatusBadge from "./primitives/AdminStatusBadge";
import AdminMetricCard from "./primitives/AdminMetricCard";
import AdminEmptyState from "./primitives/AdminEmptyState";

export interface QuestionBankItem {
  question_id: string;
  job_family: string;
  role: string;
  competency: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  question_type: "BEHAVIORAL" | "TECHNICAL" | "SITUATIONAL";
  question_vi: string;
  question_en?: string;
  expected_seconds: number;
  source: "CANONICAL" | "AI_GENERATED" | "COMMUNITY";
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
}

export default function AdminQuestionBankClient() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  // Since backend endpoint GET /admin/questions is missing,
  // we follow strict rule 2: no fake questions.
  const questions: QuestionBankItem[] = [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.questionBank.title") || "Ngân hàng câu hỏi phỏng vấn"}
        description={t("admin.questionBank.subtitle") || "Quản lý kho câu hỏi chuẩn hóa theo vị trí, năng lực cốt lõi, độ khó và rubric chấm điểm"}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.questionBank") || "Ngân hàng câu hỏi" },
        ]}
        statusBadge={
          <AdminStatusBadge status="pending" label={t("admin.common.backendPending") || "Backend Integration Pending"} />
        }
        primaryAction={
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-xl bg-[#204195] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs opacity-60 cursor-not-allowed"
          >
            <Plus className="size-3.5" />
            <span>{t("admin.questionBank.addQuestion") || "Thêm câu hỏi mới (Pending BE)"}</span>
          </button>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricCard
          title={t("admin.questionBank.stat.total") || "Tổng số câu hỏi"}
          value={null}
          subtitle="Kho câu hỏi toàn hệ thống"
          icon={FileQuestion}
          isPending={true}
          pendingText={t("admin.common.backendPending") || "Backend pending"}
        />
        <AdminMetricCard
          title={t("admin.questionBank.stat.competencies") || "Năng lực đánh giá"}
          value={null}
          subtitle="Competencies liên kết"
          icon={Filter}
          isPending={true}
          pendingText={t("admin.common.backendPending") || "Backend pending"}
        />
        <AdminMetricCard
          title={t("admin.questionBank.stat.avgDuration") || "Thời lượng trung bình"}
          value={null}
          subtitle="Thời gian trả lời kỳ vọng"
          icon={Clock}
          isPending={true}
          pendingText={t("admin.common.backendPending") || "Backend pending"}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#DCE4F3] bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#607096]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] py-2 pl-9 pr-4 text-xs font-medium text-[#14244B] placeholder-[#8A98B8] focus:border-[#204195] focus:bg-white focus:outline-none transition-colors"
            placeholder={t("admin.questionBank.searchPlaceholder") || "Tìm theo nội dung câu hỏi, vai trò hoặc năng lực..."}
            type="text"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {["all", "EASY", "MEDIUM", "HARD"].map((diff) => (
            <button
              key={diff}
              type="button"
              onClick={() => setDifficultyFilter(diff)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                difficultyFilter === diff
                  ? "bg-[#204195] text-white shadow-xs"
                  : "border border-[#DCE4F3] bg-white text-[#607096] hover:border-[#204195]/40 hover:text-[#204195]"
              }`}
            >
              {diff === "all" ? (t("admin.common.all") || "Tất cả") : diff}
            </button>
          ))}
        </div>
      </div>

      {/* Question Table / Empty State */}
      <div className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAEFF8] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#607096]">
                <th className="px-6 py-4">{t("admin.questionBank.table.content") || "ID & Nội dung câu hỏi"}</th>
                <th className="px-6 py-4">{t("admin.questionBank.table.roleComp") || "Vị trí & Năng lực"}</th>
                <th className="px-6 py-4 text-center">{t("admin.questionBank.table.difficulty") || "Độ khó"}</th>
                <th className="px-6 py-4 text-center">{t("admin.questionBank.table.type") || "Loại câu hỏi"}</th>
                <th className="px-6 py-4 text-center">{t("admin.questionBank.table.expected") || "Kỳ vọng"}</th>
                <th className="px-6 py-4 text-right">{t("admin.questionBank.table.status") || "Trạng thái"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8] text-xs">
              {questions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8">
                    <AdminEmptyState
                      variant="pending"
                      title={t("admin.questionBank.emptyTitle") || "Chưa kết nối API Ngân hàng câu hỏi"}
                      description={t("admin.questionBank.emptyDesc") || "Giao diện quản lý câu hỏi chuẩn hóa đã hoàn thiện cấu trúc. Core Backend cần triển khai endpoint GET /admin/questions để nạp dữ liệu câu hỏi từ CSDL."}
                    />
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr key={q.question_id} className="transition-colors hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4 font-bold text-[#14244B]">{q.question_vi}</td>
                    <td className="px-6 py-4">{q.role} - {q.competency}</td>
                    <td className="px-6 py-4 text-center">{q.difficulty}</td>
                    <td className="px-6 py-4 text-center">{q.question_type}</td>
                    <td className="px-6 py-4 text-center">{q.expected_seconds}s</td>
                    <td className="px-6 py-4 text-right">{q.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
