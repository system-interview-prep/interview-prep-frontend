import { redirect } from "next/navigation";

/** Regression checks (comparing Langfuse experiment runs) now lives in Langfuse; the "Đánh giá AI" page links to it. */
export default function Page() {
  redirect("/admin/evaluation");
}
