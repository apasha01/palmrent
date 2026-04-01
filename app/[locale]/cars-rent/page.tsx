import type { Metadata } from "next";
import { cache } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import Footer from "@/components/Footer";
import BranchCars from "@/components/hubBranches/BranchCars";
import BranchList from "@/components/hubBranches/BranchList";

import FAQlanding from "@/components/Branchs/FAQ-landing";
import ImportantQuestions from "@/components/Branchs/Important-Questions";
import QRApplication from "@/components/Branchs/QR-Application";
import Header from "@/components/layouts/Header";
import NavSection from "@/components/Branchs/Nav-SectionNew";

import { getBranches } from "@/services/branches/branches.api";
import { getHubFaq } from "@/services/hub/hub.api";
import {
  getHubCarsOnly,
  type HubCarsResponseData,
} from "@/services/hub-cars/hub-cars.api";
import { notFound } from "next/navigation";
import MoreDescription from "@/components/hubBranches/HubFooter";

type BranchItem = {
  id: number;
  slug: string;
  title: string;
  photo: string | null;
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

const getCachedBranches = cache(async (locale: string): Promise<BranchItem[]> => {
  const branches = await getBranches(locale);
  return Array.isArray(branches) ? branches : [];
});

const getCachedHubFaq = cache(async (locale: string) => {
  return getHubFaq(locale);
});

const getCachedInitialCarsData = cache(
  async (locale: string): Promise<{
    branches: BranchItem[];
    firstBranch: BranchItem | null;
    initialCarsData: HubCarsResponseData | null;
  }> => {
    const branches = await getCachedBranches(locale);
    const firstBranch = branches?.[0] ?? null;

    if (!firstBranch?.id) {
      return {
        branches,
        firstBranch: null,
        initialCarsData: null,
      };
    }

    const initialCarsData = await getHubCarsOnly(firstBranch.id, locale, {
      page: 1,
    });

    return {
      branches,
      firstBranch,
      initialCarsData,
    };
  }
);

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const siteUrl = getSiteUrl();

  const { initialCarsData } = await getCachedInitialCarsData(locale);
  const meta = initialCarsData?.meta;

  const title = meta?.titleSeo || "Palm Rent";
  const description = meta?.descriptionSeo || "";
  const canonical = meta?.canonical || `${siteUrl}/cars-rent`;
  const pageUrl = meta?.urlPage || canonical;
  const siteName = meta?.siteName || "Palm Rent";
  const imageUrl = toAbsoluteUrl(meta?.imgSeo);

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
  };
}

const Page = async () => {
  const locale = await getLocale();
  const t = await getTranslations("HubLandingPage");

  const [{ branches, firstBranch, initialCarsData }, hubData] = await Promise.all([
    getCachedInitialCarsData(locale),
    getCachedHubFaq(locale),
  ]);

  if (!branches?.length) {
    notFound();
  }



  return (
    <section className="mx-auto bg-white dark:bg-gray-950">


      <Header shadowLess />

      <NavSection
        image="/images/head-list-branch.jpg"
        title={t("heroTitle")}
        subtitle1={t("heroSubtitle1")}
        subtitle2={t("heroSubtitle2")}
      />

      <main className="mx-auto w-full max-w-7xl">
        <div className="px-0">
          <BranchList branches={branches} isLoading={false} />

          <section className="mt-8">
            <ImportantQuestions onlySupportView />
          </section>

          <section className="mt-8">
            <BranchCars
              branches={branches}
              isLoading={false}
              initialBranchId={firstBranch?.id ?? null}
              initialCarsData={initialCarsData}
            />
          </section>

          <section className="mt-6">
            <QRApplication />
          </section>

                    <section className="mt-8">
            <MoreDescription description={hubData?.description ?? ""} />
          </section>

          <section className="mt-4">
            <FAQlanding data={hubData?.categories ?? []} loading={false} />
          </section>



          <Footer />
        </div>
      </main>
    </section>
  );
};

export default Page;