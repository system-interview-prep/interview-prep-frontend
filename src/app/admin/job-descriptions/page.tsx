import { Suspense } from "react";
import AdminJobProfilesPanel from "@features/admin/components/AdminJobProfilesPanel";

export const metadata = {
  title: "Job Descriptions | INTERVIA",
};

export default function AdminJobDescriptionsPage() {
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
