/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../ui/button";
import { useLocale } from "next-intl";
import { useHubCarsOnly } from "@/services/hub-cars/hub-cars.queries";
import SingleCar from "../card/CarsCard";
import { Card, CardContent } from "../ui/card";
import Link from "next/link";

type BranchItem = {
  id: number;
  slug: string;
  title: string;
};

type BranchCarsProps = {
  branches?: BranchItem[];
  isLoading?: boolean;
};

const BranchCars = ({ branches }: BranchCarsProps) => {
  const locale = useLocale();
  const sliderRef = useRef<HTMLDivElement>(null);

  // ✅ activeCity = slug
  const [activeCity, setActiveCity] = useState<string>("");

  useEffect(() => {
    if (!activeCity && branches && branches.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveCity(branches[0].slug);
    }
  }, [branches, activeCity]);

  // ✅ برای گرفتن ماشین‌ها هنوز id لازم داری
  const activeBranchId = useMemo(() => {
    return (branches ?? []).find((b) => b.slug === activeCity)?.id ?? "";
  }, [branches, activeCity]);

  const { data: carsData, isLoading: carsLoading, isFetching } = useHubCarsOnly(
    activeBranchId,
    locale,
    { page: 1 }
  );

  const cars = carsData?.cars ?? [];

  const currency = carsData?.currency ?? "";
  const rateToRial = carsData?.rate_to_rial ?? null;

  const scrollLeft = () => {
    if (sliderRef.current) sliderRef.current.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    if (sliderRef.current) sliderRef.current.scrollBy({ left: 300, behavior: "smooth" });
  };

  const activeCityName =
    (branches ?? []).find((c) => c.slug === activeCity)?.title ?? "";

  const showSkeleton = carsLoading || isFetching;

  // ✅✅✅ لینک مشاهده همه: با slug ساخته شود
  // اگر روت شما locale دارد (مثل /fa/cars-rent/dubai) این را استفاده کن:
  const viewAllHref = `/${locale}/cars-rent/${activeCity}`;

  // اگر روت شما locale ندارد و فقط /cars-rent/dubai است، این را استفاده کن:
  // const viewAllHref = `/cars-rent/${activeCity}`;

  return (
    <div className="w-full px-2 sm:px-0">
      <p className="text-xl md:text-3xl font-bold">
        آغاز سفر با پالم رنت از همین جاست
      </p>

      <p className="mt-2 text-xs md:text-sm">
        اجاره خودرو بدون ودیعه و پرداخت در محل, برای یک تجربه راحت و مطمن
      </p>

      {/* Navigation Row */}
      <div className="flex items-center justify-between mt-6 mb-8 min-w-0">
        <div className="min-w-0">
          <div
            className="overflow-x-auto whitespace-nowrap scrollbar-hide max-w-full min-w-0"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="relative inline-flex w-fit">
              <div className="hidden md:block absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200" />

              <div className="inline-flex gap-1 pr-1">
                {(branches ?? []).map((city) => (
                  <button
                    type="button"
                    key={city.id}
                    onClick={() => setActiveCity(city.slug)}
                    className={`px-6 py-2 text-sm font-medium transition-colors relative shrink-0 ${
                      activeCity === city.slug
                        ? "text-sky-500"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {city.title}
                    {activeCity === city.slug && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:flex gap-2 shrink-0">
          <Button size="icon" type="button" variant="outline" onClick={scrollRight}>
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </Button>
          <Button variant="outline" size="icon" type="button" onClick={scrollLeft}>
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </Button>
        </div>
      </div>

      {/* Cars Slider */}
      <div
        ref={sliderRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide mb-8 pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {showSkeleton ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shrink-0 w-[330px] sm:w-[360px] md:w-[380px]">
              <Card className="flex w-full flex-col rounded-2xl border border-[#0000001f] shadow-[0_2px_5px_-1px_rgba(0,0,0,.08)] bg-white dark:bg-gray-900 dark:border-gray-700 xs:p-0 max-sm:p-2 md:p-2 h-full">
                <CardContent className="p-0 px-1 m-0">
                  <div className="relative w-full overflow-hidden rounded-none md:rounded-lg">
                    <div className="md:hidden w-full h-[230px] bg-gray-200 dark:bg-gray-800 animate-pulse rounded-xl" />
                    <div className="hidden md:block w-full aspect-[16/10] bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
                  </div>

                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between mt-1.5 mb-2">
                      <div className="h-5 w-5 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                      <div className="h-6 w-44 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                    </div>

                    <div className="grid grid-cols-4 gap-1 border-y p-2 mt-1 mb-4 dark:border-gray-700">
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                    </div>

                    <div className="flex flex-col gap-2 my-3">
                      <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                      <div className="h-4 w-[92%] bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                      <div className="h-4 w-[85%] bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                    </div>

                    <div className="flex w-full gap-2 mt-1">
                      <div className="h-11 flex-1 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-md" />
                      <div className="h-11 w-28 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-md" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))
        ) : cars.length === 0 ? (
          <div className="w-full flex justify-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">خودرویی نیست</p>
          </div>
        ) : (
          cars.map((car: any) => (
            <div key={car.id} className="shrink-0 w-[330px] sm:w-[360px] md:w-[380px]">
              <SingleCar data={car} currency={currency} rateToRial={rateToRial} />
            </div>
          ))
        )}
      </div>

      {/* View All Button */}
      <div className="flex justify-center">
        <Link href={viewAllHref}>
          <Button
            variant="outline-primary"
            size="lg"
            type="button"
            className="px-6 py-2 border-2 rounded-md font-bold transition-colors"
          >
            مشاهده همه خودروهای {activeCityName}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default BranchCars;
