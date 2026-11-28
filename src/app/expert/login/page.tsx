import { Suspense } from "react";
import type { Metadata } from "next";
import AdminLoginForm from "@features/auth/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Đăng nhập chuyên gia | INTERVIA",
  description: "Cổng đăng nhập dành cho chuyên gia phỏng vấn INTERVIA AI",
};

export default function ExpertLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F7F9FD]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#DCE4F3] border-t-[#204195]" />
        </div>
      }
    >
      <AdminLoginForm variant="expert" />
    </Suspense>
  );
}
