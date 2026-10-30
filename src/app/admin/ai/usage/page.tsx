import { redirect } from "next/navigation";

/** "AI usage" was a subset of the AI overview (calls, tokens, latency by purpose); it now lives there. */
export default function AiUsageRedirect() {
  redirect("/admin/ai");
}
