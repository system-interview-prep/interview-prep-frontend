"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";

export default function AdminAiTraceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Chi tiết Trace: ${params.id}`}
        description="Biểu đồ phân rã Spans, cây lệnh gọi LLM, thời gian phản hồi và kiểm tra lỗi"
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Traces", href: "/admin/ai/traces" },
          { label: params.id },
        ]}
        statusBadge={
          <AdminStatusBadge status="warning" label="Observability Not Connected" />
        }
        primaryAction={
          <Link
            href="/admin/ai/traces"
            className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#14244B] shadow-2xs hover:bg-[#F8FAFC] transition-all"
          >
            <ArrowLeft className="size-3.5" />
            <span>Quay lại danh sách</span>
          </Link>
        }
      />

      <AdminEmptyState
        variant="pending"
        title="Chưa kết nối nhà cung cấp Observability"
        description={`Để xem cây chi tiết các spans của Trace ID ${params.id} (hoặc mở liên kết trực tiếp sang Langfuse/LangSmith dashboard), Core Backend cần tích hợp proxy endpoint GET /admin/ai/traces/${params.id}.`}
      />
    </div>
  );
}
