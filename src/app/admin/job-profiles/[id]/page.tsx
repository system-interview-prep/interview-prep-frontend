import { Suspense } from "react";
import AdminDashboardShell from "@features/admin/components/AdminDashboardShell";
import AdminJobProfileDetailView from "@features/admin/components/AdminJobProfileDetailView";

export const metadata = {
  title: "Job profile | INTERVIA",
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
