"use client";

import { useEffect, useState } from "react";
import { Box, Lock, Info } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminMetricCard from "@features/admin/components/primitives/AdminMetricCard";
import { aiOpsService } from "../services/aiOps.service";
import { AIModelConfig } from "../types/aiOps.types";

export default function AdminAiModelsClient() {
  const { t } = useLanguage();
  const [models, setModels] = useState<AIModelConfig[]>([]);

  useEffect(() => {
    async function load() {
      const list = await aiOpsService.getModels();
      setModels(list);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.ai.models.title") || "Đăng ký & Cấu hình Mô hình AI (Model Registry)"}
        description={t("admin.ai.models.subtitle") || "Quản lý mô hình LLM được gán cho từng năng lực cốt lõi trong hệ thống phỏng vấn và đánh giá INTERVIA"}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.aiOverview") || "AI Operations", href: "/admin/ai" },
          { label: t("admin.sidebar.aiModels") || "Model Registry" },
        ]}
        statusBadge={
          <AdminStatusBadge status="info" label={t("admin.common.readOnly") || "Chế độ Read-Only"} />
        }
      />

      {/* Backend Required Warning (Rule 28) */}
      <div className="rounded-2xl border border-[#DCE4F3] bg-[#EEF2FD] p-4 flex items-start gap-3">
        <Info className="size-5 text-[#204195] shrink-0 mt-0.5" />
        <div className="text-xs text-[#14244B]">
          <p className="font-bold">Quy tắc an toàn cấu hình mô hình (Rule 28):</p>
          <p className="mt-0.5 text-[#607096] leading-relaxed">
            {t("admin.ai.models.safetyRule") || "Việc thay đổi mô hình trên Production đòi hỏi quy trình phê duyệt nghiêm ngặt, phiên bản hóa và kiểm toán (audit). Hiện tại Core Backend chưa cung cấp workflow cập nhật động qua API, do đó bảng cấu hình đang ở trạng thái READ-ONLY (BACKEND REQUIRED FOR EDITING)."}
          </p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricCard
          title="Năng lực AI đang kích hoạt"
          value={models.length}
          unit="capabilities"
          subtitle="Tất cả tính năng đã đăng ký"
          icon={Box}
          status="healthy"
        />
        <AdminMetricCard
          title="Nhà cung cấp chính"
          value="Google Vertex"
          subtitle="Gemini 2.5 Flash & Pro"
          icon={Box}
          status="healthy"
        />
        <AdminMetricCard
          title="Môi trường hoạt động"
          value="PRODUCTION"
          subtitle="Mặc định qua Backend Gateway"
          icon={Lock}
          status="healthy"
        />
      </div>

      {/* Models Table (Rule 26 & 27: Only real proven capabilities) */}
      <div className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs">
        <div className="px-6 py-4 border-b border-[#EAEFF8] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#14244B]">Danh mục gán mô hình cho từng tính năng</h3>
            <p className="text-xs text-[#607096] mt-0.5">Mô hình thực tế đã được tích hợp trong mã nguồn backend</p>
          </div>
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
            6 Năng lực
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAEFF8] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#607096]">
                <th className="px-6 py-4">{t("admin.ai.models.table.capability") || "Năng lực (Capability)"}</th>
                <th className="px-6 py-4">{t("admin.ai.models.table.provider") || "Nhà cung cấp"}</th>
                <th className="px-6 py-4">{t("admin.ai.models.table.model") || "Mô hình LLM"}</th>
                <th className="px-6 py-4 text-center">{t("admin.ai.models.table.env") || "Môi trường"}</th>
                <th className="px-6 py-4 text-center">{t("admin.ai.models.table.version") || "Phiên bản"}</th>
                <th className="px-6 py-4 text-center">{t("admin.ai.models.table.status") || "Trạng thái"}</th>
                <th className="px-6 py-4 text-right">{t("admin.ai.models.table.edit") || "Quyền sửa"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8] text-xs">
              {models.map((m) => (
                <tr key={m.id} className="transition-colors hover:bg-[#F8FAFC]">
                  <td className="px-6 py-4">
                    <span className="font-bold text-[#14244B] block">{m.capabilityLabel}</span>
                    <span className="text-[10.5px] font-mono text-[#607096]">{m.capability}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-[#14244B]">{m.provider}</td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-[#204195] bg-[#EEF2FD] px-2 py-0.5 rounded">
                      {m.modelName}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                      {m.environment}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-medium text-[#607096]">
                    {m.version}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <AdminStatusBadge status="active" label={m.status} size="sm" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#8A98B8] font-medium" title="Backend required for editing">
                      <Lock className="size-3" />
                      Read-only
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
