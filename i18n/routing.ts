import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar", "fa", 'tr'], // Add your RTL locales
  defaultLocale: "fa",
  localePrefix: "as-needed",
  localeDetection: false,
});

export const isRTLLocale = (locale: string): boolean => {
  const rtlLocales = ["ar", "fa"]; // Add more RTL locales as needed
  return rtlLocales.includes(locale);
};
