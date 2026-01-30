/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import SearchHeader from "@/components/search/search-header";
import Footer from "@/components/Footer";
import Header from "@/components/layouts/Header";
import InformationStep from "@/components/reserve-steps/SearchStepSecond";
import SearchFilterSheet from "@/components/search/SearchFilterSheet";
import SearchPopup from "@/components/SearchPopup";
import StepRent from "@/components/search/StepsRent";
import DescriptionPopup from "@/components/DescriptionPopup";
import SearchStepOne from "@/components/reserve-steps/SearchStepOne";

import { useInfiniteCarFilter } from "@/services/car-filter/car-filter.hooks";
import type { CarFilterParams } from "@/services/car-filter/car-filter.types";
import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store";
import { normalizeTime } from "@/lib/rent-days";

import { ArrowRight } from "lucide-react";
import { Sheet, SheetClose, SheetContent } from "@/components/ui/sheet";

const MOBILE_BREAKPOINT = 768;

/**
 * ✅ پایدار: فقط header fixed اصلی رو با id می‌گیره
 */
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

function SearchResultPageContent() {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // =========================================================
  // ✅ isMobile WITHOUT matchMedia (NO mql)
  // =========================================================
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined")
      return window.innerWidth < MOBILE_BREAKPOINT;
    return false;
  });

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update as any);
  }, []);

  const {
    roadMapStep,
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
    isMobileInfoOpen,
    setIsMobileInfoOpen,
  } = useSearchPageStore();

  const topOffset = useHeaderOffsetPx(64);

  // ✅ freeze offset while sheet open
  const [frozenOffset, setFrozenOffset] = useState(64);
  useEffect(() => {
    if (!isMobileInfoOpen) setFrozenOffset(topOffset);
  }, [topOffset, isMobileInfoOpen]);

  const effectiveTopOffset = isMobileInfoOpen ? frozenOffset : topOffset;
  const marginTop = Math.max(0, effectiveTopOffset);

  // ✅ app global state: is sheet open?
  useEffect(() => {
    const open = Boolean(isMobile && isMobileInfoOpen);
    setIsAnySheetOpen(open);
    return () => setIsAnySheetOpen(false);
  }, [isMobile, isMobileInfoOpen, setIsAnySheetOpen]);

  // ========= branch_id فقط از URL =========
  const branchIdFromUrl = useMemo(() => {
    const raw = searchParams.get("branch_id");
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }, [searchParams]);

  // ========= Sticky sentinel =========
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
  // ✅ Navigation helpers
  // =========================================================
  const lastPushedRef = useRef<string>("");
  const navModeRef = useRef<"replace" | "push">("replace");
  const prevStepRef = useRef<number>(1);

  const navigateTo = useCallback(
    (nextQuery: string) => {
      lastPushedRef.current = nextQuery;

      const url = `${pathname}?${nextQuery}`;
      const mode = navModeRef.current;

      navModeRef.current = "replace";

      if (mode === "push") router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    },
    [pathname, router],
  );

  // =========================================================
  // ✅ Close sheet -> go step 1 + clear car_id
  // =========================================================
  const closeSheetToStep1 = useCallback(() => {
    setIsMobileInfoOpen(false);
    setSelectedCarId(null);
    setRoadMapStep(1);

    const params = new URLSearchParams(searchParams.toString());
    params.set("step", "1");
    params.delete("car_id");

    // موبایل: URL لازم نیست تغییر کنه
    if (isMobile) return;

    navModeRef.current = "push";
    navigateTo(params.toString());
  }, [
    navigateTo,
    searchParams,
    setRoadMapStep,
    setSelectedCarId,
    setIsMobileInfoOpen,
    isMobile,
  ]);

  // =========================================================
  // ✅ IMPORTANT: prevent "initial onOpenChange(false)" bug
  // =========================================================
  const wasSheetOpenRef = useRef(false);
  useEffect(() => {
    wasSheetOpenRef.current = Boolean(isMobile && isMobileInfoOpen);
  }, [isMobile, isMobileInfoOpen]);

  // =========================================================
  // ✅ syncFromUrl (URL -> store)  [SAFE]
  // =========================================================
  const sp = searchParams.toString();

  useEffect(() => {
    if (sp === lastPushedRef.current) return;

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

    if (fromQ && toQ) {
      const curFrom = carDates?.[0] ?? null;
      const curTo = carDates?.[1] ?? null;
      if (curFrom !== fromQ || curTo !== toQ) setCarDates([fromQ, toQ]);
    }

    if (dtRaw && normalizeTime(deliveryTime) !== dt) setDeliveryTime(dt);
    if (rtRaw && normalizeTime(returnTime) !== rt) setReturnTime(rt);

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
      }
    } else {
      setSelectedPriceRange(null);
    }

    const carIdParam = searchParams.get("car_id");

    if (isMobile) {
      // موبایل: فقط car_id رو بخون
      if (carIdParam) {
        const id = Number(carIdParam);
        if (Number.isFinite(id)) setSelectedCarId(id);
      }
      return;
    }

    // Desktop
    const stepParam = searchParams.get("step");
    const stepNum = stepParam ? Number(stepParam) : NaN;
    const safeStep =
      Number.isFinite(stepNum) && stepNum > 0 ? Math.min(4, stepNum) : 1;

    if (roadMapStep !== safeStep) setRoadMapStep(safeStep);

    if (carIdParam) {
      const id = Number(carIdParam);
      if (Number.isFinite(id)) setSelectedCarId(id);
    } else {
      setSelectedCarId(null);
    }
  }, [
    sp,
    isMobile,
    searchParams,
    carDates,
    deliveryTime,
    returnTime,
    roadMapStep,
    setCarDates,
    setDeliveryTime,
    setReturnTime,
    setSelectedCategories,
    setSort,
    setSearchTitle,
    setSelectedPriceRange,
    setRoadMapStep,
    setSelectedCarId,
  ]);

  const from = (carDates as any)?.[0];
  const to = (carDates as any)?.[1];

  const step1Done = Boolean(from && to);
  const step2Done = Boolean(selectedCarId);

  // ✅ when car selected => open sheet on mobile / go step=3 on desktop
  useEffect(() => {
    if (!selectedCarId) return;

    if (isMobile) {
      setFrozenOffset(topOffset);
      setIsMobileInfoOpen(true);
      return;
    }

    if (roadMapStep < 3) {
      navModeRef.current = "push";
      setRoadMapStep(3);
    }
  }, [
    selectedCarId,
    isMobile,
    topOffset,
    roadMapStep,
    setIsMobileInfoOpen,
    setRoadMapStep,
  ]);

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

  // ✅ history push on derived step change (DESKTOP ONLY)
  useEffect(() => {
    if (isMobile) return;

    const derivedStepForHistory = Math.min(4, Math.max(1, roadMapStep || 1));
    const prev = prevStepRef.current;
    if (prev !== derivedStepForHistory) navModeRef.current = "push";
    prevStepRef.current = derivedStepForHistory;
  }, [roadMapStep, isMobile]);

  // =========================================================
  // ✅ sync URL from store (store -> URL)
  // =========================================================
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const dt = normalizeTime(deliveryTime);
    const rt = normalizeTime(returnTime);

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

    if (selectedCategories?.length)
      params.set("categories", selectedCategories.join(","));
    else params.delete("categories");

    if (selectedPriceRange?.length === 2) {
      params.set("min_p", String(selectedPriceRange[0]));
      params.set("max_p", String(selectedPriceRange[1]));
    } else {
      params.delete("min_p");
      params.delete("max_p");
    }

    const derivedStepForUrl =
      isMobile && isMobileInfoOpen
        ? 3
        : Math.min(4, Math.max(1, roadMapStep || 1));

    if (!isMobile) {
      params.set("step", String(derivedStepForUrl));
      if (selectedCarId) params.set("car_id", String(selectedCarId));
      else params.delete("car_id");
    } else {
      // ✅ موبایل: step حذف شود
      params.delete("step");
      if (selectedCarId) params.set("car_id", String(selectedCarId));
      else params.delete("car_id");
    }

    const next = params.toString();
    if (next === lastPushedRef.current) return;
    if (next === searchParams.toString()) return;

    navigateTo(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, roadMapStep, selectedCarId, isMobileInfoOpen]);

  // =========================================================
  // ✅ Step click
  // =========================================================
  const handleStepClick = useCallback(
    (targetStep: number) => {
      const stepSafe = Number.isFinite(targetStep)
        ? Math.min(4, Math.max(1, targetStep))
        : 1;

      navModeRef.current = "push";

      if (isMobile && stepSafe === 3) {
        setFrozenOffset(topOffset);
        setIsMobileInfoOpen(true);
        if (roadMapStep !== 2) setRoadMapStep(2);
        return;
      }

      if (stepSafe === 1) {
        closeSheetToStep1();
        return;
      }

      if (isMobile) setIsMobileInfoOpen(false);
      setRoadMapStep(stepSafe);
    },
    [
      isMobile,
      topOffset,
      roadMapStep,
      setRoadMapStep,
      closeSheetToStep1,
      setIsMobileInfoOpen,
    ],
  );

  const uiStep = useMemo(() => {
    if (isMobile && isMobileInfoOpen) return 3;
    if (!step1Done) return 1;
    if (step1Done && !step2Done) return 2;
    return isMobile ? 2 : 3; // ✅ موبایل پشت شیت همیشه ۲ بمونه
  }, [isMobile, isMobileInfoOpen, step1Done, step2Done]);

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

  // clear list on filterKey changes
  const lastQueryKeyRef = useRef<string>("");
  useEffect(() => {
    if (lastQueryKeyRef.current !== filterKey) {
      lastQueryKeyRef.current = filterKey;
      clearCarList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  // merge pages to store
  useEffect(() => {
    if (!canFetch) return;
    const pages = q.data?.pages || [];
    if (!pages.length) return;

    const all = pages.flatMap((p: any) => p?.cars || []);
    addCarList(all);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data, canFetch]);

  const metaPage = useMemo(() => {
    return (
      q.data?.pages?.find((p: any) => p?.currency || p?.rate_to_rial != null) ??
      null
    );
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

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  const isLoading = canFetch ? q.isLoading : false;
  const isLoadingMore = canFetch ? q.isFetchingNextPage : false;
  const error =
    canFetch && q.isError
      ? ((q.error as any)?.message ?? t("errorLoading"))
      : null;

  const renderCarsStep = () =>
    !canFetch ? null : (
      <SearchStepOne
        topOffset={marginTop}
        stuck={stuck}
        playFade={playFade}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        error={error}
        carList={carList || []}
        sentinelRef={sentinelRef}
        lastElementRef={lastElementRef}
        onRetry={() => q.refetch()}
        t={(key: string) => t(key)}
        currency={currency}
        rateToRial={rateToRial}
      />
    );

  const renderInfoStep = () => (
    <div className="sm:w-[90vw] max-w-334 m-auto px-0 sm:px-2">
      <InformationStep />
    </div>
  );

  const shouldRenderOuterChrome = !(isMobile && isMobileInfoOpen);

  return (
    <>
      {shouldRenderOuterChrome && (
        <>
          <Header shadowLess />

          <div className="bg-white dark:bg-background">
            <SearchHeader />
          </div>

          <div className="sm:w-[90vw] max-w-334 m-auto relative my-4 px-0 sm:px-2">
            {(!searchParams.get("step") ||
              Number(searchParams.get("step")) < 4) && (
              <StepRent
                step={uiStep}
                onStepClick={handleStepClick}
                step1Done={step1Done}
                step2Done={step2Done}
              />
            )}
          </div>
        </>
      )}

      {/* ✅✅ FIX اصلی همینجاست */}
      <div className="step-stage">
        {/* موبایل: حتی اگر selectedCarId پر شد هم لیست باید بمونه */}
        {step1Done && (isMobile ? true : !selectedCarId) && (
          <div className="step-layer">{renderCarsStep()}</div>
        )}

        {/* دسکتاپ: وقتی ماشین انتخاب شد info بیاد */}
        {!isMobile && selectedCarId && (
          <div className="step-layer">{renderInfoStep()}</div>
        )}
      </div>

      <Sheet
        open={Boolean(isMobileInfoOpen)}
        onOpenChange={(open) => {
          if (wasSheetOpenRef.current && !open) closeSheetToStep1();
        }}
      >
        <SheetContent
          showCloseButton={false}
          side="right"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="
            p-0
            fixed inset-0
            w-screen h-screen
            max-w-none
            rounded-none
            overflow-y-auto
            overscroll-contain
            bg-white dark:bg-background
          "
        >
          <div className="min-h-full">
            <div className="sticky top-0 z-50 bg-white dark:bg-background border-b">
              <div className="flex items-center">
                <SheetClose
                  className="pr-4"
                  onClick={() => closeSheetToStep1()}
                >
                  <ArrowRight />
                </SheetClose>

                <div className="flex-1">
                  <SearchHeader stepSecond={true} isSticky />
                </div>
              </div>
            </div>

            <div className="sm:w-full max-w-334 m-auto relative my-2 px-0 sm:px-2">
              <StepRent
                step={3}
                onStepClick={handleStepClick}
                step1Done={step1Done}
                step2Done={step2Done}
              />
            </div>

            {renderInfoStep()}
          </div>
        </SheetContent>
      </Sheet>

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
