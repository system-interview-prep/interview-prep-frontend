import { Suspense } from "react";
import AdminHelpClient from "@features/admin/components/AdminHelpClient";

export default function AdminHelpPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
    >
      <AdminHelpClient />
    </Suspense>
  );
}
