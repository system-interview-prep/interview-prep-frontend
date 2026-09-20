import { Suspense } from "react";
import type { Metadata } from "next";
import AdminLoginForm from "@features/auth/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "INTERVIA Admin | Đăng nhập Hệ thống",
  description: "Cổng đăng nhập hệ thống quản trị INTERVIA AI",
};

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F7F9FD]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#DCE4F3] border-t-[#204195]" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
