import { Suspense } from "react";
import AdminDashboardShell from "../../../../components/admin/AdminDashboardShell";
import AdminJobProfilesPanel from "../../../../components/admin/AdminJobProfilesPanel";

export default function AdminDashboardPage() {
  return (
    <AdminDashboardShell>
      <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl border-2 border-[#234196] bg-[#F0F4FC] motion-reduce:animate-none" aria-hidden="true" />}>
        <AdminJobProfilesPanel />
      </Suspense>
    </AdminDashboardShell>
  );
}
