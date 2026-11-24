import { Suspense } from "react";
import AdminJobProfileCreateView from "@features/admin/components/AdminJobProfileCreateView";

export const metadata = {
  title: "Tạo hồ sơ công việc",
};

export default function AdminCreateJobDescriptionPage() {
  return (
    <Suspense
      fallback={
        <p className="py-12 text-center text-sm text-on-surface-variant">Đang tải…</p>
      }
    >
      <AdminJobProfileCreateView />
    </Suspense>
  );
}
