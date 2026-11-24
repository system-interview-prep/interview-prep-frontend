import type { Metadata } from "next";
import { Suspense } from "react";
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
      "Thư viện hướng dẫn về CV, ATS và luyện phỏng vấn của INTERVIA đang được biên soạn. Xem trước các chủ đề sắp ra mắt.",
  };
}

export default function ResourcesPage() {
  // ResourcesPageClient reads useSearchParams(), which needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <ResourcesPageClient />
    </Suspense>
  );
}