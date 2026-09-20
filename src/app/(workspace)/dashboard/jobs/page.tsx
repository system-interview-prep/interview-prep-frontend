"use client";

import UserJobsBoard from "@features/user-dashboard/components/UserJobsBoard";
import { UserDashboardShell } from "@features/user-dashboard/components/UserDashboardShell";

export default function DashboardJobsPage() {
  return (
    <UserDashboardShell>
      <main className="min-h-screen bg-[#F8FAFC] px-4 py-6 text-[#14244B] sm:px-6 md:px-8 md:py-8 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-[1440px]"><UserJobsBoard /></div>
      </main>
    </UserDashboardShell>
  );
}
