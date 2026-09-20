import { Suspense } from "react";
import AdminAiPromptsClient from "@features/admin/ai/components/AdminAiPromptsClient";

export default function AdminAiPromptsPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
    >
      <AdminAiPromptsClient />
    </Suspense>
  );
}
