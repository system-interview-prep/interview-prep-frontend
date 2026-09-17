import { redirect } from "next/navigation";
import UnifiedInterviewRoom from "@/components/interview/UnifiedInterviewRoom";

type InterviewPageProps = {
  searchParams?:
    | { mode?: string | string[] }
    | Promise<{ mode?: string | string[] }>;
};

export default async function InterviewPage({ searchParams }: InterviewPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const modeParam = resolvedSearchParams?.mode;
  const mode = Array.isArray(modeParam) ? modeParam[0] : modeParam;

  if (mode !== "voice" && mode !== "video") {
    redirect("/interview/select");
  }

  return <UnifiedInterviewRoom mode={mode} />;
}
