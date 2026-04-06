import AdminDashboardShell from "../../../../../components/admin/AdminDashboardShell";
import AdminJobCategoriesView from "../../../../../components/admin/AdminJobCategoriesView";

export const metadata = {
  title: "Job categories | Curator AI",
};

export default function AdminJobCategoriesPage() {
  return (
    <AdminDashboardShell>
      <AdminJobCategoriesView />
    </AdminDashboardShell>
  );
}
