import { Suspense } from "react";
import AdminJobProfileDetailView from "@features/admin/components/AdminJobProfileDetailView";

export const metadata = {
  title: "Job Description | INTERVIA",
};

export default function AdminJobDescriptionDetailPage() {
  return (
    <Suspense fallback={<div className="text-on-surface-variant">…</div>}>
      <AdminJobProfileDetailView />
    </Suspense>
  );
}
