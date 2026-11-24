"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserDashboardHome } from "@features/user-dashboard/components/UserDashboardHome";
import { UserDashboardShell } from "@features/user-dashboard/components/UserDashboardShell";
import { useNavigationLoading } from "@components/shared/NavigationLoadingProvider";

export default function DashboardPage() {
  const router = useRouter();
  const { showNavigationLoading } = useNavigationLoading();
  const [videoError, setVideoError] = useState(false);

  const navigate = (href: string) => {
    showNavigationLoading();
    router.push(href);
  };

  const startVideo = async () => {
    setVideoError(false);
    showNavigationLoading();
    router.push("/interview/select");
  };

  return (
    <UserDashboardShell>
      <main id="user-profile" className="min-h-screen px-4 pb-12 pt-4 text-[#14244B] sm:px-6 md:px-8 md:py-8 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-[1280px]">
          <UserDashboardHome onNavigate={navigate} onStartVideo={startVideo} videoError={videoError} onDismissVideoError={() => setVideoError(false)} />
        </div>
      </main>
    </UserDashboardShell>
  );
}
