"use client";

import { Suspense } from "react";
import { UserDashboardShell } from "@/components/user-dashboard/UserDashboardShell";
import UserJobDetailView from "@/components/user-dashboard/UserJobDetailView";

export default function DashboardJobDetailPage() {
  return (
    <UserDashboardShell>
      <main className="min-h-screen p-6 md:p-12">
        <Suspense fallback={<p className="text-center text-on-surface-variant">…</p>}>
          <UserJobDetailView />
        </Suspense>
      </main>
    </UserDashboardShell>
  );
}
