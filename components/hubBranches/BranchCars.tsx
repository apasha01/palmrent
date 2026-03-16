/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
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
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const afterNormalRef = useRef<HTMLDivElement | null>(null);

  const queryClient = useQueryClient();

  const [activeCity, setActiveCity] = useState<string>("");
  const [stuck, setStuck] = useState(false);
  const [fadeSeq, setFadeSeq] = useState(0);

  const stuckRef = useRef(false);

  const isHeaderClose = useSelector((state: any) => state.global.isHeaderClose);

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

  useEffect(() => {
    if (!branches?.length) return;

    let index = 1;
    let cancelled = false;

    const runPrefetch = async () => {
      while (index < branches.length && !cancelled) {
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

    return () => {
      cancelled = true;
    };
  }, [branches, locale, queryClient]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let raf = 0;
    let cancelled = false;

    const setStuckSafe = (next: boolean) => {
      if (cancelled) return;
      if (next === stuckRef.current) return;

      stuckRef.current = next;
      setStuck(next);

      if (next) {
        setFadeSeq((s) => s + 1);
      }
    };

    const check = () => {
      raf = 0;
      const el = afterNormalRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();

      const ON = isHeaderClose ? 0 : SITE_HEADER_HEIGHT;
      const OFF = ON + 20;

      if (!stuckRef.current) {
        if (rect.top <= ON) setStuckSafe(true);
      } else {
        if (rect.top >= OFF) setStuckSafe(false);
      }
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(check);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isHeaderClose]);

  const handleTabClick = (slug: string) => {
    setActiveCity(slug);

    requestAnimationFrame(() => {
      const normalBlock = afterNormalRef.current?.previousElementSibling as HTMLElement | null;
      if (!normalBlock) return;

      const y =
        normalBlock.getBoundingClientRect().top +
        window.scrollY -
        (isHeaderClose ? 8 : SITE_HEADER_HEIGHT + 8);

      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
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

  useEffect(() => {
    if (!tabsScrollRef.current || !activeCity) return;

    const buttons = tabsScrollRef.current.querySelectorAll<HTMLButtonElement>(
      `[data-city-slug="${activeCity}"]`,
    );

    buttons.forEach((activeButton) => {
      activeButton.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    });
  }, [activeCity, stuck]);

  const headerOffsetClass = isHeaderClose ? "translate-y-0" : "translate-y-16";

  const TabsContent = () => (
    <div className="mx-auto max-w-7xl border-b border-gray-200 bg-white/95 py-2 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/95">
      <div className="flex items-center justify-between gap-3 px-2 sm:px-0">
        <div
          ref={tabsScrollRef}
          className="scrollbar-none flex-1 overflow-x-auto overflow-y-hidden whitespace-nowrap"
        >
          <div className="inline-flex gap-1 pr-1">
            {branches?.map((city) => (
              <button
                key={city.id}
                data-city-slug={city.slug}
                type="button"
                onClick={() => handleTabClick(city.slug)}
                className={`relative shrink-0 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-300 md:px-6 ${
                  activeCity === city.slug
                    ? "text-sky-500"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
  );

  return (
    <>
      <style jsx global>{`
        .branchCarsStickyFade {
          animation: branchCarsStickyFade 200ms ease-out both;
        }

        @keyframes branchCarsStickyFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>

      <section className="w-full">
        <p className="px-4 text-xl font-bold sm:px-0 md:text-3xl">
          آغاز سفر با پالم رنت از همین جاست
        </p>

        <p className="mt-2 px-4 text-xs sm:px-0 md:text-sm">
          اجاره خودرو بدون ودیعه و پرداخت در محل برای یک تجربه راحت و مطمئن
        </p>

        <div className="relative mt-6">
          <div
            className={`transition-opacity duration-150 ease-out ${
              stuck ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            <TabsContent />
            <div ref={afterNormalRef} className="h-px w-full" />
          </div>

          <div className="fixed left-0 right-0 top-0 z-40">
            <div
              className={`transform-gpu will-change-transform transition-transform duration-500 ease-in-out ${headerOffsetClass}`}
            >
              <div
                className={`transform-gpu will-change-opacity transition-opacity duration-150 ease-out ${
                  stuck
                    ? "pointer-events-auto opacity-100"
                    : "pointer-events-none opacity-0"
                }`}
              >
                {stuck && (
                  <div key={fadeSeq} className="branchCarsStickyFade ">
                    <div className="mx-auto w-full max-w-7xl sm:px-0">
                      <TabsContent />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
 
         <div
          ref={sliderRef}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
          className="mb-2 mt-4 flex w-screen snap-x snap-mandatory gap-3 overflow-x-scroll overflow-y-hidden pb-2 pl-4 sm:w-full sm:pl-0 [&::-webkit-scrollbar]:hidden"
        >
          {showSkeleton ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="w-[85vw] shrink-0 snap-start sm:w-[350px] md:w-[380px]"
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
                className="w-[85vw] shrink-0 snap-start sm:w-[350px] md:w-[380px]"
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

        <div className="flex justify-center px-4 sm:px-0 md:px-0">
          <Link href={viewAllHref} className="w-full md:w-auto">
            <Button
              variant="outline-primary"
              size="lg"
              className="w-full border border-[#0077db] bg-transparent text-base font-medium text-[#0077db] shadow-none hover:bg-[#0077db]/10 hover:text-[#0077db] md:w-auto md:px-12 md:py-3 md:text-lg"
            >
              مشاهده همه خودروهای {activeCityName}
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
};

export default BranchCars;
