"use client";

import React, { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation"; 
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { ChevronLeft } from "lucide-react";

type City = {
  id: number | string;
  title: string;
  slug: string;
};

type ActiveRentCitiesProps = {
  cities?: City[];
  isLoading?: boolean;
};

/* ---------------- Shared Styles ---------------- */
const baseBtnClass =
  "w-full h-12 md:h-14 px-4 md:px-5 flex items-center justify-between gap-3 text-sm md:text-base rounded-md";

const outlineNeutral =
  "border border-border text-foreground hover:bg-accent hover:text-accent-foreground";

const outlinePrimary =
  "border border-[#0077db] text-[#0077db] hover:bg-[#3B82F61A] hover:text-[#0077db]";

/* ---------------- Skeletons ---------------- */
function CitiesSkeleton() {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="w-full h-12 md:h-14 rounded-md border border-border flex items-center justify-between px-4 md:px-5"
        >
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* ---------------- Reusable Item ---------------- */
function CityItem({
  href,
  label,
  ariaLabel,
  isPrimary = false,
  disabled = false,
}: {
  href?: string;
  label: string;
  ariaLabel: string;
  isPrimary?: boolean;
  disabled?: boolean;
}) {
  const className = `cursor-pointer ${baseBtnClass} ${isPrimary ? outlinePrimary : outlineNeutral} ${
    disabled ? "opacity-50 pointer-events-none" : ""
  }`;

  // ✅ اگر href داشت => لینک
  if (href && !disabled) {
    return (
      <Link href={href} className="w-full cursor-pointer">
        <Button type="button" variant="ghost" className={className}>
          <span className="truncate">{label}</span>
          <ChevronLeft className="size-5 shrink-0" />
        </Button>
      </Link>
    );
  }

  // ✅ در غیر اینصورت => دکمه غیرفعال
  return (
    <Button type="button" disabled variant="ghost" className={className} aria-label={ariaLabel}>
      <span className="truncate">{label}</span>
      <ChevronLeft className="size-5 shrink-0" />
    </Button>
  );
}

/* ---------------- Component ---------------- */
const ActiveRentCities = ({ cities, isLoading }: ActiveRentCitiesProps) => {
  const t = useTranslations("ActiveRentCities");

  const loading = Boolean(isLoading || !cities);
  const visibleCities = useMemo(() => (cities ?? []).slice(0, 3), [cities]);

  const carsRentBase = `/cars-rent`;

  return (
    <div className="w-full ">
      {/* Header */}
      <div className="flex flex-col">
        <p className="font-bold md:text-2xl text-xl">{t("title")}</p>
        <p className="text-xs mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="mt-6 w-full">
        {loading ? (
          <CitiesSkeleton />
        ) : (
          <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* 3 Cities */}
            {visibleCities.map((city) => {
              const href = city.slug ? `${carsRentBase}/${city.slug}` : undefined;

              return (
                <CityItem
                
                  key={city.id}
                  href={href}
                  label={city.title}
                  ariaLabel={
                    href
                      ? t("cityButtonAria", { city: city.title })
                      : t("cityButtonDisabledAria", { city: city.title })
                  }
                  disabled={!href}
                />
              );
            })}

            {/* View All (same style, only blue border/text) */}
            <CityItem
              href={carsRentBase}
              label={t("viewAll")}
              ariaLabel={t("viewAllAria")}
              isPrimary
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveRentCities;