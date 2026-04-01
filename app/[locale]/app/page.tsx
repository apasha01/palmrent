/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { getLocale, getTranslations } from "next-intl/server";
import { getAppDetail } from "@/services/app/app-service.api";
import DownloadAppPageUI from "./DownloadAppPageUI";


function joinUrl(base?: string, path?: string | null) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (!base) return path.startsWith("/") ? path : `/${path}`;

  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
}

function getSiteUrl(): string {
  return (process.env.NEXTFRONTEND_URL || "").replace(/\/+$/, "");
}

function getStorageUrl(): string {
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

function normalizeKeywords(input: any): string[] {
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

function parseRobotsValue(value?: string | null): Metadata["robots"] | undefined {
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
    ...(maxImagePreviewMatch
      ? {
          googleBot: {
            index,
            follow,
            "max-image-preview": maxImagePreviewMatch[1] as
              | "none"
              | "standard"
              | "large",
            ...(maxSnippetMatch
              ? { "max-snippet": Number(maxSnippetMatch[1]) }
              : {}),
            ...(maxVideoPreviewMatch
              ? { "max-video-preview": Number(maxVideoPreviewMatch[1]) }
              : {}),
          },
        }
      : {
          googleBot: {
            index,
            follow,
            ...(maxSnippetMatch
              ? { "max-snippet": Number(maxSnippetMatch[1]) }
              : {}),
            ...(maxVideoPreviewMatch
              ? { "max-video-preview": Number(maxVideoPreviewMatch[1]) }
              : {}),
          },
        }),
    ...(maxVideoPreviewMatch
      ? { "max-video-preview": Number(maxVideoPreviewMatch[1]) }
      : {}),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("appNotFoundPage.meta");

  const result = await getAppDetail(locale);

  if (!result.ok && result.notFound) {
    return {
      title: t("title"),
      description: t("description"),
      robots: {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
          "max-image-preview": "none",
          "max-video-preview": -1,
          "max-snippet": -1,
        },
      },
    };
  }

  if (!result.ok) {
    throw new Error(result.message || "Failed to load app metadata");
  }

  const response = result.data;
  const meta = response?.meta;
  const appData = response?.data;

  const siteUrl = getSiteUrl();
  const storageUrl = getStorageUrl();

  const title = meta?.titleSeo?.trim();
  const description = meta?.descriptionSeo?.trim();
  const normalizedMetaKeywords = normalizeKeywords((meta as any)?.keywordsSeo);

  const image =
    meta?.imgSeo
      ? joinUrl(storageUrl, meta.imgSeo)
      : meta?.logo
        ? joinUrl(storageUrl, meta.logo)
        : "";

  const canonical =
    meta?.canonical?.trim()
      ? joinUrl(siteUrl, meta.canonical.trim())
      : meta?.urlPage?.trim()
        ? joinUrl(siteUrl, meta.urlPage.trim())
        : joinUrl(siteUrl, locale === "fa" ? "/app" : `/${locale}/app`);

  const robots = parseRobotsValue(meta?.robots) || {
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

  const alternatesLanguages =
    Array.isArray(meta?.alternate) && meta.alternate.length > 0
      ? meta.alternate.reduce<Record<string, string>>((acc, item: any) => {
          const lang = item?.hreflang || item?.lang;
          const href = item?.href || item?.url;

          if (lang && href) {
            acc[lang] = joinUrl(siteUrl, href);
          }

          return acc;
        }, {})
      : undefined;

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(normalizedMetaKeywords.length > 0
      ? { keywords: normalizedMetaKeywords }
      : {}),
    alternates: {
      canonical,
      languages: alternatesLanguages,
    },
    openGraph: {
      type: "website",
      url: canonical,
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      siteName: meta?.siteName || title || "Palm Rent",
      locale: getLocaleOg(locale),
      ...(image
        ? {
            images: [
              {
                url: image,
                width: 1200,
                height: 630,
                alt: title || appData?.appName || "Palm Rent App",
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(image ? { images: [image] } : {}),
    },
    robots,
    icons: meta?.favIcon
      ? {
          icon: joinUrl(storageUrl, meta.favIcon),
          shortcut: joinUrl(storageUrl, meta.favIcon),
          apple: joinUrl(storageUrl, meta.favIcon),
        }
      : undefined,
  };
}

export default async function AppPage() {
  const locale = await getLocale();

  const result = await getAppDetail(locale);

  if (!result.ok && result.notFound) {
    notFound();
  }

  if (!result.ok) {
    throw new Error(result.message || "Failed to load app page");
  }

  const response = result.data;
  const meta = response?.meta;
  const appData = response?.data;

  const storageUrl = getStorageUrl();

  const logoSrc = meta?.logo
    ? joinUrl(storageUrl, meta.logo)
    : "/images/logo.png";

  return (
    <>
      {meta?.schemaSeo ? (
        <Script
          id="app-schema-seo"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: meta.schemaSeo }}
        />
      ) : null}

      <DownloadAppPageUI
        androidHref={appData?.androidHref || "#"}
        iosHref={appData?.iosHref || "#"}
        webHref={appData?.webHref || "#"}
        helpHref={appData?.helpHref || "#"}
        logoSrc={logoSrc}
        appName={appData?.appName}
        subtitle={appData?.subtitle}
      />
    </>
  );
}