"use client";

import { use } from "react";
import AdminSessionPlanClient from "@features/admin/components/AdminSessionPlanClient";

export default function AdminInterviewPlanPage({ params }: { params: Promise<{ id: string }> }) {
  // Next 16: route params arrive as a Promise.
  const { id } = use(params);
  return <AdminSessionPlanClient sessionId={id} />;
}
