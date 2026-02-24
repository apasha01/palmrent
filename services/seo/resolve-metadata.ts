import type { Metadata } from "next";
import { getMetaServer } from "@/services/seo/meta.api";
import { findMetaRule } from "./meta-rules";

const DEFAULT_META: Metadata = {
  title: "PalmRent",
  description: "",
  robots: "follow, index",
};

export async function resolveMetadata(locale: string, path: string): Promise<Metadata> {
  const rule = findMetaRule(path);

  // ✅ اگر rule گفت از بک نگیر
  if (rule?.skipServerMeta) {
    const md = typeof rule.metadata === "function" ? rule.metadata(locale, path) : rule.metadata;
    return { ...DEFAULT_META, ...(md ?? {}) };
  }

  // ✅ در غیر این صورت از بک بگیر
  const meta = await getMetaServer(locale, path);

  let md: Metadata = {
    title: meta.titleSeo ?? "PalmRent",
    description: meta.descriptionSeo ?? "",
    robots: meta.robots ?? undefined,
    alternates: meta.canonical ? { canonical: meta.canonical } : undefined,
    openGraph: {
      title: meta.titleSeo ?? "PalmRent",
      description: meta.descriptionSeo ?? "",
      url: meta.urlPage ?? undefined,
      siteName: meta.siteName ?? undefined,
      images: meta.imgSeo ? [{ url: meta.imgSeo }] : undefined,
    },
    icons: meta.favIcon ? { icon: meta.favIcon } : undefined,
  };

  // ✅ اگر rule فقط override می‌خواست (بدون skip)
  if (rule?.metadata) {
    const ov = typeof rule.metadata === "function" ? rule.metadata(locale, path) : rule.metadata;
    md = { ...md, ...ov };
  }

  return md;
}