import { Suspense } from "react";
import AdminAiTracesClient from "@features/admin/ai/components/AdminAiTracesClient";

export default function AdminAiTracesPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
    >
      <AdminAiTracesClient />
    </Suspense>
  );
}
