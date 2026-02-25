/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

import SearchHeader from "@/components/search/search-header";
import Footer from "@/components/Footer";
import Header from "@/components/layouts/Header";
import SearchFilterSheet from "@/components/search/SearchFilterSheet";
import SearchPopup from "@/components/SearchPopup";
import StepRent from "@/components/search/StepsRent";
import DescriptionPopup from "@/components/DescriptionPopup";
import ReserveInformation from "@/components/reserve/ReserveInformation";
import { SerarchSection } from "@/components/search/SearchSection";
import SingleCar from "@/components/card/CarsCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Info, RefreshCcw } from "lucide-react";
import { useInfiniteCarFilter } from "@/services/car-filter/car-filter.hooks";
import type { CarFilterParams } from "@/services/car-filter/car-filter.types";
import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store";
import { calcRentDaysWithGrace, normalizeTime } from "@/lib/rent-days";
import jalaali from "jalaali-js";
import SearchMetaClient from "@/services/seo/SearchMetaClient";
import { getBranchNameById } from "@/helpers/BranchNameHelper";
import { useMobileSheet } from "@/providers/mobile-sheet-provider";
import { SheetClose } from "@/components/ui/sheet";
import { useSearchParams } from "next/navigation";

const MOBILE_BREAKPOINT = 768;

function toQueryObject(params: URLSearchParams): Record<string, string> {
  const obj: Record<string, string> = {};
  params.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

function useHeaderOffsetPx(defaultPx = 64) {
  const [offset, setOffset] = useState(defaultPx);

  useEffect(() => {
    let raf = 0;

    const getHeaderEl = () =>
      document.getElementById("site-fixed-header") as HTMLElement | null;

    const measure = () => {
      const el = getHeaderEl();
      if (!el) {
        setOffset(defaultPx);
        return;
      }
      const rect = el.getBoundingClientRect();
      const next = Math.max(0, Math.round(rect.bottom));
      setOffset((prev) => (prev === next ? prev : next));
    };

    const onUpdate = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onUpdate, { passive: true });
    window.addEventListener("resize", onUpdate);

    const el = getHeaderEl();
    const ro = el ? new ResizeObserver(onUpdate) : null;
    if (el && ro) ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onUpdate);
      window.removeEventListener("resize", onUpdate);
      if (ro) ro.disconnect();
    };
  }, [defaultPx]);

  return offset;
}

