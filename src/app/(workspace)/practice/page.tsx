import { redirect } from "next/navigation";

// Practice now lives inside the interview modes (chat / voice / video).
// Kept as a redirect so old bookmarks and back-links still land somewhere useful.
export default function PracticePage() {
  redirect("/interview/select");
}
