import type { Metadata } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import LanguageProvider from "@/i18n/LanguageProvider";
import { normalizeLang } from "@/i18n/i18n";
import GoogleAuthProvider from "@features/auth/components/GoogleAuthProvider";
import { NavigationLoadingProvider } from "@components/shared/NavigationLoadingProvider";
import GlobalMascot from "@features/mascot/components/GlobalMascot";

export const metadata: Metadata = {
  title: "Career · Studio | CV–JD & Voice Interview",
  description: "Phân tích CV–JD theo ngữ nghĩa và luyện phỏng vấn giọng nói bằng AI.",
  icons: { icon: "/logo.jpg" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);

  return (
    <html
      lang={lang}
      className="h-full"
      suppressHydrationWarning
    >
      <body
        className="h-full bg-white font-body text-[#234196] antialiased"
        suppressHydrationWarning
      >
        <GoogleAuthProvider>
          <LanguageProvider initialLang={lang}>
            <NavigationLoadingProvider>
              {children}
              <GlobalMascot />
            </NavigationLoadingProvider>
          </LanguageProvider>
        </GoogleAuthProvider>
      </body>
    </html>
  );
}
