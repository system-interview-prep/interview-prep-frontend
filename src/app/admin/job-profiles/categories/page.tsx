import AdminDashboardShell from "../../../../../components/admin/AdminDashboardShell";
import AdminJobCategoriesView from "../../../../../components/admin/AdminJobCategoriesView";

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
