"use client";

import Link from "next/link";
import {
  FlaskConical,
  GitCompare,
  Database,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminMetricCard from "@features/admin/components/primitives/AdminMetricCard";
import AdminSection from "@features/admin/components/primitives/AdminSection";

export default function AdminEvaluationOverviewClient() {
  const { t } = useLanguage();
  const isConnected = false;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.eval.overview.title") || "AI Evaluation Suite"}
        description={t("admin.eval.overview.subtitle") || "Đo lường chất lượng định lượng của AI: Đánh giá cải thiện mô hình, phát hiện hồi quy chất lượng và quản lý bộ dữ liệu vàng"}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.evalOverview") || "Đánh giá AI (Eval)" },
        ]}
        statusBadge={
          <AdminStatusBadge status="pending" label={t("admin.common.backendPending") || "Backend Integration Pending"} />
        }
      />

      {/* Safety Guideline Notice (Rule 50) */}
      <div className="rounded-2xl border border-[#DCE4F3] bg-[#EEF2FD] p-4 text-xs text-[#14244B] flex items-start gap-3">
        <ShieldCheck className="size-5 text-[#204195] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Chính sách An toàn Đánh giá Phỏng vấn INTERVIA (Rule 50):</p>
          <p className="mt-0.5 text-[#607096] leading-relaxed">
            {t("admin.eval.safetyNotice") || "Hệ thống chấm điểm AI tuân thủ nghiêm ngặt khung năng lực chuyên môn và tiêu chí rubric chuẩn hóa. Tuyệt đối không chấm điểm hay suy diễn dựa trên: ánh mắt (eye contact), dáng ngồi (posture), ngôn ngữ cơ thể, biểu cảm khuôn mặt hay suy đoán tính cách thiên kiến."}
          </p>
        </div>
      </div>

      {/* Evaluation Core Questions (Rule 42) */}
      <AdminSection
        title="Mục tiêu đánh giá (Evaluation Core Metrics)"
        description="Giải đáp các câu hỏi trọng tâm về việc nâng cấp chất lượng mô hình và prompt"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
            <span className="text-xs font-bold text-[#607096] block mb-1">1. Chất lượng AI có đang cải thiện?</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-semibold italic text-[#8A98B8]">Chưa có kết quả benchmark</span>
              <AdminStatusBadge status="unknown" label="Pending" size="sm" />
            </div>
            <p className="text-[11px] text-[#607096] mt-2">Cần chạy thử nghiệm trên Golden Dataset</p>
          </div>

          <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
            <span className="text-xs font-bold text-[#607096] block mb-1">2. Prompt/Model mới có gây thụt lùi (Regression)?</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-semibold italic text-[#8A98B8]">Chưa có báo cáo hồi quy</span>
              <AdminStatusBadge status="unknown" label="Pending" size="sm" />
            </div>
            <p className="text-[11px] text-[#607096] mt-2">Cần so sánh Variant A vs Variant B</p>
          </div>

          <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
            <span className="text-xs font-bold text-[#607096] block mb-1">3. Tình trạng bộ kiểm thử (Suite Health)?</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-semibold italic text-[#8A98B8]">0 Datasets đã nạp</span>
              <AdminStatusBadge status="unknown" label="Empty" size="sm" />
            </div>
            <p className="text-[11px] text-[#607096] mt-2">Đang chờ backend endpoint /admin/eval</p>
          </div>
        </div>
      </AdminSection>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricCard
          title="Bộ dữ liệu kiểm thử (Datasets)"
          value={null}
          subtitle="Test cases & Golden datasets"
          icon={Database}
          isPending={!isConnected}
          pendingText="Backend pending"
        />
        <AdminMetricCard
          title="Thử nghiệm so sánh (Experiments)"
          value={null}
          subtitle="A/B so sánh Prompt & Model"
          icon={FlaskConical}
          isPending={!isConnected}
          pendingText="Backend pending"
        />
        <AdminMetricCard
          title="Ca kiểm thử bị hồi quy"
          value={null}
          subtitle="Các case bị giảm điểm sau cập nhật"
          icon={GitCompare}
          isPending={!isConnected}
          pendingText="Backend pending"
        />
      </div>

      {/* Evaluation Sub-modules */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/admin/evaluation/datasets"
          className="group rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs hover:border-[#204195] transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#EEF2FD] text-[#204195] group-hover:bg-[#204195] group-hover:text-white transition-colors">
              <Database className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-[#607096] group-hover:text-[#204195]" />
          </div>
          <h4 className="text-sm font-bold text-[#14244B]">Datasets & Golden Sets</h4>
          <p className="text-xs text-[#607096] mt-1">
            Quản lý tập mẫu kiểm thử chuẩn hóa cho CV, câu hỏi phỏng vấn và câu trả lời ứng viên
          </p>
        </Link>

        <Link
          href="/admin/evaluation/experiments"
          className="group rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs hover:border-[#204195] transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#EEF2FD] text-[#204195] group-hover:bg-[#204195] group-hover:text-white transition-colors">
              <FlaskConical className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-[#607096] group-hover:text-[#204195]" />
          </div>
          <h4 className="text-sm font-bold text-[#14244B]">Thử nghiệm so sánh (Experiments)</h4>
          <p className="text-xs text-[#607096] mt-1">
            Chạy benchmark so sánh đối đầu giữa Variant A và Variant B trên cùng một bộ dữ liệu
          </p>
        </Link>

        <Link
          href="/admin/evaluation/regression"
          className="group rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs hover:border-[#204195] transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#EEF2FD] text-[#204195] group-hover:bg-[#204195] group-hover:text-white transition-colors">
              <GitCompare className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-[#607096] group-hover:text-[#204195]" />
          </div>
          <h4 className="text-sm font-bold text-[#14244B]">Kiểm thử hồi quy (Regression)</h4>
          <p className="text-xs text-[#607096] mt-1">
            Bảng theo dõi các ca phỏng vấn bị giảm chất lượng để ngăn chặn việc triển khai lỗi lên Production
          </p>
        </Link>
      </div>
    </div>
  );
}
