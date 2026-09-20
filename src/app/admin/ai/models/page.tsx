import { Suspense } from "react";
import AdminAiModelsClient from "@features/admin/ai/components/AdminAiModelsClient";

export default function AdminAiModelsPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
    >
      <AdminAiModelsClient />
    </Suspense>
  );
}
