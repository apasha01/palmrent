import { MetadataRoute } from "next";
import { supportedLocales } from "@/i18n/routing";

const routes = [
  {
    path: "",
    changeFrequency: "weekly" as const,
    priority: 1.0,
  },
  {
    path: "/about-us",
    changeFrequency: "monthly" as const,
    priority: 0.3,
  },
  {
    path: "/cars",
    changeFrequency: "daily" as const,
    priority: 0.8,
  },
  {
    path: "/cars-rent",
    changeFrequency: "weekly" as const,
    priority: 1.0,
  },
  {
    path: "/blogs",
    changeFrequency: "daily" as const,
    priority: 0.9,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXTFRONTEND_URL!;

  return supportedLocales.flatMap((locale) => {
    const prefix = locale === "fa" ? "" : `/${locale}`;

    return routes.map((route) => ({
      url: `${baseUrl}${prefix}${route.path}`,
      lastModified: new Date().toISOString(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }));
  });
}