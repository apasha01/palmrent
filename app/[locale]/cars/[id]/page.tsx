/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import Header from "@/components/layouts/Header";
import Footer from "@/components/Footer";
import { CarDescription } from "@/components/car-detail/car-description";
import { CarFeatures } from "@/components/car-detail/car-features";
import FAQcardetail from "@/components/car-detail/Faq-car-detail";
import { ImageGallery } from "@/components/car-detail/image-gallery";
import { PricingCard } from "@/components/car-detail/pricing-card";
import { RequiredDocuments } from "@/components/car-detail/required-documents";
import { SimilarCars } from "@/components/car-detail/similar-cars";
import { TechnicalSpecs } from "@/components/car-detail/technical-specs";
import { getLocale, getTranslations } from "next-intl/server";
import { Car, Fuel, Users, Briefcase, Heart, Share2 } from "lucide-react";
import { getCarDetail } from "@/services/car-detail/car-detail.api";
import { MobilePriceBar } from "@/components/car-detail/mobile-price-bar";
import Script from "next/script";
import { notFound } from "next/navigation";

type FeatureChip = { label: string; active: boolean };

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
    return input.map((item) => String(item ?? "").trim()).filter(Boolean);
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
  value?: string | null,
): Metadata["robots"] | undefined {
  if (!value) return undefined;

  const raw = value.toLowerCase();

  const index = raw.includes("index") && !raw.includes("noindex");
  const follow = raw.includes("follow") && !raw.includes("nofollow");

  const maxSnippetMatch = raw.match(/max-snippet:([-\d]+)/);
  const maxImagePreviewMatch = raw.match(
    /max-image-preview:(none|standard|large)/,
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

function buildFeaturesFromApi(
  car: any,
  t: Awaited<ReturnType<typeof getTranslations>>,
): FeatureChip[] {
  const depositNum = Number(car?.deposit ?? 0);

  return [
    {
      label: t("carDetail.features.noDeposit"),
      active: !Number.isNaN(depositNum) && depositNum === 0,
    },
    {
      label: t("carDetail.features.freeDelivery"),
      active: String(car?.free_delivery) === "yes",
    },
    {
      label: t("carDetail.features.unlimitedKm"),
      active: String(car?.km) === "yes",
    },
    {
      label: t("carDetail.features.insurance"),
      active: String(car?.insurance) === "yes",
    },
  ];
}

function buildCarDisplayTitle(
  car: any,
  locale: string,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  const carName = String(car?.title ?? "").trim();
  const branchName = String(car?.branch ?? "").trim();

  if (!carName && !branchName) return "";
  if (!branchName) return carName;
  if (!carName) return branchName;

  return t("carDetail.dynamicTitle", {
    car: carName,
    branch: branchName,
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const locale = await getLocale();
  const notFoundT = await getTranslations("carDetailNotFoundPage.meta");
  const carDetailT = await getTranslations();

  const result = await getCarDetail(id, locale);

  if (!result.ok && result.notFound) {
    return {
      title: notFoundT("title"),
      description: notFoundT("description"),
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
    throw new Error(result.message || "Failed to load car detail metadata");
  }

  const response = result.data;
  const car = response?.data;
  const meta = response?.meta;

  if (!car) {
    throw new Error("Car data is missing in successful response");
  }

  const siteUrl = getSiteUrl();
  const storageUrl = getStorageUrl();

  const dynamicTitle = buildCarDisplayTitle(car, locale, carDetailT);

  const title = meta?.titleSeo?.trim() || dynamicTitle;
  const description =
    meta?.descriptionSeo?.trim() ||
    carDetailT("carDetail.dynamicDescription", {
      car: String(car?.title ?? "").trim(),
      branch: String(car?.branch ?? "").trim(),
    });

  const normalizedMetaKeywords = normalizeKeywords((meta as any)?.keywordsSeo);

  const image = meta?.imgSeo
    ? joinUrl(storageUrl, meta.imgSeo)
    : Array.isArray(car?.photos) && car.photos.length > 0
      ? joinUrl(storageUrl, car.photos[0])
      : "";

  const canonical =
    meta?.canonical?.trim() ||
    meta?.urlPage?.trim() ||
    `${siteUrl}/${locale}/cars/${id}`;

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
          if (item?.hreflang && item?.href) {
            acc[item.hreflang] = item.href;
          }
          return acc;
        }, {})
      : undefined;

  return {
    title,
    description,
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
      siteName: meta?.siteName || "Palm Rent",
      locale: getLocaleOg(locale),
      ...(image
        ? {
            images: [
              {
                url: image,
                width: 1200,
                height: 630,
                alt: dynamicTitle || car?.title || "",
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
  };
}

export default async function CarRentalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations();

  const result = await getCarDetail(id, locale);

  if (!result.ok && result.notFound) {
    notFound();
  }

  if (!result.ok) {
    throw new Error(result.message || "Failed to load car detail");
  }

  const response = result.data;
  const car = response?.data;
  const meta = response?.meta;

  if (!car) {
    throw new Error("Car data is missing in successful response");
  }

  const features = buildFeaturesFromApi(car, t).filter((f) => f.active);
  const displayTitle = buildCarDisplayTitle(car, locale, t);

  return (
    <div className="bg-white">
      {meta?.schemaSeo ? (
        <Script
          id="car-schema-seo"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: meta.schemaSeo }}
        />
      ) : null}

      <Header shadowLess={true} />

      <Script id="pricing-sticky-top" strategy="afterInteractive">{`
        (function () {
          var DOWN_TOP = 4;
          var UP_TOP = 80;

          document.documentElement.style.setProperty('--pricing-top', DOWN_TOP + 'px');

          var lastY = window.scrollY || 0;
          var ticking = false;

          function headerVisible() {
            var el = document.getElementById('site-fixed-header');
            if (!el) return false;
            var r = el.getBoundingClientRect();
            return r.bottom > 0;
          }

          function update() {
            ticking = false;
            var y = window.scrollY || 0;
            var goingUp = y < lastY;
            var nextTop = (goingUp || headerVisible()) ? UP_TOP : DOWN_TOP;
            document.documentElement.style.setProperty('--pricing-top', nextTop + 'px');
            lastY = y;
          }

          function onScroll() {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(update);
          }

          window.addEventListener('scroll', onScroll, { passive: true });
          window.addEventListener('resize', onScroll);
          onScroll();
        })();
      `}</Script>

      <main className="mx-auto mt-2 max-w-7xl px-2 md:px-0">
<ImageGallery media={[car.video, ...(car.photos ?? [])]} carTitle={displayTitle} />

        <div className="mt-2 rounded-xl px-4 py-2 md:hidden">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">{displayTitle}</h1>

            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1 text-sm text-blue-600 transition-colors hover:text-blue-700">
                <Share2 className="h-4 w-4 text-accent-foreground md:text-blue-600" />
                <span className="hidden md:block">{t("carDetail.share")}</span>
              </button>

              <button className="flex items-center gap-1 text-sm text-blue-600 transition-colors hover:text-blue-700">
                <Heart className="h-4 w-4 text-accent-foreground md:text-blue-600" />
                <span className="hidden md:block">
                  {t("carDetail.favorite")}
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-2 md:flex-row">
            <div className="flex flex-wrap items-center gap-4 pb-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Car className="h-4 w-4" />
                <span>{car.gearbox}</span>
              </div>

              <div className="flex items-center gap-1">
                <Fuel className="h-4 w-4" />
                <span>{car.fuel}</span>
              </div>

              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>
                  {t("carDetail.persons", {
                    count: Number(car.person ?? 0),
                  })}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                <span>
                  {t("carDetail.baggages", {
                    count: Number(car.baggage ?? 0),
                  })}
                </span>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {features.map((feature, index) => (
                <span
                  key={index}
                  className="rounded-full bg-green-100 px-2 py-1 text-sm text-green-800"
                >
                  {feature.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 lg:hidden">
          <PricingCard
            car={car}
            dailyPrice={car.daily_price}
            deposit={car.deposit}
            currency={car.currency}
            offPercent={car.off_percent}
            whatsapp={car.whatsapp}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:mt-4 lg:grid-cols-3">
          <div className="order-1 hidden lg:order-2 lg:col-span-1 lg:block">
            <div
              className="sticky z-10 self-start transition-[top] duration-300 ease-out"
              style={{ top: "var(--pricing-top, 4px)" }}
            >
              <PricingCard
                car={car}
                dailyPrice={car.daily_price}
                deposit={car.deposit}
                currency={car.currency}
                offPercent={car.off_percent}
                whatsapp={car.whatsapp}
              />
            </div>
          </div>

          <div className="order-2 space-y-2 lg:order-1 lg:col-span-2">
            <div className="hidden rounded-xl px-4 py-2 md:block">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-xl font-bold text-gray-900">
                  {displayTitle}
                </div>

                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1 text-sm text-blue-600 transition-colors hover:text-blue-700">
                    <Share2 className="h-4 w-4 text-accent-foreground md:text-blue-600" />
                    <span className="hidden md:block">{t("carDetail.share")}</span>
                  </button>

                  <button className="flex items-center gap-1 text-sm text-blue-600 transition-colors hover:text-blue-700">
                    <Heart className="h-4 w-4 text-accent-foreground md:text-blue-600" />
                    <span className="hidden md:block">
                      {t("carDetail.favorite")}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-2 md:flex-row">
                <div className="flex flex-wrap items-center gap-4 pb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Car className="h-4 w-4" />
                    <span>{car.gearbox}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Fuel className="h-4 w-4" />
                    <span>{car.fuel}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {t("carDetail.persons", {
                        count: Number(car.person ?? 0),
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    <span>
                      {t("carDetail.baggages", {
                        count: Number(car.baggage ?? 0),
                      })}
                    </span>
                  </div>
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                  {features.map((feature, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-green-100 px-2 py-1 text-sm text-green-800"
                    >
                      {feature.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <RequiredDocuments branch={car.branch} />
            <TechnicalSpecs car={car} />
            <CarFeatures car={car} />

            {Array.isArray(car.faqs) && car.faqs.length > 0 ? (
              <div className="mt-6">
                <FAQcardetail faqs={car.faqs} />
              </div>
            ) : null}

            <SimilarCars items={car.similar_cars} currency={car.currency} />
            <CarDescription html={car.text} />
          </div>
        </div>
      </main>

      <Footer />

      <MobilePriceBar
        car={car}
        dailyPrice={car.daily_price}
        currency={car.currency}
        offPercent={car.off_percent}
      />
    </div>
  );
}