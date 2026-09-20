import { Suspense } from "react";
import AdminEvaluationRegressionClient from "@features/admin/evaluation/components/AdminEvaluationRegressionClient";

export default function AdminEvaluationRegressionPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
    >
      <AdminEvaluationRegressionClient />
    </Suspense>
  );
}
