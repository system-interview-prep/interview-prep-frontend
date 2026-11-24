import { redirect } from "next/navigation";

/** "AI errors" was the call log with the error filter on; the log page has that filter. */
export default function AiErrorsRedirect() {
  redirect("/admin/ai/traces?status=error");
}
