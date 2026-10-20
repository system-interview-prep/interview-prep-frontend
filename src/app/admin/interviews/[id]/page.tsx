"use client";

import { use } from "react";
import SessionPipelineClient from "@features/admin/pipeline/components/SessionPipelineClient";

export default function AdminInterviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Next 16: route params arrive as a Promise.
  const { id } = use(params);
  return <SessionPipelineClient sessionId={id} />;
}
