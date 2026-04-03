import React from "react";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import NotFoundPage from "./[locale]/not-found";
import { routing } from "@/i18n/routing";

// ✅ messages loader
async function getMessages(locale: string) {
  return (await import(`../messages/${locale}.json`)).default;
}

export default async function NotFound() {
  let locale = await getLocale();

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  const messages = await getMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <NotFoundPage />
    </NextIntlClientProvider>
  );
}