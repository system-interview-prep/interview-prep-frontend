import { Suspense } from "react";
import AdminAiErrorsClient from "@features/admin/ai/components/AdminAiErrorsClient";

export default function AdminAiErrorsPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
    >
      <AdminAiErrorsClient />
    </Suspense>
  );
}
