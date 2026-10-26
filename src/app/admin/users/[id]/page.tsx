"use client";

import { use } from "react";
import AdminUserDetailClient from "@features/admin/components/AdminUserDetailClient";

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Next 16: route params arrive as a Promise.
  const { id } = use(params);
  return <AdminUserDetailClient userId={id} />;
}
