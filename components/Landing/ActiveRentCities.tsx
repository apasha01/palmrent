"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowUpLeftIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

type City = {
  id: number | string;
  title: string;
  slug: string;
};

type ActiveRentCitiesProps = {
  cities?: City[];
  isLoading?: boolean;
};

/* ---------------- Skeletons ---------------- */
function CitiesSkeleton() {
  return (
    <div className="w-full flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
      <div className="w-full flex flex-col md:flex-row gap-3 md:flex-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="w-full md:flex-1 h-12 md:h-14 rounded-md border flex items-center justify-between px-4"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
        ))}
      </div>

      <div className="hidden md:flex h-14 px-6 items-center gap-3 rounded-md border">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>

      <div className="md:hidden w-full h-14 mt-2 rounded-md border flex items-center justify-between px-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
    </div>
  );
}

/* ---------------- Component ---------------- */
const ActiveRentCities = ({ cities, isLoading }: ActiveRentCitiesProps) => {
  const t = useTranslations("ActiveRentCities");
  const locale = useLocale();

  const loading = Boolean(isLoading || !cities);
  const visibleCities = useMemo(() => (cities ?? []).slice(0, 3), [cities]);

  // ✅ مسیرها با locale
  const carsRentBase = `/${locale}/cars-rent`;

  return (
    <div className="w-full px-2 md:px-0">
      {/* Header */}
      <div className="flex flex-col">
        <p className="font-bold md:text-2xl text-xl">{t("title")}</p>
        <p className="text-xs mt-2 text-gray-600">{t("subtitle")}</p>
      </div>

      <div className="mt-6 w-full">
        {loading ? (
          <CitiesSkeleton />
        ) : (
          <div className="w-full flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            {/* Cities */}
            <div className="w-full flex flex-col md:flex-row gap-3 md:flex-1">
              {visibleCities.map((city) => {
                const href = city.slug ? `${carsRentBase}/${city.slug}` : null;

                return href ? (
                  <Link key={city.id} href={href} className="w-full md:flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="w-full md:flex-1 h-12 md:h-14 flex items-center justify-between text-sm md:text-base"
                      aria-label={t("cityButtonAria", { city: city.title })}
                    >
                      <span>{city.title}</span>
                      <ArrowUpLeftIcon className="size-5" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    key={city.id}
                    type="button"
                    variant="outline"
                    size="lg"
                    disabled
                    className="w-full md:flex-1 h-12 md:h-14 flex items-center justify-between text-sm md:text-base opacity-50"
                    aria-label={t("cityButtonDisabledAria", { city: city.title })}
                  >
                    <span>{city.title}</span>
                    <ArrowUpLeftIcon className="size-5" />
                  </Button>
                );
              })}
            </div>

            {/* View All (Desktop) */}
            <Link href={carsRentBase}>
              <Button
                size="lg"
                type="button"
                variant="outline-primary"
                className="hidden md:inline-flex h-14 px-6 shrink-0"
                aria-label={t("viewAllAria")}
              >
                {t("viewAll")}
                <ArrowUpLeftIcon className="size-5" />
              </Button>
            </Link>

            {/* View All (Mobile) */}
            <Link href={carsRentBase} className="md:hidden w-full">
              <Button
                type="button"
                size="lg"
                variant="outline-primary"
                className="w-full h-12"
                aria-label={t("viewAllAria")}
              >
                {t("viewAll")}
                <ArrowUpLeftIcon className="size-5" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveRentCities;