import AdminDashboardShell from "../../../../../components/admin/AdminDashboardShell";
import AdminJobProfileCreateView from "../../../../../components/admin/AdminJobProfileCreateView";

export const metadata = {
  title: "Create job profile | Curator AI",
};

export default function AdminCreateJobProfilePage() {
  return (
    <AdminDashboardShell>
      <AdminJobProfileCreateView />
    </AdminDashboardShell>
  );
}
