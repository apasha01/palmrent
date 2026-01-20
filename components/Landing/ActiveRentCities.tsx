"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpLeftIcon } from "lucide-react";

import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

type City = {
  id: number | string;
  title: string;
  slug: string; // ✅ فقط همین مهمه
};

type ActiveRentCitiesProps = {
  cities?: City[];
  isLoading?: boolean;
};

/* ---------------- Skeletons ---------------- */

function CitiesSkeleton() {
  return (
    <div className="w-full flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
      {/* دکمه‌های شهر */}
      <div className="w-full flex flex-col md:flex-row gap-3 md:flex-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="
              w-full md:flex-1
              h-12 md:h-14
              rounded-md border
              flex items-center justify-between
              px-4
            "
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
        ))}
      </div>

      {/* مشاهده همه – دسکتاپ */}
      <div className="hidden md:flex h-14 px-6 items-center gap-3 rounded-md border">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>

      {/* مشاهده همه – موبایل */}
      <div className="md:hidden w-full h-14 mt-2 rounded-md border flex items-center justify-between px-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
    </div>
  );
}

/* ---------------- Component ---------------- */

const ActiveRentCities = ({ cities, isLoading }: ActiveRentCitiesProps) => {
  const loading = Boolean(isLoading || !cities);
  const visibleCities = (cities ?? []).slice(0, 3);

  return (
    <div className="w-full px-2 md:px-0">
      {/* Header */}
      <div className="flex flex-col">
        <p className="font-bold md:text-2xl text-xl">
          شهرهای فعال پالم رنت برای اجاره خودرو
        </p>
        <p className="text-xs mt-2 text-gray-600">
          شهر را انتخاب کنید تا خودروهای موجود و شرایط رزرو در همان شهر نمایش داده شود.
        </p>
      </div>

      <div className="mt-6 w-full">
        {/* ---------- Loading ---------- */}
        {loading ? (
          <CitiesSkeleton />
        ) : (
          <div className="w-full flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            {/* ---------- Cities ---------- */}
            <div className="w-full flex flex-col md:flex-row gap-3 md:flex-1">
              {visibleCities.map((city) => {
                const href = city.slug
                  ? `/cars-rent/${city.slug}`
                  : undefined;

                return href ? (
                  <Link
                    key={city.id}
                    href={href}
                    className="w-full md:flex-1"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="
                        w-full
                        md:flex-1
                        h-12 md:h-14
                        flex items-center justify-between
                        text-sm md:text-base
                      "
                    >
                      <span>{city.title}</span>
                      <ArrowUpLeftIcon className="size-5" />
                    </Button>
                  </Link>
                ) : (
                  // اگر slug نداشت (ایمنی)
                  <Button
                    key={city.id}
                    type="button"
                    variant="outline"
                    size="lg"
                    disabled
                    className="
                      w-full
                      md:flex-1
                      h-12 md:h-14
                      flex items-center justify-between
                      text-sm md:text-base
                      opacity-50
                    "
                  >
                    <span>{city.title}</span>
                    <ArrowUpLeftIcon className="size-5" />
                  </Button>
                );
              })}
            </div>

            {/* ---------- View All (Desktop) ---------- */}
            <Link href="/cars-rent">
              <Button
                size="lg"
                type="button"
                variant="outline-primary"
                className="hidden md:inline-flex h-14 px-6 shrink-0"
              >
                مشاهده همه شهرهای اجاره خودرو
                <ArrowUpLeftIcon className="size-5" />
              </Button>
            </Link>

            {/* ---------- View All (Mobile) ---------- */}
            <Link href="/cars-rent" className="md:hidden w-full">
              <Button
                type="button"
                size="lg"
                variant="outline-primary"
                className="w-full h-14 mt-2"
              >
                مشاهده همه شهرهای اجاره خودرو
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
