"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";

export default function AdminEvaluationExperimentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Chi tiết Thử nghiệm: ${params.id}`}
        description="Đối chiếu đa chiều chi tiết giữa Biến thể A và Biến thể B: Điểm chất lượng, Độ trễ, Chi phí và Phân tích hồi quy"
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Thử nghiệm", href: "/admin/evaluation/experiments" },
          { label: params.id },
        ]}
        statusBadge={
          <AdminStatusBadge status="pending" label="Backend Integration Pending" />
        }
        primaryAction={
          <Link
            href="/admin/evaluation/experiments"
            className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#14244B] shadow-2xs hover:bg-[#F8FAFC] transition-all"
          >
            <ArrowLeft className="size-3.5" />
            <span>Quay lại danh sách</span>
          </Link>
        }
      />

      <AdminEmptyState
        variant="pending"
        title="Chưa kết nối API Chi tiết Thử nghiệm"
        description={`Core Backend cần bổ sung endpoint GET /admin/eval/experiments/${params.id} để nạp kết quả đo lường đối đầu giữa các phiên bản model & prompt.`}
      />
    </div>
  );
}
