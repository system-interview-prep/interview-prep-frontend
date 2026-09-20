import { Suspense } from "react";
import AdminOverviewDashboard from "@features/admin/components/AdminOverviewDashboard";

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
    >
      <AdminOverviewDashboard />
    </Suspense>
  );
}
