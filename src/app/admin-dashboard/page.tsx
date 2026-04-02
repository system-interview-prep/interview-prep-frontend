import { redirect } from "next/navigation";

export default function AdminDashboardPage() {
  // Backward-compat: old URL `/admin-dashboard` -> `/admin/dashboard`
  // This keeps existing links/bookmarks working.
  redirect("/admin/dashboard");
}
