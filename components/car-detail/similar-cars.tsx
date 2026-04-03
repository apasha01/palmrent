/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import {
  Car,
  Fuel,
  Users,
  Briefcase,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { STORAGE_URL } from "@/lib/apiClient";
import { useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  items: any[];
  currency?: string;
};

type CarImageProps = {
  src: string;
  alt: string;
};

function CarImageWithSkeleton({ src, alt }: CarImageProps) {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const finalSrc = hasError ? "/images/placeholder.png" : src;

  return (
    <div className="relative h-56 overflow-hidden rounded-t-xl bg-gray-100">
      {!loaded && (
        <Skeleton className="absolute inset-0 z-10 h-full w-full rounded-none" />
      )}

      <Image
        src={finalSrc || "/images/placeholder.png"}
        alt={alt}
        fill
        className={`object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        sizes="(max-width: 768px) 88vw, (max-width: 1280px) 360px, 380px"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!hasError) {
            setHasError(true);
            setLoaded(false);
          } else {
            setLoaded(true);
          }
        }}
      />
    </div>
  );
}

export function SimilarCars({ items = [], currency = "درهم" }: Props) {
  const t = useTranslations("similarCars");
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const safeItems = Array.isArray(items) ? items : [];
  if (safeItems.length === 0) return null;

  const toNum = (v: any): number | null => {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "number") return Number.isFinite(v) ? v : null;

    const raw = String(v).replaceAll(",", "").trim();
    if (!raw) return null;

    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  const formatNumFa = (n: number | null) => {
    if (n === null) return null;
    return new Intl.NumberFormat("fa-IR").format(Math.round(n));
  };

  const buildImageUrl = (path?: string | null) => {
    if (!path || !String(path).trim()) {
      return "/images/placeholder.png";
    }

    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const base = String(STORAGE_URL || "").replace(/\/+$/, "");
    const cleanPath = String(path).replace(/^\/+/, "");

    if (!base) {
      return `/${cleanPath}`;
    }

    return `${base}/${cleanPath}`;
  };

  const getImagePath = (car: any): string | null => {
    if (Array.isArray(car?.photo) && car.photo.length > 0) {
      const first = car.photo.find(
        (item: any) => typeof item === "string" && item.trim()
      );
      if (first) return first;
    }

    if (typeof car?.photo === "string" && car.photo.trim()) {
      return car.photo;
    }

    if (Array.isArray(car?.photos) && car.photos.length > 0) {
      const first = car.photos.find(
        (item: any) => typeof item === "string" && item.trim()
      );
      if (first) return first;
    }

    if (typeof car?.image === "string" && car.image.trim()) {
      return car.image;
    }

    return null;
  };

  const firstRangeLabel = (prices: any): string => {
    if (Array.isArray(prices) && prices.length > 0) {
      const p0 = prices[0];

      if (typeof p0?.range === "string" && p0.range.trim()) {
        return p0.range.trim();
      }

      if (String(p0?.type) === "price_1") {
        return t("defaultRange");
      }
    }

    return t("defaultRange");
  };

  const scrollByAmount = (direction: "left" | "right") => {
    const el = sliderRef.current;
    if (!el) return;

    const amount = Math.min(420, Math.max(300, Math.floor(el.clientWidth * 0.5)));

    el.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth",
    });
  };

  const mapped = safeItems.map((c: any) => {
    const seats =
      toNum(c?.person) ?? toNum(c?.passengers) ?? toNum(c?.seats) ?? 0;

    const luggage =
      toNum(c?.baggage) ?? toNum(c?.luggage) ?? toNum(c?.suitcase) ?? 0;

    const finalPrice =
      toNum(c?.final_price) ?? toNum(c?.price_off) ?? toNum(c?.price) ?? null;

    const originalPrice =
      toNum(c?.rent_price) ??
      toNum(c?.base_price) ??
      toNum(c?.originalPrice) ??
      null;

    const image = buildImageUrl(getImagePath(c));

    const features: string[] = [];
    if (String(c?.deposit) === "no") features.push(t("features.noDeposit"));
    if (String(c?.free_delivery) === "yes") {
      features.push(t("features.freeDelivery"));
    }
    if (String(c?.km) === "yes") features.push(t("features.unlimitedKm"));
    if (String(c?.insurance) === "yes") features.push(t("features.insurance"));

    const range = firstRangeLabel(c?.prices);

    return {
      id: c?.id,
      name: c?.title ?? "—",
      image,
      transmission: c?.gearbox ?? c?.transmission ?? "—",
      fuel: c?.fuel ?? "—",
      seats,
      luggage,
      features,
      price: finalPrice,
      originalPrice,
      off: toNum(c?.off_percent) ?? toNum(c?.off) ?? 0,
      period: t("priceStartFrom", { range }),
    };
  });

  return (
    <div className="rounded-xl p-2">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900">{t("title")}</h2>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => scrollByAmount("right")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => scrollByAmount("left")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={sliderRef}
        className="
          flex gap-4 overflow-x-auto pb-2 scroll-smooth
          [scrollbar-width:none]
          [-ms-overflow-style:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        {mapped.map((car, index) => {
          const href = car?.id ? `/cars/${car.id}` : "#";

          return (
            <Link
              key={car.id ?? index}
              href={href}
              aria-disabled={!car?.id}
              className="
                block shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white
                transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
                w-[86vw]
                sm:w-[72vw]
                md:w-[340px]
                lg:w-[360px]
                xl:w-[380px]
              "
              onClick={(e) => {
                if (!car?.id) e.preventDefault();
              }}
            >
              <CarImageWithSkeleton src={car.image} alt={car.name} />

              <div className="p-4">
                <h3 className="mb-2 line-clamp-1 text-base font-bold text-gray-900">
                  {car.name}
                </h3>

                <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Car className="h-3.5 w-3.5" />
                    <span>{car.transmission}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Fuel className="h-3.5 w-3.5" />
                    <span>{car.fuel}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>
                      {formatNumFa(car.seats) ?? "۰"}{" "}
                      {t("persons", { count: "" }).replace("{count} ", "")}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>
                      {formatNumFa(car.luggage) ?? "۰"}{" "}
                      {t("baggages", { count: "" }).replace("{count} ", "")}
                    </span>
                  </div>
                </div>

                {car.features.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {car.features.map((feature: string, i: number) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs text-green-600"
                      >
                        {feature}
                        <Info className="h-3 w-3" />
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-xs text-gray-500">{car.period}</span>

                  <div className="flex items-center gap-2">
                    {car.originalPrice !== null &&
                      car.price !== null &&
                      car.originalPrice > car.price && (
                        <span className="text-sm text-gray-400 line-through">
                          {formatNumFa(car.originalPrice)}
                        </span>
                      )}

                    {car.price !== null ? (
                      <span className="text-base font-bold text-blue-600">
                        {formatNumFa(car.price)} {currency}
                      </span>
                    ) : (
                      <span className="font-bold text-gray-400">
                        {t("contactUs")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}