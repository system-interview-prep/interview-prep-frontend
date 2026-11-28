import { redirect } from "next/navigation";

/** Prompt versions (Langfuse Prompt Management) now lives in Langfuse; the "Đánh giá AI" page links to it. */
export default function Page() {
  redirect("/admin/evaluation");
}
