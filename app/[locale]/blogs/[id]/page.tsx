/* eslint-disable @typescript-eslint/no-explicit-any */
import { cache } from "react";
import { getData } from "@/lib/getData";
import Image from "next/image";
import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";

import { IconDate, IconPerson2 } from "@/components/Icons";
import { BASE_URL, STORAGE_URL } from "../../../../lib/apiClient";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import Header from "@/components/layouts/Header";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

/* ---------------- helpers ---------------- */

function getSiteUrl(): string {
  return (process.env.NEXTFRONTEND_URL || "http://localhost:3000").replace(
    /\/+$/,
    ""
  );
}

function buildImage(url?: string | null) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;

  const storage = (STORAGE_URL || "").replace(/\/+$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;

  return `${storage}${path}`;
}

function normalizeKeywords(input: unknown): string[] {
  if (!input) return [];

  if (Array.isArray(input)) {
    return input
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
  }

  if (typeof input === "string") {
    return input
      .split(/[،,|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function parseRobotsValue(
  value?: string | null
): Metadata["robots"] | undefined {
  if (!value) return undefined;

  const raw = value.toLowerCase();

  const index = raw.includes("index") && !raw.includes("noindex");
  const follow = raw.includes("follow") && !raw.includes("nofollow");

  const maxSnippetMatch = raw.match(/max-snippet:([-\d]+)/);
  const maxImagePreviewMatch = raw.match(
    /max-image-preview:(none|standard|large)/
  );
  const maxVideoPreviewMatch = raw.match(/max-video-preview:([-\d]+)/);

  return {
    index,
    follow,
    ...(maxSnippetMatch ? { "max-snippet": Number(maxSnippetMatch[1]) } : {}),
    ...(maxVideoPreviewMatch
      ? { "max-video-preview": Number(maxVideoPreviewMatch[1]) }
      : {}),
    googleBot: {
      index,
      follow,
      ...(maxSnippetMatch ? { "max-snippet": Number(maxSnippetMatch[1]) } : {}),
      ...(maxImagePreviewMatch
        ? {
            "max-image-preview": maxImagePreviewMatch[1] as
              | "none"
              | "standard"
              | "large",
          }
        : {}),
      ...(maxVideoPreviewMatch
        ? { "max-video-preview": Number(maxVideoPreviewMatch[1]) }
        : {}),
    },
  };
}

function getOgLocale(locale: string) {
  switch (locale) {
    case "fa":
      return "fa_IR";
    case "ar":
      return "ar_SA";
    case "tr":
      return "tr_TR";
    case "en":
    default:
      return "en_US";
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

function buildCanonicalPath(locale: string, id: string): string {
  const safeId = encodeURIComponent(id);
  return `${locale === "fa" ? "" : `/${locale}`}/blogs/${safeId}`;
}

function toAbsoluteUrl(input: string, siteUrl: string): string {
  if (/^https?:\/\//i.test(input)) return input;
  return `${siteUrl}${input.startsWith("/") ? input : `/${input}`}`;
}

/* ---------------- types ---------------- */

type BlogMeta = {
  titleSeo?: string;
  descriptionSeo?: string;
  keywordsSeo?: string[] | string;
  schemaSeo?: string | null;
  imgSeo?: string;
  canonical?: string;
  robots?: string;
  favIcon?: string;
  logo?: string;
  siteName?: string;
  urlPage?: string;
  alternate?: Array<{
    lang?: string;
    url?: string;
  }>;
};

type BlogItem = {
  id: number | string;
  title?: string;
  date?: string;
  branch?: string;
  text?: string;
  author?: string;
  photo?: string;
};

type RelatedBlogItem = {
  id?: number | string;
  slug?: string;
  title?: string;
  date?: string;
  photo?: string;
};

type BlogResponse = {
  status?: number;
  meta?: BlogMeta;
  data?: {
    item?: BlogItem;
    comments?: any[];
    last_blogs?: RelatedBlogItem[];
  };
};

/* ---------------- API ---------------- */

const getPostBySlug = cache(
  async (slug: string, locale: string): Promise<BlogResponse> => {
    if (!slug) {
      return {
        status: 404,
        data: {
          item: undefined,
          comments: [],
          last_blogs: [],
        },
      };
    }

    try {
      const safeSlug = encodeURIComponent(slug);
      const safeLocale = encodeURIComponent(locale);

      const data = await getData(`${BASE_URL}/blog/${safeSlug}/${safeLocale}`);

      return (
        data ?? {
          status: 500,
          data: {
            item: undefined,
            comments: [],
            last_blogs: [],
          },
        }
      );
    } catch (error: any) {
      const status =
        error?.response?.status ||
        error?.status ||
        error?.cause?.status ||
        500;

      if (status === 404) {
        return {
          status: 404,
          data: {
            item: undefined,
            comments: [],
            last_blogs: [],
          },
        };
      }

      console.error("خطا در دریافت پست بلاگ:", error);

      throw new Error(
        `Failed to fetch blog post. status=${status}, slug=${slug}, locale=${locale}`
      );
    }
  }
);

/* ---------------- SEO ---------------- */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;

  const post = await getPostBySlug(id, locale);
  const meta = post?.meta;
  const item = post?.data?.item;

  const siteUrl = getSiteUrl();
  const fallbackCanonicalPath = buildCanonicalPath(locale, id);

  if (post?.status === 404) {
    return {
      metadataBase: new URL(siteUrl),
      title: "مقاله یافت نشد | پالم رنت",
      description: "این مقاله در حال حاضر در دسترس نیست.",
      alternates: {
        canonical: fallbackCanonicalPath,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = meta?.titleSeo?.trim() || item?.title || "";

  let description = meta?.descriptionSeo?.trim() || "";
  if (!description && item?.text) {
    const plainText = stripHtml(item.text);
    description = truncateText(plainText, 160);
  }

  const image = buildImage(meta?.imgSeo || item?.photo);

  const parsedKeywords = normalizeKeywords(meta?.keywordsSeo);
  const keywords = parsedKeywords.length
    ? parsedKeywords
    : ["پالم رنت", "اجاره خودرو", "بلاگ خودرو"];

  const rawCanonical =
    meta?.canonical?.trim() ||
    meta?.urlPage?.trim() ||
    fallbackCanonicalPath;

  const canonical = toAbsoluteUrl(rawCanonical, siteUrl);

  const alternateLanguages =
    Array.isArray(meta?.alternate) && meta.alternate.length > 0
      ? meta.alternate.reduce<Record<string, string>>((acc, alt) => {
          if (alt?.lang && alt?.url) {
            acc[alt.lang] = toAbsoluteUrl(
              `${alt.lang === "fa" ? "" : `/${alt.lang}`}${alt.url}`,
              siteUrl
            );
          }
          return acc;
        }, {})
      : undefined;

  const robots = parseRobotsValue(meta?.robots) || {
    index: true,
    follow: true,
    nocache: false,
    "max-snippet": -1,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  };

  return {
    metadataBase: new URL(siteUrl),
    title: title || undefined,
    description: description || undefined,
    keywords: keywords.length ? keywords : undefined,
    alternates: {
      canonical,
      languages: alternateLanguages,
    },
    openGraph: {
      type: "article",
      url: canonical,
      title: title || undefined,
      description: description || undefined,
      siteName: meta?.siteName || "Palm Rent",
      locale: getOgLocale(locale),
      images: image
        ? [
            {
              url: image,
              width: 1200,
              height: 630,
              alt: item?.title || "",
            },
          ]
        : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: title || undefined,
      description: description || undefined,
      images: image ? [image] : undefined,
      creator: "@PalmRent",
    },
    robots,
  };
}

/* ---------------- PAGE ---------------- */

export default async function BlogPost({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;

  const post = await getPostBySlug(id, locale);

  // فقط وقتی واقعا 404 از API برگشته
  if (post?.status === 404) {
    notFound();
  }

  // غیر از 404، نباید notFound بده
  // اگر data خراب بود، خطای واقعی است نه 404
  if (!post?.data?.item) {
    throw new Error(
      `Blog data is invalid. slug=${id}, locale=${locale}, status=${post?.status ?? "unknown"}`
    );
  }

  const meta = post.meta;
  const data = post.data;
  const item: BlogItem = post.data.item;
  const lastBlogs = data?.last_blogs ?? [];

  const t = await getTranslations("blogPage");

  const mainPhotoFinal = buildImage(meta?.imgSeo || item.photo);

  return (
    <>
      <Header shadowLess />

      {meta?.schemaSeo ? (
        <Script
          id="blog-schema-seo"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: meta.schemaSeo }}
        />
      ) : null}

      <div className="xl:w-[85vw] w-[95vw] m-auto max-w-334">
        <div className="flex w-full lg:flex-row flex-col">
          <article className="lg:w-8/12 w-full container mx-auto px-4 py-8 flex flex-col gap-8">
            {!!mainPhotoFinal && (
              <div className="w-full flex flex-col items-center justify-center">
                <div className="w-full rounded-lg overflow-hidden">
                  <Image
                    className="w-full h-full object-cover rounded-lg"
                    src={mainPhotoFinal}
                    width={856}
                    height={481}
                    alt={item.title || ""}
                    priority
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold">{item.title}</h1>

              <div className="w-full flex flex-wrap items-center text-[#727272] gap-2">
                {!!item.author && (
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 border p-1.5 rounded-full justify-center items-center">
                      <IconPerson2 className={undefined} />
                    </span>
                    {item.author}
                  </div>
                )}

                {!!item.date && (
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 border p-1.5 rounded-full justify-center items-center">
                      <IconDate />
                    </span>
                    {item.date}
                  </div>
                )}
              </div>
            </div>

            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: item.text || "" }}
            />
          </article>

          <div className="lg:w-4/12 w-full">
            <div className="sticky top-8 border mt-8 rounded-lg p-4 flex flex-col gap-4">
              <div className="font-bold text-lg">{t("relatedPosts")}</div>

              {lastBlogs.map((b, index) => {
                const relatedId = b?.slug ?? b?.id;
                const relatedPhotoFinal = buildImage(b?.photo);

                if (!relatedId) return null;

                return (
                  <Link
                    key={String(relatedId ?? index)}
                    href={`/blogs/${relatedId}`}
                    className="p-2 border rounded-lg flex gap-2"
                  >
                    {!!relatedPhotoFinal && (
                      <div className="shrink-0 w-[125px] h-[70px] rounded-lg overflow-hidden">
                        <Image
                          className="rounded-lg w-full h-full object-cover"
                          src={relatedPhotoFinal}
                          width={125}
                          height={70}
                          alt={b?.title || ""}
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-2 flex-1 relative pb-6">
                      <div>{b?.title}</div>
                      <div className="text-xs font-bold flex justify-end absolute bottom-0 left-0">
                        {b?.date}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}