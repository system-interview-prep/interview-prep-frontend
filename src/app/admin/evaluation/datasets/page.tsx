import { redirect } from "next/navigation";

/** Test datasets (Langfuse Datasets) now lives in Langfuse; the "Đánh giá AI" page links to it. */
export default function Page() {
  redirect("/admin/evaluation");
}
