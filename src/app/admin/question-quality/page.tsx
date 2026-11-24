import { Suspense } from "react";
import QuestionQualityClient from "@features/admin/components/QuestionQualityClient";

export default function AdminQuestionQualityPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
    >
      <QuestionQualityClient />
    </Suspense>
  );
}
