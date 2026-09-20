"use client";

import { Suspense } from "react";
import { UserDashboardShell } from "@features/user-dashboard/components/UserDashboardShell";
import UserJobDetailView from "@features/user-dashboard/components/UserJobDetailView";

export default function DashboardJobDetailPage() {
  return (
    <UserDashboardShell>
      <main className="min-h-screen bg-[#F8FAFC] px-4 py-6 text-[#14244B] sm:px-6 md:px-8 md:py-8 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-[1120px]">
          <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white shadow-xs motion-reduce:animate-none" aria-hidden="true" />}>
            <UserJobDetailView />
          </Suspense>
        </div>
      </main>
    </UserDashboardShell>
  );
}
