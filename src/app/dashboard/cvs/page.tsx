"use client";

import UserMyCvsPage from "@/components/user-dashboard/UserMyCvsPage";
import { UserDashboardShell } from "@/components/user-dashboard/UserDashboardShell";

export default function DashboardCvsPage() {
  return (
    <UserDashboardShell>
      <UserMyCvsPage />
    </UserDashboardShell>
  );
}
