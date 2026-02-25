import type { Metadata } from "next";
import { headers } from "next/headers";
import { cache } from "react";

import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";

import "../globals.css";
import localFont from "next/font/local";

import Providers from "./providers";

import { getMetaServer } from "@/services/seo/meta.api";
import { stripLocale } from "@/services/seo/strip-locale";
import { resolveMetadata } from "@/services/seo/resolve-metadata";
import { findMetaRule } from "@/services/seo/meta-rules";
import MetaSyncClient from "@/services/seo/MetaSyncClient";
import { notFound } from "next/navigation";

// ✅ messages (next-intl)
async function getMessages(locale: string) {
  return (await import(`../../messages/${locale}.json`)).default;
}

const dana = localFont({
  src: [
    { path: "../../fonts/iranyekanwebregularfanum.ttf", weight: "500", style: "normal" },
    { path: "../../fonts/iranyekanwebboldfanum.ttf", weight: "700", style: "normal" },
    // { path: "../../fonts/Dana-Bold.woff2", weight: "700", style: "normal" },
    // { path: "../../fonts/Dana-Bold.woff", weight: "700", style: "normal" },
  ],
  variable: "--font-dana",
  display: "swap",
});

const getMetaCached = cache(async (locale: string, path: string) => {
  return getMetaServer(locale, path);
});

async function getPathFromHeaders(locale: string) {
  const h = await headers();
  const headerPath = h.get("x-pathname");
  const nextUrl = h.get("next-url");
  const raw = headerPath || nextUrl || "/";
  return stripLocale(raw, locale);
}

const RTL_LOCALES = new Set(["fa", "ar"]);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = await getPathFromHeaders(locale);
  return resolveMetadata(locale, path);
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
  const path = await getPathFromHeaders(locale);
  const rule = findMetaRule(path);
  const disableClientMetaSync = Boolean(rule?.skipServerMeta);
  const skipServerMeta = Boolean(rule?.skipServerMeta);
  const meta = !skipServerMeta ? await getMetaCached(locale, path) : null;

  const schemaJson =
    meta?.schemaSeo == null
      ? null
      : typeof meta.schemaSeo === "string"
        ? meta.schemaSeo
        : JSON.stringify(meta.schemaSeo);

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={dana.className}>
        {/* ✅ فقط وقتی skip نیست */}
        {!disableClientMetaSync ? <MetaSyncClient locale={locale} /> : null}

        {schemaJson ? (
          <script
            id="ld-json"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: schemaJson }}
          />
        ) : null}

        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}