import { Suspense } from "react";
import AdminRubricsClient from "@features/admin/components/AdminRubricsClient";

export default function AdminRubricsPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
    >
      <AdminRubricsClient />
    </Suspense>
  );
}
