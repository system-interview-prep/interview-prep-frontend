import type { Metadata } from "next";
import { cookies } from "next/headers";

import {
  getDictionary,
  normalizeLang,
} from "@/i18n/i18n";

import PricingPageClient from "@features/marketing/pricing/PricingPageClient";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();

  const lang = normalizeLang(
    cookieStore.get("lang")?.value,
  );

  const dict = getDictionary(lang);

  return {
    title:
      dict["pricing.metaTitle"] ??
      "Pricing | INTERVIA",

    description:
      lang === "vi"
        ? "Chọn pass hoặc credit INTERVIA phù hợp với giai đoạn chuẩn bị CV và phỏng vấn của bạn. Thanh toán một lần, không tự động gia hạn."
        : "Choose an INTERVIA pass or credit for your CV and interview preparation. One-time payment with no automatic renewal.",
  };
}

export default function PricingPage() {
  return <PricingPageClient />;
}