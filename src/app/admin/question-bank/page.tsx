import { Suspense } from "react";
import AdminQuestionBankClient from "@features/admin/components/AdminQuestionBankClient";

export default function AdminQuestionBankPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
    >
      <AdminQuestionBankClient />
    </Suspense>
  );
}
