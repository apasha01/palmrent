/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";

import { useSelector } from "react-redux";
import { Button } from "../ui/button";
import { useLocale } from "next-intl";
import { useHubCarsOnly } from "@/services/hub-cars/hub-cars.queries";
import { Link } from "@/i18n/navigation";
import BranchCarCard from "../card/CardCardBranch";
import type { Range } from "@/components/custom/calender/date-range-picker";
import { SITE_HEADER_HEIGHT } from "@/components/layouts/Header";

import { useQueryClient } from "@tanstack/react-query";
import { getHubCarsOnly } from "@/services/hub-cars/hub-cars.api";

type BranchItem = {
  id: number;
  slug: string;
  title: string;
};

type BranchCarsProps = {
  branches?: BranchItem[];
  isLoading?: boolean;
};

const EMPTY_RANGE: Range = { start: null, end: null };

function BranchCarCardSkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#0000001f] bg-white p-2.5 shadow-[0_2px_5px_-1px_rgba(0,0,0,.08)]">
      <div className="h-55 w-full animate-pulse rounded-lg bg-gray-200" />

      <div className="mt-3 flex flex-col pl-2.5">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-7 w-28 animate-pulse rounded-md bg-gray-200" />
          <div className="h-7 w-7 animate-pulse rounded-full bg-gray-200" />
        </div>

        <div className="mb-3 grid grid-cols-4 gap-2 border-y p-2">
          <div className="h-4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 animate-pulse rounded bg-gray-200" />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <div className="h-6 w-24 animate-pulse rounded-full bg-gray-200" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
          <div className="h-6 w-28 animate-pulse rounded-full bg-gray-200" />
        </div>

        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="h-10 w-24 animate-pulse rounded-xl bg-gray-200" />
          <div className="h-10 flex-1 animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

const BranchCars = ({ branches }: BranchCarsProps) => {
  const locale = useLocale();
  const sliderRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  const [activeCity, setActiveCity] = useState<string>("");
  const [tabsHeight, setTabsHeight] = useState(0);
  const [isPinned, setIsPinned] = useState(false);

  const isHeaderClose = useSelector((state: any) => state.global.isHeaderClose);

  const tabsTop = isHeaderClose ? 0 : SITE_HEADER_HEIGHT;

  useEffect(() => {
    if (!activeCity && branches?.length) {
      setActiveCity(branches[0].slug);
    }
  }, [branches, activeCity]);

  const activeBranchId = useMemo(() => {
    return branches?.find((b) => b.slug === activeCity)?.id ?? "";
  }, [branches, activeCity]);

  const { data: carsData, isLoading, isFetching } = useHubCarsOnly(
    activeBranchId,
    locale,
    { page: 1 },
  );

  const cars = carsData?.cars ?? [];
  const currency = carsData?.currency ?? "";
  const rateToRial = carsData?.rate_to_rial ?? null;

  const [sharedCalendar, setSharedCalendar] = useState({
    range: EMPTY_RANGE,
    deliveryTime: "10:00",
    returnTime: "10:00",
  });

  const onSharedCalendarChange = useCallback((v: any) => {
    setSharedCalendar(v);
  }, []);

  const activeCityName =
    branches?.find((c) => c.slug === activeCity)?.title ?? "";

  const showSkeleton = isLoading || isFetching;

  const viewAllHref = `/cars-rent/${activeCity}`;

  useLayoutEffect(() => {
    if (!tabsRef.current) return;
    setTabsHeight(tabsRef.current.offsetHeight);
  }, [branches]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPinned(!entry.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!branches?.length) return;

    let index = 1;

    const runPrefetch = async () => {
      while (index < branches.length) {
        const branch = branches[index];

        await queryClient.prefetchQuery({
          queryKey: ["hubCars", branch.id, locale],
          queryFn: () =>
            getHubCarsOnly(branch.id, locale, {
              page: 1,
            }),
          staleTime: Infinity,
        });

        index++;

        await new Promise((r) => setTimeout(r, 900));
      }
    };

    runPrefetch();
  }, [branches, locale, queryClient]);

  const handleTabClick = (slug: string) => {
    setActiveCity(slug);

    if (!sentinelRef.current) return;

    const y =
      sentinelRef.current.getBoundingClientRect().top +
      window.scrollY -
      tabsTop -
      8;

    window.scrollTo({
      top: y,
      behavior: "smooth",
    });
  };

  const scrollLeft = () => {
    sliderRef.current?.scrollBy({
      left: -320,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    sliderRef.current?.scrollBy({
      left: 320,
      behavior: "smooth",
    });
  };

  return (
    <div className="w-full px-2 sm:px-0">
      <p className="text-xl font-bold md:text-3xl">
        آغاز سفر با پالم رنت از همین جاست
      </p>

      <p className="mt-2 text-xs md:text-sm">
        اجاره خودرو بدون ودیعه و پرداخت در محل برای یک تجربه راحت و مطمئن
      </p>

      <div ref={sentinelRef} className="mt-6 h-px w-full" />

      {isPinned && <div style={{ height: tabsHeight }} />}

      <div
        ref={tabsRef}
        className={
          isPinned
            ? "fixed left-0 right-0 z-40 bg-white transition-[top] duration-500 dark:bg-gray-950"
            : "relative"
        }
        style={isPinned ? { top: tabsTop } : undefined}
      >
        <div className="mx-auto max-w-7xl border-b border-gray-200 py-2 dark:border-gray-800">
          <div className="flex items-center justify-between gap-3 px-2 sm:px-0">
            <div className="scrollbar-none flex-1 overflow-x-auto overflow-y-hidden whitespace-nowrap">
              <div className="inline-flex gap-1 pr-1">
                {branches?.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => handleTabClick(city.slug)}
                    className={`relative shrink-0 cursor-pointer px-4 py-2 text-sm font-medium md:px-6 ${
                      activeCity === city.slug
                        ? "text-sky-500"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {city.title}

                    {activeCity === city.slug && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden gap-2 md:flex">
              <Button variant="outline" size="icon" onClick={scrollRight}>
                <ChevronRight className="h-5 w-5" />
              </Button>

              <Button variant="outline" size="icon" onClick={scrollLeft}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={sliderRef}
        className="scrollbar-none mb-2 flex gap-2 overflow-x-auto overflow-y-hidden pb-2 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {showSkeleton ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-[calc(100vw-32px)] shrink-0 snap-start sm:w-87.5 md:w-95"
            >
              <BranchCarCardSkeleton />
            </div>
          ))
        ) : cars.length === 0 ? (
          <div className="flex w-full justify-center">
            <p className="text-sm text-gray-500">خودرویی نیست</p>
          </div>
        ) : (
          cars.map((car: any) => (
            <div
              key={car.id}
              className="w-[calc(100vw-32px)] shrink-0 snap-start sm:w-87.5 md:w-95"
            >
              <BranchCarCard
                data={car}
                currency={currency}
                rateToRial={rateToRial}
                branchId={Number(activeBranchId) || null}
                sharedCalendar={sharedCalendar}
                onSharedCalendarChange={onSharedCalendarChange}
                calendarHydrated={true}
              />
            </div>
          ))
        )}
      </div>

      <div className="flex justify-center px-2 md:px-0">
        <Link href={viewAllHref} className="w-full md:w-auto">
          <Button
            variant="outline-primary"
            size="lg"
            className="w-full md:w-auto md:px-12 md:py-3  border border-[#0077db] text-[#0077db] bg-transparent hover:bg-[#0077db]/10 hover:text-[#0077db] text-base md:text-lg font-medium shadow-none"
          >
            مشاهده همه خودروهای {activeCityName}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default BranchCars;