import { Suspense } from "react";
import AdminDashboardShell from "../../../../components/admin/AdminDashboardShell";
import AdminJobProfilesPanel from "../../../../components/admin/AdminJobProfilesPanel";

export default function AdminDashboardPage() {
  return (
    <AdminDashboardShell>
      <Suspense fallback={<div className="text-on-surface-variant">…</div>}>
        <AdminJobProfilesPanel />
      </Suspense>
    </AdminDashboardShell>
  );
}
