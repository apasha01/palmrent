import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import "../globals.css";
import localFont from "next/font/local";

import Providers from "./providers";
import { notFound } from "next/navigation";

// ✅ messages (next-intl)
async function getMessages(locale: string) {
  return (await import(`../../messages/${locale}.json`)).default;
}

//////////////////////////////////////////////////////////
// 🔥 FONTS
//////////////////////////////////////////////////////////

// 🇮🇷 فارسی → IranYekan
const iranYekan = localFont({
  src: [
    {
      path: "../../fonts/iranyekanwebregularfanum.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../fonts/iranyekanwebboldfanum.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-fa",
  display: "swap",
});

// 🇸🇦 عربی → Vazir
const vazir = localFont({
  src: [
    {
      path: "../../fonts/Vazir-Thin.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../fonts/Vazir.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../fonts/Vazir-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../fonts/Vazir-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-ar",
  display: "swap",
});

// 🇬🇧 🇹🇷 انگلیسی + ترکی → Inter
const inter = localFont({
  src: [
    {
      path: "../../fonts/Inter-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../fonts/Inter-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../fonts/Inter-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-en",
  display: "swap",
});

const RTL_LOCALES = new Set(["fa", "ar"]);

// 🎯 انتخاب فونت بر اساس زبان
function getFont(locale: string) {
  if (locale === "fa") return iranYekan.className;
  if (locale === "ar") return vazir.className;
  return inter.className;
}


export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  const dir: "rtl" | "ltr" = RTL_LOCALES.has(locale) ? "rtl" : "ltr";
  const messages = await getMessages(locale);



  // ✅ فونت بر اساس زبان
  const fontClass = getFont(locale);

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={fontClass}>

        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}