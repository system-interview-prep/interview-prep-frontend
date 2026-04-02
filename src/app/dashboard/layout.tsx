import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Curator AI — Dashboard",
  description: "Your editorial intelligence dashboard",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
