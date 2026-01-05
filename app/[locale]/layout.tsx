import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import "../globals.css";
import localFont from "next/font/local";
import Providers from "./providers";

// ✅ messages (next-intl)
async function getMessages(locale: string) {
  return (await import(`../../messages/${locale}.json`)).default;
}

const dana = localFont({
  src: [
    { path: "../../fonts/Dana-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../fonts/Dana-Medium.woff", weight: "500", style: "normal" },
    { path: "../../fonts/Dana-Bold.woff2", weight: "700", style: "normal" },
    { path: "../../fonts/Dana-Bold.woff", weight: "700", style: "normal" },
  ],
  variable: "--font-dana",
  display: "swap",
});

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  const messages = await getMessages(locale);

  return (
    <html


      lang={locale}
      dir={locale === "fa" || locale === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
    >
      <body className={`${dana.className}`}>
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
