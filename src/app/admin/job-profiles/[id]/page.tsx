import { redirect } from "next/navigation";

export default async function RedirectJobProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/job-descriptions/${encodeURIComponent(id)}`);
}
