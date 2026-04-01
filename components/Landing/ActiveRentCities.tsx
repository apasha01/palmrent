import React, { useMemo } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useDIR from "@/hooks/use-rtl";

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
    <div
      className="w-full grid grid-cols-1 md:grid-cols-4 gap-3"
      aria-label="Loading cities"
      aria-busy="true"
    >
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
  direction = false,
}: {
  href?: string;
  label: string;
  ariaLabel: string;
  isPrimary?: boolean;
  disabled?: boolean;
  direction?: boolean;
}) {
  const className = `cursor-pointer ${baseBtnClass} ${
    isPrimary ? outlinePrimary : outlineNeutral
  } ${disabled ? "opacity-50 pointer-events-none" : ""}`;

  const Icon = direction ? ChevronLeft : ChevronRight;

  if (href && !disabled) {
    return (
      <Link href={href} className="w-full cursor-pointer" aria-label={ariaLabel}>
        <Button type="button" variant="ghost" className={className}>
          <span className="truncate">{label}</span>
          <Icon className="size-5 shrink-0" aria-hidden="true" />
        </Button>
      </Link>
    );
  }

  return (
    <Button
      type="button"
      disabled
      variant="ghost"
      className={className}
      aria-label={ariaLabel}
    >
      <span className="truncate">{label}</span>
      <Icon className="size-5 shrink-0" aria-hidden="true" />
    </Button>
  );
}

/* ---------------- Component ---------------- */
const ActiveRentCities = ({ cities, isLoading }: ActiveRentCitiesProps) => {
  const t = useTranslations("ActiveRentCities");
  const { direction } = useDIR();

  const loading = Boolean(isLoading || !cities);
  const visibleCities = useMemo(() => (cities ?? []).slice(0, 3), [cities]);

  const carsRentBase = `/cars-rent`;

  return (
    <section className="w-full" aria-labelledby="active-rent-cities-title">
      {/* Header */}
      <div className="flex flex-col">
        <h2 id="active-rent-cities-title" className="font-bold md:text-2xl text-xl">
          {t("title")}
        </h2>
        <p className="text-xs mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="mt-6 w-full">
        {loading ? (
          <CitiesSkeleton />
        ) : (
          <ul className="w-full grid grid-cols-1 md:grid-cols-4 gap-3" role="list">
            {visibleCities.map((city) => {
              const href = city.slug ? `${carsRentBase}/${city.slug}` : undefined;

              return (
                <li key={city.id}>
                  <CityItem
                    href={href}
                    label={city.title}
                    ariaLabel={
                      href
                        ? t("cityButtonAria", { city: city.title })
                        : t("cityButtonDisabledAria", { city: city.title })
                    }
                    disabled={!href}
                    direction={direction}
                  />
                </li>
              );
            })}

            <li>
              <CityItem
                href={carsRentBase}
                label={t("viewAll")}
                ariaLabel={t("viewAllAria")}
                isPrimary
                direction={direction}
              />
            </li>
          </ul>
        )}
      </div>
    </section>
  );
};

export default ActiveRentCities;