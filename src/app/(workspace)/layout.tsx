import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "INTERVIA — Workspace",
  description: "Candidate interview prep workspace",
};

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