function SkeletonCarCard() {
  return (
    <div className="w-full">
      <div className="rounded-2xl border border-border bg-card p-0 md:p-2.5 h-full overflow-hidden">
        <Skeleton className="w-full aspect-16/10 md:rounded-lg rounded-none bg-gray-200/80 dark:bg-white/10" />
        <div className="pt-3 flex flex-col gap-2 px-2 md:px-0">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-5 w-2/3 rounded-md bg-gray-200/80 dark:bg-white/10" />
            <Skeleton className="h-5 w-5 rounded-md bg-gray-200/80 dark:bg-white/10" />
          </div>
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border">
            <Skeleton className="h-4 rounded-md bg-gray-200/80 dark:bg-white/10" />
            <Skeleton className="h-4 rounded-md bg-gray-200/80 dark:bg-white/10" />
            <Skeleton className="h-4 rounded-md bg-gray-200/80 dark:bg-white/10" />
            <Skeleton className="h-4 rounded-md bg-gray-200/80 dark:bg-white/10" />
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <Skeleton className="h-4 w-1/2 rounded-md bg-gray-200/80 dark:bg-white/10" />
            <div className="flex flex-col items-end gap-1">
              <Skeleton className="h-3 w-16 rounded-md bg-gray-200/80 dark:bg-white/10" />
              <Skeleton className="h-5 w-24 rounded-md bg-gray-200/80 dark:bg-white/10" />
            </div>
          </div>
          <div className="flex gap-2 mt-1 pb-2">
            <Skeleton className="h-10 flex-1 rounded-xl bg-gray-200/80 dark:bg-white/10" />
            <Skeleton className="h-10 w-12 rounded-xl bg-gray-200/80 dark:bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchResultPageContent() {
  const tGlobal = useTranslations();
  const t = useTranslations("SearchResultPage");
  const tBranches = useTranslations("branches");
  const tReserve = useTranslations("global");

  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { openSheet } = useMobileSheet();

  // =========================================================
  // ✅ URL<->Store بدون loop
  // =========================================================
  const freezeUrlSyncRef = useRef(false);
  const lastPushedRef = useRef<string>("");
  const sheetOpenedRef = useRef(false);

  // =========================================================
  // ✅ isMobile
  // =========================================================
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth < MOBILE_BREAKPOINT;
    return false;
  });

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update as any);
  }, []);

  // =========================================================
  // ✅ Zustand
  // =========================================================
  const {
    setRoadMapStep,
    isSearchOpen,
    isFilterOpen,
    carDates,
    setCarDates,
    deliveryTime,
    setDeliveryTime,
    returnTime,
    setReturnTime,

    sort,
    setSort,
    search_title,
    setSearchTitle,

    selectedCategories,
    setSelectedCategories,
    selectedPriceRange,
    setSelectedPriceRange,

    selectedCarId,
    setSelectedCarId,

    descriptionPopup,

    carList,
    addCarList,
    clearCarList,

    setIsAnySheetOpen,

    setBranchId,
  } = useSearchPageStore();

  // ✅ شروع صفحه: شیت بسته
  useEffect(() => {
    setIsAnySheetOpen(false);
    return () => setIsAnySheetOpen(false);
  }, [setIsAnySheetOpen]);

  // =========================================================
  // ✅ Header offset
  // =========================================================
  const topOffset = useHeaderOffsetPx(64);
  const marginTop = Math.max(0, topOffset);

  // ========= branch_id فقط از URL =========
  const branchIdFromUrl = useMemo(() => {
    const raw = searchParams.get("branch_id");
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }, [searchParams]);

  const branchName = useMemo(() => {
    const id = searchParams.get("branch_id");
    return getBranchNameById(tBranches, id, "");
  }, [searchParams, tBranches]);

  // =========================================================
  // ✅ Sticky sentinel
  // =========================================================
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);
  const [playFade, setPlayFade] = useState(false);
  const stuckRef = useRef(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        const nowStuck = !entry.isIntersecting;
        if (nowStuck === stuckRef.current) return;

        stuckRef.current = nowStuck;
        setStuck(nowStuck);

        if (nowStuck) {
          setPlayFade(false);
          requestAnimationFrame(() => setPlayFade(true));
        } else {
          setPlayFade(false);
        }
      },
      { threshold: 0, rootMargin: `-${marginTop}px 0px 0px 0px` },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [marginTop]);

  // =========================================================
  // ✅ syncFromUrl (URL -> store) فقط با تغییر URL
  // =========================================================
  const sp = searchParams.toString();

  useEffect(() => {
    if (freezeUrlSyncRef.current) return;
    if (sp === lastPushedRef.current) return;

    const stepParam = searchParams.get("step");
    const stepNum = stepParam ? Number(stepParam) : NaN;
    const safeStep = Number.isFinite(stepNum) && stepNum > 0 ? Math.min(4, stepNum) : 1;
    const isReserveMode = safeStep >= 3;

    const fromQ = searchParams.get("from");
    const toQ = searchParams.get("to");
    const dtRaw = searchParams.get("dt");
    const rtRaw = searchParams.get("rt");

    const dt = dtRaw ? normalizeTime(dtRaw) : null;
    const rt = rtRaw ? normalizeTime(rtRaw) : null;

    const cats = searchParams.get("categories");
    const sortParam = searchParams.get("sort");
    const searchTitleParam = searchParams.get("search_title");
    const minP = searchParams.get("min_p");
    const maxP = searchParams.get("max_p");

    if (fromQ && toQ) setCarDates([fromQ, toQ]);

    if (dtRaw) setDeliveryTime(dt);
    if (rtRaw) setReturnTime(rt);

    if (cats) {
      const parsed = cats
        .split(",")
        .map(Number)
        .filter((n) => Number.isFinite(n) && n > 0);
      setSelectedCategories(parsed);
    } else {
      setSelectedCategories([]);
    }

    setSort(sortParam ?? null);
    setSearchTitle(searchTitleParam ?? "");

    if (minP && maxP) {
      const a = Number(minP);
      const b = Number(maxP);
      if (Number.isFinite(a) && Number.isFinite(b)) {
        setSelectedPriceRange([Math.min(a, b), Math.max(a, b)]);
      } else {
        setSelectedPriceRange(null);
      }
    } else {
      setSelectedPriceRange(null);
    }

    const carIdParam = searchParams.get("car_id");
    if (carIdParam) {
      const id = Number(carIdParam);
      if (Number.isFinite(id)) setSelectedCarId(id);
    } else if (!isReserveMode) {
      setSelectedCarId(null);
    }

    setRoadMapStep(safeStep);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const from = (carDates as any)?.[0];
  const to = (carDates as any)?.[1];
  const step1Done = Boolean(from && to);

  // =========================================================
  // ✅ meta calc
  // =========================================================
  const rentDays = useMemo(() => {
    if (!from || !to) return 0;
    try {
      return calcRentDaysWithGrace({
        fromDateJalali: from,
        toDateJalali: to,
        deliveryTime: normalizeTime(deliveryTime) || "10:00",
        returnTime: normalizeTime(returnTime) || "10:00",
        graceMinutes: 90,
        jalaliToDate: (jy, jm, jd) => {
          const g = jalaali.toGregorian(jy, jm + 1, jd);
          return new Date(g.gy, g.gm - 1, g.gd);
        },
      });
    } catch {
      return 0;
    }
  }, [from, to, deliveryTime, returnTime]);

  const branchPart = useMemo(() => {
    return branchName ? t("meta.parts.branch", { branch: branchName }) : "";
  }, [branchName, t]);

  const daysPart = useMemo(() => {
    return rentDays > 0 ? t("meta.parts.days", { days: String(rentDays) }) : "";
  }, [rentDays, t]);

  const uiStep = useMemo(() => {
    if (!step1Done) return 1;
    return 2;
  }, [step1Done]);

  const dynamicTitle = useMemo(() => {
    if (uiStep === 1) return t("meta.step1.title", { branchPart, brand: "PalmRent" });
    return t("meta.step2.title", { branchPart, daysPart, brand: "PalmRent" });
  }, [uiStep, branchPart, daysPart, t]);

  const dynamicDesc = useMemo(() => {
    if (uiStep === 1) return t("meta.step1.desc");
    return t("meta.step2.desc", {
      branchName: branchName || "",
      rentDays: rentDays ? String(rentDays) : "",
    });
  }, [uiStep, t, branchName, rentDays]);

  const filterKey = useMemo(() => {
    const dt = normalizeTime(deliveryTime);
    const rt = normalizeTime(returnTime);

    return JSON.stringify({
      branchIdFromUrl: branchIdFromUrl ?? "MISSING",
      from: from || "",
      to: to || "",
      dt,
      rt,
      sort: sort || "",
      title: search_title || "",
      cats: (selectedCategories || []).join(","),
      minp: selectedPriceRange?.[0] ?? "",
      maxp: selectedPriceRange?.[1] ?? "",
      locale,
    });
  }, [
    branchIdFromUrl,
    from,
    to,
    deliveryTime,
    returnTime,
    sort,
    search_title,
    selectedCategories,
    selectedPriceRange,
    locale,
  ]);

  // =========================================================
  // ✅ store -> URL sync (با router.replace نوع‌دار)
  // =========================================================
  useEffect(() => {
    if (freezeUrlSyncRef.current) return;

    const currentStep = searchParams.get("step");
    if (currentStep === "3") return;

    const params = new URLSearchParams(searchParams.toString());
    const dt = normalizeTime(deliveryTime) || "10:00";
    const rt = normalizeTime(returnTime) || "10:00";

    if (from && to) {
      params.set("from", from);
      params.set("to", to);
    } else {
      params.delete("from");
      params.delete("to");
    }

    params.set("dt", dt);
    params.set("rt", rt);

    if (sort) params.set("sort", sort);
    else params.delete("sort");

    if (search_title) params.set("search_title", search_title);
    else params.delete("search_title");

    if (selectedCategories?.length) params.set("categories", selectedCategories.join(","));
    else params.delete("categories");

    if (selectedPriceRange?.length === 2) {
      params.set("min_p", String(selectedPriceRange[0]));
      params.set("max_p", String(selectedPriceRange[1]));
    } else {
      params.delete("min_p");
      params.delete("max_p");
    }

    params.set("step", String(step1Done ? 2 : 1));

    if (selectedCarId) params.set("car_id", String(selectedCarId));
    else params.delete("car_id");

    const next = params.toString();
    if (next === lastPushedRef.current) return;
    if (next === searchParams.toString()) return;

    lastPushedRef.current = next;

    freezeUrlSyncRef.current = true;

    // ✅ مهم: با فرم object تایپ i18n-router اوکی میشه
    router.replace(
      {
        pathname,
        query: toQueryObject(params) as any,
      } as any,
      { scroll: false } as any,
    );

    setTimeout(() => {
      freezeUrlSyncRef.current = false;
    }, 0);
  }, [
    filterKey,
    selectedCarId,
    step1Done,
    from,
    to,
    deliveryTime,
    returnTime,
    sort,
    search_title,
    selectedCategories,
    selectedPriceRange,
    pathname,
    searchParams,
    router,
  ]);

  // =========================================================
  // ✅ data fetch
  // =========================================================
  const canFetch = Boolean(step1Done && branchIdFromUrl && from && to);

  const rqParamsSafe: CarFilterParams = useMemo(
    () => ({
      locale,
      branch_id: branchIdFromUrl ?? 0,
      from: from ?? "",
      to: to ?? "",
      dt: normalizeTime(deliveryTime) ?? undefined,
      rt: normalizeTime(returnTime) ?? undefined,
      sort: sort ?? undefined,
      search_title: search_title || "",
      cat_id: selectedCategories || [],
      min_p: selectedPriceRange?.[0],
      max_p: selectedPriceRange?.[1],
    }),
    [
      locale,
      branchIdFromUrl,
      from,
      to,
      deliveryTime,
      returnTime,
      sort,
      search_title,
      selectedCategories,
      selectedPriceRange,
    ],
  );

  const q = useInfiniteCarFilter(rqParamsSafe, canFetch);

  const lastQueryKeyRef = useRef<string>("");
  useEffect(() => {
    if (lastQueryKeyRef.current !== filterKey) {
      lastQueryKeyRef.current = filterKey;
      clearCarList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => {
    if (!canFetch) return;
    const pages = q.data?.pages || [];
    if (!pages.length) return;

    const all = pages.flatMap((p: any) => p?.cars || []);
    addCarList(all);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data, canFetch]);

  const metaPage = useMemo(() => {
    return q.data?.pages?.find((p: any) => p?.currency || p?.rate_to_rial != null) ?? null;
  }, [q.data]);

  const currency = canFetch ? (metaPage?.currency ?? "") : "";
  const rateToRial = canFetch ? (metaPage?.rate_to_rial ?? null) : null;

  // infinite loader
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      observerRef.current?.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const first = entries[0];
          if (!first?.isIntersecting) return;
          if (!canFetch) return;
          if (q.isFetchingNextPage) return;
          if (!q.hasNextPage) return;
          q.fetchNextPage();
        },
        { root: null, threshold: 1, rootMargin: "250px 0px 250px 0px" },
      );

      observerRef.current.observe(node);
    },
    [q, canFetch],
  );

  useEffect(() => () => observerRef.current?.disconnect(), []);

  const isLoading = canFetch ? q.isLoading : false;
  const isLoadingMore = canFetch ? q.isFetchingNextPage : false;

  const error =
    canFetch && q.isError ? ((q.error as any)?.message ?? tGlobal("errorLoading")) : null;

  // =========================================================
  // ✅ DESKTOP => /reserve (i18n router خودش locale رو prefix می‌کنه)
  // =========================================================
  const goToReserve = useCallback(() => {
    if (!selectedCarId || !branchIdFromUrl || !from || !to) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("branch_id", String(branchIdFromUrl));
    params.set("from", String(from));
    params.set("to", String(to));
    params.set("dt", normalizeTime(deliveryTime) || "10:00");
    params.set("rt", normalizeTime(returnTime) || "10:00");
    params.set("car_id", String(selectedCarId));
    params.delete("step");

    router.push(
      {
        pathname: "/reserve",
        query: toQueryObject(params) as any,
      } as any,
      { scroll: true } as any,
    );
  }, [
    selectedCarId,
    branchIdFromUrl,
    from,
    to,
    deliveryTime,
    returnTime,
    router,
    searchParams,
  ]);

  // =========================================================
  // ✅ MOBILE => Sheet
  // =========================================================
  const openReserveSheet = useCallback(
    (carId: number) => {
      if (!Number.isFinite(carId) || carId <= 0) return;
      if (!branchIdFromUrl || !from || !to) return;

      const dt = normalizeTime(deliveryTime) || "10:00";
      const rt = normalizeTime(returnTime) || "10:00";

      if (sheetOpenedRef.current) return;
      sheetOpenedRef.current = true;

      freezeUrlSyncRef.current = true;

      // 1) hydrate store
      setSelectedCarId(carId);
      setRoadMapStep(3);
      setBranchId(branchIdFromUrl);
      setIsAnySheetOpen(true);
      setCarDates([from, to]);
      setDeliveryTime(dt);
      setReturnTime(rt);

      // 2) hydrate URL
      const params = new URLSearchParams(searchParams.toString());
      params.set("branch_id", String(branchIdFromUrl));
      params.set("from", String(from));
      params.set("to", String(to));
      params.set("dt", String(dt));
      params.set("rt", String(rt));
      params.set("car_id", String(carId));
      params.set("step", "3");

      const next = params.toString();
      lastPushedRef.current = next;

      router.replace(
        {
          pathname,
          query: toQueryObject(params) as any,
        } as any,
        { scroll: false } as any,
      );

      setTimeout(() => {
        freezeUrlSyncRef.current = false;

        openSheet({
          title: tReserve("reserve"),
          content: (
            <div>
              <div className="flex items-center bg-white">
                <SheetClose>
                  <ArrowRight className="size-8 px-2" />
                </SheetClose>
                <SearchHeader stepSecond />
              </div>

              <StepRent step={3} />
              <ReserveInformation />
            </div>
          ),
          onClose: () => {
            freezeUrlSyncRef.current = true;

            setRoadMapStep(2);
            setIsAnySheetOpen(false);

            const p = new URLSearchParams(window.location.search);
            p.set("step", "2");
            p.delete("car_id");

            const back = p.toString();
            lastPushedRef.current = back;

            router.replace(
              {
                pathname,
                query: toQueryObject(p) as any,
              } as any,
              { scroll: false } as any,
            );

            setTimeout(() => {
              freezeUrlSyncRef.current = false;
              sheetOpenedRef.current = false;
            }, 0);
          },
        });
      }, 0);
    },
    [
      branchIdFromUrl,
      from,
      to,
      deliveryTime,
      returnTime,
      pathname,
      searchParams,
      router,
      openSheet,
      tReserve,
      setSelectedCarId,
      setRoadMapStep,
      setBranchId,
      setIsAnySheetOpen,
      setCarDates,
      setDeliveryTime,
      setReturnTime,
    ],
  );

  const handleMobileReserve = useCallback(
    (carData: any) => {
      const carId = Number(carData?.id);
      openReserveSheet(carId);
    },
    [openReserveSheet],
  );

  return (
    <>
      <SearchMetaClient title={dynamicTitle} description={dynamicDesc} />

      <Header shadowLess />
      <div className="bg-white dark:bg-background">
        <SearchHeader />
      </div>

      <div className="sm:w-[90vw] max-w-334 m-auto relative my-4 px-0 sm:px-2">
        <StepRent step={2} />
      </div>

      <div className="step-stage">
        {step1Done && (
          <div className="step-layer">
            <div ref={sentinelRef} className="h-px w-full" />

            <div
              className={`
                sticky top-0 z-40
                transition-[transform,background-color,box-shadow,backdrop-filter]
                duration-500 ease-out
                ${playFade ? "animate-fade-in" : ""}
              `}
              style={{
                transform: stuck ? `translateY(${marginTop}px)` : "translateY(0px)",
                willChange: "transform",
              }}
            >
              <div className="sm:w-[90vw] max-w-334 m-auto px-0 sm:px-2">
                <SerarchSection
                  searchDisable={isLoading && !isLoadingMore}
                  containerClassName={
                    stuck
                      ? "shadow-lg shadow-black/5 dark:shadow-black/20 border-b border-gray-200/80 dark:border-gray-700/80"
                      : ""
                  }
                />
              </div>
            </div>

            <div className="md:w-[90vw] max-w-334 m-auto relative min-h-[50vh] px-0 md:px-2 mt-4">
              {error && !isLoading && (
                <div className="flex flex-col items-center justify-center py-20 text-red-500 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-100 dark:border-red-900/40">
                  <Info size={48} className="opacity-80" />
                  <span className="mt-2 font-bold">{error}</span>

                  <Button
                    onClick={() => q.refetch()}
                    className="mt-4 flex items-center gap-2"
                    variant="default"
                  >
                    <RefreshCcw className="size-4" />
                    {tGlobal("tryAgain")}
                  </Button>
                </div>
              )}

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {!isLoading &&
                  (carList || []).map((item: any, index: number) => {
                    const isLast = (carList || []).length === index + 1;
                    return (
                      <div
                        ref={isLast ? lastElementRef : undefined}
                        key={`${item.id}-${index}`}
                        className="flex w-full"
                      >
                        <SingleCar
                          data={item}
                          currency={currency}
                          rateToRial={rateToRial}
                          onMobileReserve={handleMobileReserve}
                        />
                      </div>
                    );
                  })}

                {(isLoading || isLoadingMore) &&
                  Array(6)
                    .fill(null)
                    .map((_, index) => (
                      <div key={`skeleton-${index}`} className="flex w-full">
                        <SkeletonCarCard />
                      </div>
                    ))}
              </div>

              {!isLoading && !isLoadingMore && !error && (carList || []).length === 0 && (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400 flex flex-col items-center gap-2">
                  <Info size={40} className="opacity-30" />
                  <span>{tGlobal("noCarsFound")}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isSearchOpen && <SearchPopup />}
      {isFilterOpen && <SearchFilterSheet />}
      {descriptionPopup?.description && <DescriptionPopup />}

      <Footer />
    </>
  );
}

export default function SearchResultPage() {
  return (
    <Suspense fallback={null}>
      <SearchResultPageContent />
    </Suspense>
  );
}