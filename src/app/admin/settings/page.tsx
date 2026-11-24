import { Suspense } from "react";
import AdminSettingsClient from "@features/admin/components/AdminSettingsClient";

export default function AdminSettingsPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
    >
      <AdminSettingsClient />
    </Suspense>
  );
}
