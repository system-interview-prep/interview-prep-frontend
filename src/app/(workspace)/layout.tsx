import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Không gian luyện tập | INTERVIA", template: "%s | INTERVIA" },
  description: "Candidate interview prep workspace",
};

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
