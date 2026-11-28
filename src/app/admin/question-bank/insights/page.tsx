import type { Metadata } from "next";
import AdminBankInsightsClient from "@features/admin/components/AdminBankInsightsClient";

export const metadata: Metadata = { title: "Đề xuất từ dữ liệu" };

export default function AdminBankInsightsPage() {
  return <AdminBankInsightsClient />;
}
