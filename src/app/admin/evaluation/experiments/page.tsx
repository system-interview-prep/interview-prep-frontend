import { redirect } from "next/navigation";

/** A/B experiments (Langfuse Experiments) now lives in Langfuse; the "Đánh giá AI" page links to it. */
export default function Page() {
  redirect("/admin/evaluation");
}
