"use client";

import UserJobsBoard from "@/components/user-dashboard/UserJobsBoard";
import { UserDashboardShell } from "@/components/user-dashboard/UserDashboardShell";

export default function DashboardJobsPage() {
  return (
    <UserDashboardShell>
      <main className="min-h-screen p-6 md:p-12">
        <UserJobsBoard />
      </main>
    </UserDashboardShell>
  );
}
