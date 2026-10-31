import type { Metadata } from "next";
import InterviewBlueprintsClient from "@features/admin/components/InterviewBlueprintsClient";

export const metadata: Metadata = { title: "Kiểu phỏng vấn" };

export default function AdminInterviewBlueprintsPage() {
  return <InterviewBlueprintsClient />;
}
