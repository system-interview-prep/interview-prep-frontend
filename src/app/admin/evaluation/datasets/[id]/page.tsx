"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";

export default function AdminEvaluationDatasetDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Chi tiết Dataset: ${params.id}`}
        description="Danh sách các ca kiểm thử mẫu (Test cases), câu trả lời chuẩn và tiêu chí thẩm định"
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Datasets", href: "/admin/evaluation/datasets" },
          { label: params.id },
        ]}
        statusBadge={
          <AdminStatusBadge status="pending" label="Backend Integration Pending" />
        }
        primaryAction={
          <Link
            href="/admin/evaluation/datasets"
            className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#14244B] shadow-2xs hover:bg-[#F8FAFC] transition-all"
          >
            <ArrowLeft className="size-3.5" />
            <span>Quay lại danh sách</span>
          </Link>
        }
      />

      <AdminEmptyState
        variant="pending"
        title="Chưa kết nối API Chi tiết Dataset"
        description={`Core Backend cần bổ sung endpoint GET /admin/eval/datasets/${params.id} để truy xuất danh sách các case kiểm thử chi tiết và trạng thái duyệt Golden Set.`}
      />
    </div>
  );
}
