import { Suspense } from "react";
import AdminEvaluationDatasetsClient from "@features/admin/evaluation/components/AdminEvaluationDatasetsClient";

export default function AdminEvaluationDatasetsPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
    >
      <AdminEvaluationDatasetsClient />
    </Suspense>
  );
}
