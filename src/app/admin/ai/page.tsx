import { Suspense } from "react";
import AiHealthClient from "@features/admin/pipeline/components/AiHealthClient";

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
      <AiHealthClient />
    </Suspense>
  );
}
