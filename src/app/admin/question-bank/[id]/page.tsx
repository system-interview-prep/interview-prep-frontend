"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";

export default function AdminQuestionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Chi tiết câu hỏi: ${params.id}`}
        description="Thông tin câu hỏi, tiêu chí đánh giá liên kết và mẫu câu trả lời kỳ vọng"
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Ngân hàng câu hỏi", href: "/admin/question-bank" },
          { label: params.id },
        ]}
        statusBadge={
          <AdminStatusBadge status="pending" label="Backend Integration Pending" />
        }
        primaryAction={
          <Link
            href="/admin/question-bank"
            className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#14244B] shadow-2xs hover:bg-[#F8FAFC] transition-all"
          >
            <ArrowLeft className="size-3.5" />
            <span>Quay lại ngân hàng</span>
          </Link>
        }
      />

      <AdminEmptyState
        variant="pending"
        title="Chưa kết nối API Chi tiết Câu hỏi"
        description={`Core Backend cần triển khai endpoint GET /admin/questions/${params.id} để nạp thông tin chi tiết câu hỏi và tiêu chí rubric liên kết.`}
      />
    </div>
  );
}
