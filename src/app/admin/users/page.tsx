import { Suspense } from "react";
import AdminUsersClient from "@features/admin/components/AdminUsersClient";

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
    >
      <AdminUsersClient />
    </Suspense>
  );
}
