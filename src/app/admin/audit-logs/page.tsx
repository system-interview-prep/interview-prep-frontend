import { Suspense } from "react";
import AdminAuditLogsClient from "@features/admin/components/AdminAuditLogsClient";

export default function AdminAuditLogsPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
    >
      <AdminAuditLogsClient />
    </Suspense>
  );
}
