import type { Metadata } from "next";
import { cookies } from "next/headers";

import {
  getDictionary,
  normalizeLang,
} from "@/i18n/i18n";

import ResourcesPageClient from "@features/marketing/components/resources/ResourcesPageClient";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();

  const lang = normalizeLang(
    cookieStore.get("lang")?.value,
  );

  const dict = getDictionary(lang);

  return {
    title:
      dict["resources.metaTitle"] ??
      "Resources | INTERVIA",

    description:
      lang === "vi"
        ? "Cẩm nang thực hành về CV, ATS, đối soát bằng chứng và luyện phỏng vấn cùng INTERVIA."
        : "Practical resources for CVs, ATS, evidence matching and interview preparation with INTERVIA.",
  };
}

export default function ResourcesPage() {
  return <ResourcesPageClient />;
}