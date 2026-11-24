import { redirect } from "next/navigation";

export default function RedirectCreateJobProfilePage() {
  redirect("/admin/job-descriptions/create");
}
