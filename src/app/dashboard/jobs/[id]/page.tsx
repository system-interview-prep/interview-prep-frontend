"use client";

import { Suspense } from "react";
import { UserDashboardShell } from "@/components/user-dashboard/UserDashboardShell";
import UserJobDetailView from "@/components/user-dashboard/UserJobDetailView";

export default function DashboardJobDetailPage() {
  return (
    <UserDashboardShell>
      <main className="paper-dots min-h-screen bg-[#FEF9EE] px-4 py-6 text-[#234196] sm:px-6 md:px-8 md:py-10 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-[1120px]">
          <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl border-2 border-[#234196] bg-[#F0F4FC] motion-reduce:animate-none" aria-hidden="true" />}>
            <UserJobDetailView />
          </Suspense>
        </div>
      </main>
    </UserDashboardShell>
  );
}
