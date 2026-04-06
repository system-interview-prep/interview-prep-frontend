import { Suspense } from "react";
import AdminDashboardShell from "../../../../../components/admin/AdminDashboardShell";
import AdminJobProfileCreateView from "../../../../../components/admin/AdminJobProfileCreateView";

export const metadata = {
  title: "Create job profile | Curator AI",
};

export default function AdminCreateJobProfilePage() {
  return (
    <AdminDashboardShell>
      <Suspense
        fallback={
          <p className="py-12 text-center text-sm text-on-surface-variant">Loading…</p>
        }
      >
        <AdminJobProfileCreateView />
      </Suspense>
    </AdminDashboardShell>
  );
}
