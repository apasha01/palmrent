import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTFRONTEND_URL;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
disallow: [
  "/search",
  "/reserve",
  "/profile",
  "/rent",
  "/reservation",
  "/api",
  "/_next",
],
      },
    ],

    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
