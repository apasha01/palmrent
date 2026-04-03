/* eslint-disable @typescript-eslint/no-explicit-any */
import BranchLandingClient from "@/components/Branchs/BranchLandingClient";
import { buildLocalizedPath } from "@/i18n/routing";
import type { Metadata } from "next";
import Script from "next/script";
import { cache } from "react";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    locale: string;
    cityName: string;
  }>;
};

type BranchSeoMeta = {
  titleSeo?: string;
  descriptionSeo?: string;
  schemaSeo?: string;
  imgSeo?: string | null;
  favIcon?: string | null;
  logo?: string | null;
  canonical?: string;
  robots?: string;
  siteName?: string;
  urlPage?: string;
  alternate?: Array<{
    lang?: string;
    url?: string;
  }>;
};

type BranchPageApiResponse = {
  status?: number;
  message?: string;
  meta?: BranchSeoMeta;
  data?: {
    branch?: {
      id?: number | string;
      slug?: string;
      title?: string;
      title1?: string;
      title2?: string;
      text1?: string;
      text2?: string;
      whatsapp?: string;
      phone?: string;
      photo?: string;
      photo_inside?: string;
      video?: string | null;
      description_1?: string;
    };
    categories?: any[];
    brands?: any[];
    children?: any[];
    cars?: any[];
    currency?: string;
    rate_to_rial?: number | null;
    page?: number;
    per_page?: number;
    has_more?: boolean;
  };
};

function getSiteUrl(): string {
  return process.env.NEXTFRONTEND_URL!.replace(/\/+$/, "");
}

function getLocaleOg(locale: string) {
  switch (locale) {
    case "fa":
      return "fa_IR";
    case "ar":
      return "ar_AR";
    case "tr":
      return "tr_TR";
    case "en":
    default:
      return "en_US";
  }
}

function toAbsoluteUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;

  const base = getSiteUrl();
  const clean = value.startsWith("/") ? value : `/${value}`;
  return `${base}${clean}`;
}

function parseRobots(robots?: string): Metadata["robots"] {
  if (!robots) {
    return {
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
  }

  const normalized = robots.toLowerCase();

  return {
    index: !normalized.includes("noindex"),
    follow: !normalized.includes("nofollow"),
    nocache: normalized.includes("noarchive"),
    "max-snippet": normalized.includes("max-snippet:-1") ? -1 : undefined,
    googleBot: {
      index: !normalized.includes("noindex"),
      follow: !normalized.includes("nofollow"),
      "max-image-preview": normalized.includes("max-image-preview:large")
        ? "large"
        : undefined,
      "max-video-preview": normalized.includes("max-video-preview:-1")
        ? -1
        : undefined,
      "max-snippet": normalized.includes("max-snippet:-1") ? -1 : undefined,
    },
  };
}

const getBranchLandingData = cache(
  async (slug: string, locale: string): Promise<BranchPageApiResponse | null> => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL!.replace(/\/+$/, "");
      const url = `${apiBase}/car/branch/${slug}/${locale}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 300 },
      });

      if (res.status === 404) return null;

      const data: BranchPageApiResponse = await res.json();

      if (Number(data?.status) === 404) return null;
      if (!data?.data?.branch?.id) return null;

      return data;
    } catch {
      return null;
    }
  }
);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, cityName } = await params;

  const response = await getBranchLandingData(cityName, locale);

  if (!response?.data?.branch?.id) {
    notFound();
  }

  const meta = response.meta;
  const siteUrl = getSiteUrl();

  const fallbackPath = buildLocalizedPath(locale, `/cars-rent/${cityName}`);
  const fallbackCanonical = `${siteUrl}${fallbackPath}`;

  const title = meta?.titleSeo || "Palm Rent";
  const description = meta?.descriptionSeo || "";
  const canonical = meta?.canonical || fallbackCanonical;
  const pageUrl = meta?.urlPage || canonical;
  const siteName = meta?.siteName || "Palm Rent";
  const imageUrl = toAbsoluteUrl(meta?.imgSeo);
  const logoUrl = toAbsoluteUrl(meta?.logo);

  const languages =
    meta?.alternate?.reduce<Record<string, string>>((acc, item) => {
      if (item?.lang && item?.url) {
        acc[item.lang] = item.url;
      }
      return acc;
    }, {}) || undefined;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      type: "website",
      url: pageUrl,
      title,
      description,
      siteName,
      locale: getLocaleOg(locale),
      images: imageUrl ? [{ url: imageUrl }] : [],
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      creator: "@PalmRent",
      images: imageUrl ? [imageUrl] : [],
    },
    robots: parseRobots(meta?.robots),
    icons: {
      icon: meta?.favIcon ? toAbsoluteUrl(meta.favIcon) : undefined,
      shortcut: meta?.favIcon ? toAbsoluteUrl(meta.favIcon) : undefined,
      apple: meta?.favIcon ? toAbsoluteUrl(meta.favIcon) : undefined,
    },
    other: {
      ...(logoUrl ? { logo: logoUrl } : {}),
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale, cityName } = await params;
  const resolvedLocale = locale || (await getLocale());

  const response = await getBranchLandingData(cityName, resolvedLocale);

  if (!response?.data?.branch?.id) {
    notFound();
  }

  const schemaSeo = response?.meta?.schemaSeo;
  const branch = response?.data?.branch;

  return (
    <>
      {schemaSeo ? (
        <Script
          id="branch-landing-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaSeo }}
        />
      ) : null}

      <BranchLandingClient
        locale={resolvedLocale}
        cityName={cityName}
        initialBranchId={branch?.id ?? null}
        initialBranchTitle={branch?.title1 || branch?.title || ""}
      />
    </>
  );
}