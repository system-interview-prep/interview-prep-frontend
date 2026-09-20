import { Suspense } from "react";
import AdminJobProfileDetailView from "@features/admin/components/AdminJobProfileDetailView";

export const metadata = {
  title: "Job profile | INTERVIA",
};

export default function AdminJobProfileDetailPage() {
  return (
    <Suspense fallback={<div className="text-on-surface-variant">…</div>}>
      <AdminJobProfileDetailView />
    </Suspense>
  );
}
