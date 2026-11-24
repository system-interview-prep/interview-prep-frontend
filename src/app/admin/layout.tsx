import type { Metadata } from "next";
import AdminDashboardShell from "@features/admin/components/AdminDashboardShell";

export const metadata: Metadata = {
  title: { default: "Quản trị | INTERVIA", template: "%s | INTERVIA" },
  description: "Bảng điều khiển quản trị và vận hành Intervia",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminDashboardShell>{children}</AdminDashboardShell>;
}
