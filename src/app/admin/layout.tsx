import type { Metadata } from "next";
import AdminDashboardShell from "@features/admin/components/AdminDashboardShell";

export const metadata: Metadata = {
  title: "INTERVIA Admin | Quản trị Hệ thống",
  description: "Bảng điều khiển quản trị viên và vận hành sản phẩm INTERVIA AI",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminDashboardShell>{children}</AdminDashboardShell>;
}
