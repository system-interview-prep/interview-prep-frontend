import { Suspense } from "react";
import AdminJobProfilesPanel from "@features/admin/components/AdminJobProfilesPanel";

export default function AdminJobProfilesPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
    >
      <AdminJobProfilesPanel />
    </Suspense>
  );
}
