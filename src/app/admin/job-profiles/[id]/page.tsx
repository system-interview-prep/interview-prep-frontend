import { Suspense } from "react";
import AdminDashboardShell from "../../../../../components/admin/AdminDashboardShell";
import AdminJobProfileDetailView from "../../../../../components/admin/AdminJobProfileDetailView";

export const metadata = {
  title: "Job profile | Curator AI",
};

export default function AdminJobProfileDetailPage() {
  return (
    <AdminDashboardShell>
      <Suspense fallback={<div className="text-on-surface-variant">…</div>}>
        <AdminJobProfileDetailView />
      </Suspense>
    </AdminDashboardShell>
  );
}
