import { Suspense } from "react";
import PracticeStatsClient from "@features/admin/components/PracticeStatsClient";

export default function AdminPracticePage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
    >
      <PracticeStatsClient />
    </Suspense>
  );
}
