import { Suspense } from "react";
import AdminEvaluationExperimentsClient from "@features/admin/evaluation/components/AdminEvaluationExperimentsClient";

export default function AdminEvaluationExperimentsPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
    >
      <AdminEvaluationExperimentsClient />
    </Suspense>
  );
}
