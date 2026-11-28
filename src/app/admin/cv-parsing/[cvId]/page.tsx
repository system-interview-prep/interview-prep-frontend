"use client";

import { use } from "react";
import CvParsingRunClient from "@features/admin/pipeline/components/CvParsingRunClient";

export default function AdminCvParsingRunPage({ params }: { params: Promise<{ cvId: string }> }) {
  // Next 16: route params arrive as a Promise.
  const { cvId } = use(params);
  return <CvParsingRunClient cvId={cvId} />;
}
