"use client";

import { use } from "react";
import AiCallDetailClient from "@features/admin/pipeline/components/AiCallDetailClient";

export default function AdminAiTraceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Next 16: route params arrive as a Promise.
  const { id } = use(params);
  return <AiCallDetailClient callId={id} />;
}
