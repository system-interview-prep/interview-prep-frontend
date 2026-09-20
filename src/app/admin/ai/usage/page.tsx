import { Suspense } from "react";
import AdminAiUsageClient from "@features/admin/ai/components/AdminAiUsageClient";

export default function AdminAiUsagePage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
    >
      <AdminAiUsageClient />
    </Suspense>
  );
}
