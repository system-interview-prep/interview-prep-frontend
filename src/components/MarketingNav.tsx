import Link from "next/link";
import { cookies } from "next/headers";
import LanguageToggleButton from "./LanguageToggleButton";
import { getDictionary, normalizeLang } from "../i18n/i18n";

export type MarketingNavActive = "platform" | "solutions" | "pricing" | "resources";

export default async function MarketingNav({ active }: { active: MarketingNavActive }) {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;

  const inactive =
    "text-[#434654] hover:text-[#003d9b] transition-colors duration-200 font-headline tracking-tight font-bold text-lg";
  const activeCls =
    "text-[#003d9b] border-b-2 border-[#003d9b] pb-1 font-headline tracking-tight font-bold text-lg";

  function NavItem({
    href,
    id,
    label,
  }: {
    href: string;
    id: MarketingNavActive;
    label: string;
  }) {
    if (active === id) {
      return (
        <span className={activeCls} aria-current="page">
          {label}
        </span>
      );
    }
    return (
      <Link href={href} className={inactive}>
        {label}
      </Link>
    );
  }

  return (
    <nav className="bg-[#f7f9fb] sticky top-0 z-50 transition-colors duration-200">
      <div className="flex justify-between items-center w-full px-6 md:px-12 py-4 mx-auto max-w-7xl">
        <Link
          href="/"
          className="text-2xl font-black text-[#191c1e] tracking-tighter font-headline shrink-0"
        >
          {t("marketing.brandCurator")}
        </Link>
        <div className="hidden md:flex items-center space-x-8 font-headline tracking-tight">
          <NavItem href="/" id="platform" label={t("nav.platform")} />
          <NavItem href="/solutions" id="solutions" label={t("nav.solutions")} />
          <NavItem href="/pricing" id="pricing" label={t("nav.pricing")} />
          <NavItem href="/resources" id="resources" label={t("nav.resources")} />
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          <Link
            className="text-[#434654] font-medium hover:text-[#191c1e] active:scale-95 transition-transform text-sm md:text-base hidden sm:inline"
            href="/login"
          >
            {t("auth.login")}
          </Link>
          <Link
            className="bg-primary text-white px-4 md:px-6 py-2 md:py-2.5 rounded-md font-bold hover:bg-primary-container active:scale-95 transition-transform text-sm md:text-base"
            href="/signup"
          >
            {t("auth.getStarted")}
          </Link>
          <div className="flex items-center gap-2 border-l border-outline-variant pl-3 md:pl-4 text-[#434654]">
            <LanguageToggleButton />
            <span
              className="material-symbols-outlined cursor-pointer hover:bg-[#eceef0] p-1 rounded-full transition-colors hidden sm:inline"
              aria-hidden
            >
              settings
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
