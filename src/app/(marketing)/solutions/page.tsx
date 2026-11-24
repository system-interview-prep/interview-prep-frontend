import { cookies } from "next/headers";
import { getDictionary, normalizeLang } from "@/i18n/i18n";
import { SolutionsPageClient } from "@/features/marketing/components/solutions/SolutionsPageClient";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const dictionary = getDictionary(lang);
  const title = dictionary["solutions.metaTitle"] ?? "Solutions | INTERVIA";
  const description =
    dictionary["solutions.metaDescription"] ??
    "Adapt your interview preparation to your career stage: Student & Early Career, Active Job Seeker, and Professional.";

  return {
    title,
    description,
  };
}

export default function SolutionsPage() {
  return <SolutionsPageClient />;
}

