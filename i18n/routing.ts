import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fa", "en", "ar", "tr"],
  defaultLocale: "fa",
  localePrefix: "as-needed",
  localeDetection: false,
  pathnames: {
    "/": "/",
    "/about": "/about",
    "/contact": "/contact",
  },
});

export const isRTLLocale = (locale: string): boolean => {
  const rtlLocales = ["ar", "fa"]; // Add more RTL locales as needed
  return rtlLocales.includes(locale);
};
