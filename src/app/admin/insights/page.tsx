import { redirect } from "next/navigation";

/** The insights page (trend + breakdown by mode) is now part of the overview. */
export default function AdminInsightsRedirect() {
  redirect("/admin/dashboard#trends");
}
