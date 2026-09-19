import type { Metadata } from "next";
import { JetBrains_Mono, Newsreader, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import LanguageProvider from "@/i18n/LanguageProvider";
import { normalizeLang } from "@/i18n/i18n";
import GoogleAuthProvider from "@features/auth/components/GoogleAuthProvider";
import { NavigationLoadingProvider } from "@components/shared/NavigationLoadingProvider";
import GlobalMascot from "@features/mascot/components/GlobalMascot";

const newsreader = Newsreader({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Plus_Jakarta_Sans({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

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
      className={`${newsreader.variable} ${sans.variable} ${mono.variable} h-full`}
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
