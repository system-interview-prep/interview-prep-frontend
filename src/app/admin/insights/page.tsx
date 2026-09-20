import { cookies } from "next/headers";
import { getDictionary, normalizeLang } from "@/i18n/i18n";
import AdminInsightsClient from "@/features/admin/components/AdminInsightsClient";

export default async function AdminInsightsPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const dictionary = getDictionary(lang);

  return (
    <AdminInsightsClient
      initialLang={lang}
      dictionary={dictionary}
    />
  );
}
