import { cookies } from "next/headers";
import { getDictionary, normalizeLang } from "@/i18n/i18n";
import AdminInterviewsClient from "@/features/admin/components/AdminInterviewsClient";

export default async function AdminInterviewsPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const dictionary = getDictionary(lang);

  return <AdminInterviewsClient dictionary={dictionary} />;
}
