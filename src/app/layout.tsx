import type { Metadata } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import LanguageProvider from "@/i18n/LanguageProvider";
import { normalizeLang } from "@/i18n/i18n";
import GoogleAuthProvider from "@features/auth/components/GoogleAuthProvider";
import { NavigationLoadingProvider } from "@components/shared/NavigationLoadingProvider";
import GlobalMascot from "@features/mascot/components/GlobalMascot";

export const metadata: Metadata = {
  title: "INTERVIA | Luyện phỏng vấn với AI",
  description: "Intervia: đối chiếu CV với JD và luyện phỏng vấn chat, giọng nói, video cùng AI.",
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Root layout, so the font loads on every page (the lint rule targets pages/). */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Fraunces:opsz,wght,SOFT@9..144,500..800,0..100&display=swap&subset=vietnamese"
        />
      </head>
      <body
        className="h-full bg-white font-body text-[#14244B] antialiased"
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
