import type { Metadata } from "next";

type Rule = {
  match: (path: string) => boolean;
  skipServerMeta?: boolean;
  metadata?: Metadata | ((locale: string, path: string) => Metadata);
};

function normalizePath(path: string) {
  if (!path) return "/";
  let p = path.trim();
  if (!p.startsWith("/")) p = "/" + p;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

export const META_RULES: Rule[] = [
  // 🔎 Search page → noindex
  {
    match: (p) => normalizePath(p).startsWith("/search"),
    skipServerMeta: true,
    metadata: {
      // ✅ title رو حذف کردیم تا SearchMetaClient کنترلش کنه و انگلیسی نشه
      robots: {
        index: false,
        follow: false,
      },
    },
  },

  // 👤 Profile / Dashboard → noindex
  {
    match: (p) =>
      normalizePath(p).startsWith("/profile") ||
      normalizePath(p).startsWith("/dashboard"),
    skipServerMeta: true,
    metadata: {
      robots: {
        index: false,
        follow: false,
      },
    },
  },

  // 🔍 Filter / Compare → noindex
  {
    match: (p) =>
      normalizePath(p).startsWith("/filter") ||
      normalizePath(p).startsWith("/compare"),
    skipServerMeta: true,
    metadata: {
      robots: {
        index: false,
        follow: false,
      },
    },
  },
];

export function findMetaRule(path: string) {
  const normalized = normalizePath(path);
  return META_RULES.find((rule) => rule.match(normalized));
}