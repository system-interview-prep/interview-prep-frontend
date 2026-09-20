"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";

export default function AdminRubricDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Chi tiết Rubric: ${params.id}`}
        description="Thông số tiêu chí, trọng số đánh giá và phiên bản rubric"
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Tiêu chí chấm điểm", href: "/admin/rubrics" },
          { label: params.id },
        ]}
        statusBadge={
          <AdminStatusBadge status="pending" label="Backend Integration Pending" />
        }
        primaryAction={
          <Link
            href="/admin/rubrics"
            className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#14244B] shadow-2xs hover:bg-[#F8FAFC] transition-all"
          >
            <ArrowLeft className="size-3.5" />
            <span>Quay lại danh sách</span>
          </Link>
        }
      />

      <AdminEmptyState
        variant="pending"
        title="Chưa kết nối API Chi tiết Rubric"
        description={`Core Backend cần bổ sung endpoint GET /admin/rubrics/${params.id} để truy xuất danh sách tiêu chí chi tiết và lịch sử các phiên bản.`}
      />
    </div>
  );
}
