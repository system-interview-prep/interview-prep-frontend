import { redirect } from "next/navigation";

export default function RedirectJobProfilesPage() {
  redirect("/admin/job-descriptions");
}
