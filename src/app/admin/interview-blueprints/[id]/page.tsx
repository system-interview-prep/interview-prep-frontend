import type { Metadata } from "next";
import InterviewBlueprintEditorClient from "@features/admin/components/InterviewBlueprintEditorClient";

export const metadata: Metadata = { title: "Kiểu phỏng vấn" };

export default async function AdminInterviewBlueprintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InterviewBlueprintEditorClient id={id} />;
}
