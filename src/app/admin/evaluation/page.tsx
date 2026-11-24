import { Suspense } from "react";
import AdminEvaluationOverviewClient from "@features/admin/evaluation/components/AdminEvaluationOverviewClient";

export default function AdminEvaluationPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
    >
      <AdminEvaluationOverviewClient />
    </Suspense>
  );
}
