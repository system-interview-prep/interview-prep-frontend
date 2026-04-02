import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import LanguageProvider from "../i18n/LanguageProvider";
import { getDictionary, normalizeLang } from "../i18n/i18n";
import GoogleAuthProvider from "../components/GoogleAuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Curator AI | Master Your Next Interview",
  description: "Master Your Next Interview",
  icons: {
    icon: "/icon.jpg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;

  return (
    <html lang={lang} className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{t("meta.title")}</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <style>{`.material-symbols-outlined {font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;}
.ai-pulse {position: relative;}
.ai-pulse::after {content: ''; position: absolute; width: 8px; height: 8px; background-color: #7029e1; border-radius: 50%; top: -2px; right: -2px;}
.glass-card {background: rgba(255,255,255,0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);}`}</style>
      </head>
      <body
        className={`bg-surface font-body text-on-surface ${geistSans.variable} ${geistMono.variable} antialiased h-full`}
      >
        <GoogleAuthProvider>
          <LanguageProvider initialLang={lang}>{children}</LanguageProvider>
        </GoogleAuthProvider>
      </body>
    </html>
  );
}

