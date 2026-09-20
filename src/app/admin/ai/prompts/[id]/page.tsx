"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";

export default function AdminAiPromptDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Chi tiết Prompt: ${params.id}`}
        description="Nội dung template, biến truyền vào, schema định dạng đầu ra và lịch sử các phiên bản"
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Prompts", href: "/admin/ai/prompts" },
          { label: params.id },
        ]}
        statusBadge={
          <AdminStatusBadge status="pending" label="Backend Integration Pending" />
        }
        primaryAction={
          <Link
            href="/admin/ai/prompts"
            className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#14244B] shadow-2xs hover:bg-[#F8FAFC] transition-all"
          >
            <ArrowLeft className="size-3.5" />
            <span>Quay lại danh sách</span>
          </Link>
        }
      />

      <AdminEmptyState
        variant="pending"
        title="Chưa kết nối API Chi tiết Prompt"
        description={`Core Backend cần triển khai endpoint GET /admin/ai/prompts/${params.id} và GET /admin/ai/prompts/${params.id}/versions để hiển thị template, tham số variables và so sánh diff giữa các phiên bản.`}
      />
    </div>
  );
}
