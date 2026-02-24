/* eslint-disable @typescript-eslint/no-explicit-any */
export type MetaData = {
  titleSeo?: string | null;
  descriptionSeo?: string | null;
  canonical?: string | null;
  robots?: string | null;
  schemaSeo?: string | null;
  siteName?: string | null;
  urlPage?: string | null;
  favIcon?: string | null;
  imgSeo?: string | null;
  alternate?: any;
};

const defaultMeta: MetaData = {
  titleSeo: "PalmRent",
  descriptionSeo: "",
  robots: "follow, index",
};

const normalizePath = (path?: string): string => {
  if (!path) return "/";
  let p = path.trim();
  if (!p.startsWith("/")) p = "/" + p;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
};

const log = (msg: string, data?: any) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[META_SERVER] ${msg}`, data ?? "");
  }
};

export async function getMetaServer(lang: string, path?: string): Promise<MetaData> {
  try {
    // ✅ با config شما: NEXT_PUBLIC_API_URL = http://127.0.0.1:8000/api
    const base = process.env.NEXT_PUBLIC_API_URL;

    if (!base) {
      log("Missing NEXT_PUBLIC_API_URL");
      return defaultMeta;
    }

    // ✅ چون base خودش /api دارد => نباید دوباره /api اضافه کنیم
    // endpoint می‌شود: {base}/meta/{lang}?path=...
    const url = new URL(`${base.replace(/\/$/, "")}/meta/${lang}`);
    url.searchParams.set("path", normalizePath(path));

    log("Fetch", url.toString());

    const res = await fetch(url.toString(), { cache: "no-store" });

    if (!res.ok) {
      log("Non-OK", { status: res.status });
      return defaultMeta;
    }

    const json = await res.json();
    const meta = json?.meta;

    if (!meta) {
      log("No meta in response", json);
      return defaultMeta;
    }

    log("Success", { title: meta.titleSeo, canonical: meta.canonical });
    return { ...defaultMeta, ...meta };
  } catch (e: any) {
    log("Error", e?.message);
    return defaultMeta;
  }
}
