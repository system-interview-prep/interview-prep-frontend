import AdminDashboardShell from "@features/admin/components/AdminDashboardShell";
import AdminJobCategoriesView from "@features/admin/components/AdminJobCategoriesView";

export const metadata = {
  title: "Job categories | INTERVIA",
};

export default function AdminJobCategoriesPage() {
  return (
    <AdminDashboardShell>
      <AdminJobCategoriesView />
    </AdminDashboardShell>
  );
}
