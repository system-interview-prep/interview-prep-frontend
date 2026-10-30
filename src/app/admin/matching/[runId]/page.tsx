"use client";

import { use } from "react";
import MatchingRunClient from "@features/admin/pipeline/components/MatchingRunClient";

export default function AdminMatchingRunPage({ params }: { params: Promise<{ runId: string }> }) {
  // Next 16: route params arrive as a Promise.
  const { runId } = use(params);
  return <MatchingRunClient runId={runId} />;
}
