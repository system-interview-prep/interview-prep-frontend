"use client";

import UserJobsBoard from "@features/user-dashboard/components/UserJobsBoard";
import { UserDashboardShell } from "@features/user-dashboard/components/UserDashboardShell";

export default function DashboardJobsPage() {
  return (
    <UserDashboardShell>
      <main className="paper-dots min-h-screen bg-[#FEF9EE] px-4 py-6 text-[#234196] sm:px-6 md:px-8 md:py-10 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-[1440px]"><UserJobsBoard /></div>
      </main>
    </UserDashboardShell>
  );
}
