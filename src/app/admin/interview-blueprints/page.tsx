import type { Metadata } from "next";
import InterviewBlueprintsClient from "@features/admin/components/InterviewBlueprintsClient";

export const metadata: Metadata = { title: "Khung phỏng vấn" };

export default function AdminInterviewBlueprintsPage() {
  return <InterviewBlueprintsClient />;
}
