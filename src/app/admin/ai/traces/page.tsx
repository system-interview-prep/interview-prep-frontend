import { Suspense } from "react";
import AiCallsClient from "@features/admin/pipeline/components/AiCallsClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div
          className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
    >
      <AiCallsClient />
    </Suspense>
  );
}
