"use client";

import UserMyCvsPage from "@features/user-dashboard/components/UserMyCvsPage";
import { UserDashboardShell } from "@features/user-dashboard/components/UserDashboardShell";

export default function DashboardCvsPage() {
  return (
    <UserDashboardShell>
      <UserMyCvsPage />
    </UserDashboardShell>
  );
}
