import { Suspense } from "react";
import SystemHealthClient from "@features/admin/components/SystemHealthClient";

export default function AdminSystemHealthPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
    >
      <SystemHealthClient />
    </Suspense>
  );
}
