import { Suspense } from "react";
import AdminDashboardShell from "@features/admin/components/AdminDashboardShell";
import AdminJobProfileCreateView from "@features/admin/components/AdminJobProfileCreateView";

export const metadata = {
  title: "Create job profile | INTERVIA",
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
