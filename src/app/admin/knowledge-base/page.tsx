import { cookies } from "next/headers";
import { getDictionary, normalizeLang } from "../../../i18n/i18n";
import KnowledgeBaseClient from "./KnowledgeBaseClient";

export default async function AdminKnowledgeBasePage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const dictionary = getDictionary(lang);

  return <KnowledgeBaseClient lang={lang} dictionary={dictionary} />;
}
