import AdminQuestionDetailClient from "@features/admin/components/AdminQuestionDetailClient";

export default async function AdminQuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminQuestionDetailClient questionId={id} />;
}
