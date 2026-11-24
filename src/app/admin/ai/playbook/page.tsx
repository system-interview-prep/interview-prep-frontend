import type { Metadata } from "next";
import InterviewerPlaybookClient from "@features/admin/components/InterviewerPlaybookClient";

export const metadata: Metadata = { title: "Sổ tay người phỏng vấn" };

export default function AdminInterviewerPlaybookPage() {
  return <InterviewerPlaybookClient />;
}
