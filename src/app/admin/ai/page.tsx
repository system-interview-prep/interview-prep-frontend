import { Suspense } from "react";
import AdminAiOverviewClient from "@features/admin/ai/components/AdminAiOverviewClient";

export default function AdminAiOverviewPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
    >
      <AdminAiOverviewClient />
    </Suspense>
  );
}
