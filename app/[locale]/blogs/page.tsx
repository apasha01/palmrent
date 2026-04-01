import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { BASE_URL } from "@/lib/apiClient";
import BlogsPageClient from "@/components/blog/BlogsPageClient";
import Header from "@/components/layouts/Header";
import Footer from "@/components/Footer";

type BlogItem = {
  id: string | number;
  title: string;
  text: string;
  photo?: string | null;
};

type MetaAlternateItem = {
  hreflang?: string;
  href?: string;
};

type MetaDataResponse = {
  titleSeo?: string | null;
  descriptionSeo?: string | null;
  schemaSeo?: string | null;
  imgSeo?: string | null;
  canonical?: string | null;
  robots?: string | null;
  favIcon?: string | null;
  logo?: string | null;
  siteName?: string | null;
  urlPage?: string | null;
  alternate?: MetaAlternateItem[] | null;
};

type BlogsResponse = {
  meta?: MetaDataResponse;
  data?: {
    items?: BlogItem[];
    has_more?: boolean;
  };
};

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

function joinUrl(base?: string, path?: string | null) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const safeBase = String(base ?? "").replace(/\/+$/, "");
  const safePath = String(path).startsWith("/") ? String(path) : `/${String(path)}`;

  return safeBase ? `${safeBase}${safePath}` : safePath;
}

function getFrontendUrl() {
  return (process.env.NEXTFRONTEND_URL || "").replace(/\/+$/, "");
}

function getStorageUrl() {
  return (process.env.NEXT_PUBLIC_STORAGE_URL || "").replace(/\/+$/, "");
}

function getLocaleOg(locale: string) {
  switch (locale) {
    case "fa":
      return "fa_IR";
    case "ar":
      return "ar_AE";
    case "tr":
      return "tr_TR";
    case "en":
    default:
      return "en_US";
  }
}

function parseRobotsValue(value?: string | null): Metadata["robots"] | undefined {
  if (!value) return undefined;

  const raw = value.toLowerCase();

  const index = raw.includes("index") && !raw.includes("noindex");
  const follow = raw.includes("follow") && !raw.includes("nofollow");
  const noarchive = raw.includes("noarchive");
  const nosnippet = raw.includes("nosnippet");
  const noimageindex = raw.includes("noimageindex");
  const nocache = raw.includes("nocache");

  const maxSnippetMatch = raw.match(/max-snippet:([-\d]+)/);
  const maxImagePreviewMatch = raw.match(
    /max-image-preview:(none|standard|large)/
  );
  const maxVideoPreviewMatch = raw.match(/max-video-preview:([-\d]+)/);

  return {
    index,
    follow,
    noarchive,
    nosnippet,
    noimageindex,
    nocache,
    ...(maxSnippetMatch ? { "max-snippet": Number(maxSnippetMatch[1]) } : {}),
    ...(maxVideoPreviewMatch
      ? { "max-video-preview": Number(maxVideoPreviewMatch[1]) }
      : {}),
    googleBot: {
      index,
      follow,
      noarchive,
      nosnippet,
      noimageindex,
      ...(maxSnippetMatch ? { "max-snippet": Number(maxSnippetMatch[1]) } : {}),
      ...(maxVideoPreviewMatch
        ? { "max-video-preview": Number(maxVideoPreviewMatch[1]) }
        : {}),
      ...(maxImagePreviewMatch
        ? {
            "max-image-preview": maxImagePreviewMatch[1] as
              | "none"
              | "standard"
              | "large",
          }
        : {}),
    },
  };
}

function buildAlternates(meta?: MetaDataResponse): Metadata["alternates"] | undefined {
  const canonical = meta?.canonical?.trim() || meta?.urlPage?.trim() || undefined;

  const languages =
    Array.isArray(meta?.alternate) && meta?.alternate.length > 0
      ? meta.alternate.reduce<Record<string, string>>((acc, item) => {
          const hreflang = String(item?.hreflang ?? "").trim();
          const href = String(item?.href ?? "").trim();

          if (hreflang && href) {
            acc[hreflang] = href;
          }

          return acc;
        }, {})
      : undefined;

  if (!canonical && !languages) return undefined;

  return {
    ...(canonical ? { canonical } : {}),
    ...(languages && Object.keys(languages).length > 0 ? { languages } : {}),
  };
}

async function getBlogsPageData(locale: string) {
  try {
    const res = await fetch(`${BASE_URL}/blogs/${locale}?page=1`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return {
        meta: undefined as MetaDataResponse | undefined,
        items: [] as BlogItem[],
        hasMore: false,
      };
    }

    const json: BlogsResponse = await res.json();

    return {
      meta: json?.meta,
      items: json?.data?.items ?? [],
      hasMore: json?.data?.has_more ?? false,
    };
  } catch {
    return {
      meta: undefined as MetaDataResponse | undefined,
      items: [] as BlogItem[],
      hasMore: false,
    };
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const { meta } = await getBlogsPageData(locale);

  const frontendUrl = getFrontendUrl();
  const storageUrl = getStorageUrl();

  const title =
    meta?.titleSeo?.trim() || "وبلاگ | پالم رنت";

  const description =
    meta?.descriptionSeo?.trim() || "مقالات و مطالب وبلاگ پالم رنت";

  const image =
    meta?.imgSeo
      ? joinUrl(storageUrl || frontendUrl, meta.imgSeo)
      : meta?.logo
      ? joinUrl(storageUrl || frontendUrl, meta.logo)
      : "";

  const canonical =
    meta?.canonical?.trim() ||
    meta?.urlPage?.trim() ||
    (locale === "fa"
      ? `${frontendUrl}/blogs`
      : `${frontendUrl}/${locale}/blogs`);

  const robots =
    parseRobotsValue(meta?.robots) || {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-video-preview": -1,
        "max-snippet": -1,
      },
    };

  return {
    metadataBase: frontendUrl ? new URL(frontendUrl) : undefined,
    title,
    description,
    alternates: buildAlternates(meta) ?? {
      canonical,
    },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      siteName: meta?.siteName?.trim() || "Palm Rent",
      locale: getLocaleOg(locale),
      images: image
        ? [
            {
              url: image,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots,
    icons: {
      icon: meta?.favIcon
        ? joinUrl(storageUrl || frontendUrl, meta.favIcon)
        : undefined,
      shortcut: meta?.favIcon
        ? joinUrl(storageUrl || frontendUrl, meta.favIcon)
        : undefined,
      apple: meta?.favIcon
        ? joinUrl(storageUrl || frontendUrl, meta.favIcon)
        : undefined,
    },
  };
}

export default async function BlogsPage({ params }: PageProps) {
  const { locale } = await params;
  const initialData = await getBlogsPageData(locale);
  const t = await getTranslations({ locale });

  return (
    <>
      <Header />

      <div className="m-auto w-[95vw] max-w-[1336px] xl:w-[85vw]">
        <div className="py-4">
          <h1 className="py-4 text-center text-base font-bold text-[#3B82F6] sm:text-lg md:text-xl">
            {t("blog")}
          </h1>

          <BlogsPageClient
            locale={locale}
            initialBlogs={initialData.items}
            initialHasMore={initialData.hasMore}
          />
        </div>
      </div>

      <Footer />
    </>
  );
}