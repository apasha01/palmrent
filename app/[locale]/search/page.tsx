/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import Header from "@/components/layouts/Header";
import SearchHeader from "@/components/search/search-header";
import Footer from "@/components/Footer";
import SearchFilterSheet from "@/components/search/SearchFilterSheet";
import SearchPopup from "@/components/SearchPopup";
import StepRent from "@/components/search/StepsRent";
import DescriptionPopup from "@/components/DescriptionPopup";
import ReserveInformation from "@/components/reserve/ReserveInformation";
import { SerarchSection } from "@/components/search/SearchSection";
import SingleCar from "@/components/card/CarsCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Info, RefreshCcw, SlidersHorizontal } from "lucide-react";
import { useInfiniteCarFilter } from "@/services/car-filter/car-filter.hooks";
import type { CarFilterParams } from "@/services/car-filter/car-filter.types";
import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store";
import { normalizeTime } from "@/lib/rent-days";
import SearchMetaClient from "@/services/seo/SearchMetaClient";
import { getBranchNameById } from "@/helpers/BranchNameHelper";
import { useMobileSheet } from "@/providers/mobile-sheet-provider";
import { SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import SkeletonCarCard from "@/components/Loadings/SkeletonCarCard";
import BranchCarCard from "@/components/card/CardCardBranch";

/* ---------------- utils ---------------- */

function toQueryObject(params: URLSearchParams): Record<string, string> {
  const obj: Record<string, string> = {};
  params.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

type PickerRange = { start: Date | null; end: Date | null };
const EMPTY_RANGE: PickerRange = { start: null, end: null };

const normalizeTimeLocal = (t?: string | null) => {
  const s = String(t ?? "").trim();
  if (!s) return "10:00";
  const m = s.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return "10:00";
  const hh = String(Math.min(23, Math.max(0, Number(m[1])))).padStart(2, "0");
  const mm = String(Math.min(59, Math.max(0, Number(m[2])))).padStart(2, "0");
  return `${hh}:${mm}`;
};

const atNoon = (d: Date) => {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
};

const defer = (fn: () => void) => {
  if (typeof queueMicrotask === "function") return queueMicrotask(fn);
  Promise.resolve().then(fn);
};

const makeToken = () => {
  try {
    const c: any = globalThis as any;
    if (c?.crypto?.randomUUID) return c.crypto.randomUUID();
  } catch {}
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

type StoredCalendarPayload = {
  token: string;
  startISO: string;
  endISO: string;
  deliveryTime: string;
  returnTime: string;
};

/* ---------------- page ---------------- */

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
  const isHeaderClose = useSelector((state: any) => state.global.isHeaderClose);

  const freezeUrlSyncRef = useRef(false);
  const lastPushedRef = useRef<string>("");
  const sheetOpenedRef = useRef(false);
  const urlHydratedRef = useRef(false);

  // ✅ تا قبل از sync اولیه چیزی که به store وابسته است render نشود
  const [urlSyncReady, setUrlSyncReady] = useState(false);

  const {
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

    selectedBrands,
    setSelectedBrands,
    resetBrands,
    resetCategories,

    setReserveDraft,
    resetReserveDraft,
  } = useSearchPageStore();

  useEffect(() => {
    setIsAnySheetOpen(false);
    return () => setIsAnySheetOpen(false);
  }, [setIsAnySheetOpen]);

  const sp = searchParams.toString();

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

  const brandRaw = useMemo(() => searchParams.get("brand") || "", [searchParams]);

  const brandsFromUrl = useMemo(() => {
    if (!brandRaw) return [];
    return brandRaw
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }, [brandRaw]);

  const typedSearchTitle = useMemo(() => (search_title || "").trim(), [search_title]);

  /* ---------------- sticky detect ---------------- */

  const afterNormalRef = useRef<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);
  const stuckRef = useRef(false);
  const [fadeSeq, setFadeSeq] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let raf = 0;
    let cancelled = false;

    const setStuckSafe = (next: boolean) => {
      if (cancelled) return;
      if (next === stuckRef.current) return;
      stuckRef.current = next;
      setStuck(next);
      if (next) setFadeSeq((s) => s + 1);
    };

    const check = () => {
      raf = 0;
      const el = afterNormalRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const ON = 0;
      const OFF = 20;

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
      window.removeEventListener("scroll", onScroll as any);
      window.removeEventListener("resize", onScroll as any);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* ---------------- URL -> Store (before paint) ---------------- */

  useLayoutEffect(() => {
    if (freezeUrlSyncRef.current) return;

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
    else setCarDates([null, null]);

    if (dtRaw) setDeliveryTime(dt);
    else setDeliveryTime("10:00");

    if (rtRaw) setReturnTime(rt);
    else setReturnTime("10:00");

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
    if (!carIdParam && selectedCarId !== null) {
      setSelectedCarId(null);
    }

    const brandsRawInner = searchParams.get("brand") || "";
    const urlBrands = brandsRawInner
      ? brandsRawInner.split(",").map((x) => x.trim()).filter(Boolean)
      : [];

    if (selectedBrands.join(",") !== urlBrands.join(",")) {
      setSelectedBrands(urlBrands);
    }

    urlHydratedRef.current = true;
    setUrlSyncReady(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const from = (carDates as any)?.[0] as string | null;
  const to = (carDates as any)?.[1] as string | null;
  const hasDates = Boolean(from && to);

  /* ---------------- reset all filters + URL ---------------- */

  const handleResetAllFilters = useCallback(() => {
    resetCategories();
    resetBrands();
    setSort(null);
    setSearchTitle("");
    setSelectedPriceRange(null);

    const params = new URLSearchParams();
    if (branchIdFromUrl) params.set("branch_id", String(branchIdFromUrl));
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (deliveryTime) params.set("dt", normalizeTime(deliveryTime) || "10:00");
    if (returnTime) params.set("rt", normalizeTime(returnTime) || "10:00");

    const next = params.toString();
    lastPushedRef.current = next;
    freezeUrlSyncRef.current = true;

    router.replace(
      { pathname, query: toQueryObject(params) as any } as any,
      { scroll: false } as any,
    );

    setTimeout(() => {
      freezeUrlSyncRef.current = false;
    }, 0);
  }, [
    resetCategories,
    resetBrands,
    setSort,
    setSearchTitle,
    setSelectedPriceRange,
    branchIdFromUrl,
    from,
    to,
    deliveryTime,
    returnTime,
    pathname,
    router,
  ]);

  const hasActiveFilters = useMemo(() => {
    return (
      selectedCategories.length > 0 ||
      selectedBrands.length > 0 ||
      !!sort ||
      !!typedSearchTitle ||
      !!selectedPriceRange
    );
  }, [selectedCategories, selectedBrands, sort, typedSearchTitle, selectedPriceRange]);

  /* ---------------- meta ---------------- */

  const branchPart = useMemo(
    () => (branchName ? t("meta.parts.branch", { branch: branchName }) : ""),
    [branchName, t],
  );

  const dynamicTitle = useMemo(() => {
    return hasDates
      ? t("meta.step2.title", { branchPart, daysPart: "", brand: "PalmRent" })
      : t("meta.step1.title", { branchPart, brand: "PalmRent" });
  }, [hasDates, branchPart, t]);

  const dynamicDesc = useMemo(() => {
    return hasDates
      ? t("meta.step2.desc", { branchName: branchName || "", rentDays: "" })
      : t("meta.step1.desc");
  }, [hasDates, t, branchName]);

  /* ---------------- Shared calendar (ONLY when no dates) ---------------- */

  const calendarStorageKey = useMemo(() => {
    const bid = branchIdFromUrl ?? 0;
    return `search-result:calendar:${locale}:${pathname}:branch:${bid}`;
  }, [locale, pathname, branchIdFromUrl]);

  const [sharedCalendar, setSharedCalendar] = useState<{
    range: PickerRange;
    deliveryTime: string;
    returnTime: string;
  }>({
    range: EMPTY_RANGE,
    deliveryTime: "10:00",
    returnTime: "10:00",
  });

  const [calendarHydrated, setCalendarHydrated] = useState(false);
  const [visitToken, setVisitToken] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    defer(() => {
      if (cancelled) return;

      try {
        if (typeof window === "undefined") {
          setCalendarHydrated(true);
          return;
        }

        const prevState: any = window.history.state || {};
        const existingToken =
          typeof prevState.__searchResultCalendarToken === "string"
            ? prevState.__searchResultCalendarToken
            : null;

        const finalToken = existingToken ?? makeToken();

        if (!existingToken) {
          window.history.replaceState(
            { ...prevState, __searchResultCalendarToken: finalToken },
            document.title,
          );
        }

        setVisitToken(finalToken);

        const raw = sessionStorage.getItem(calendarStorageKey);
        if (!raw) {
          setCalendarHydrated(true);
          return;
        }

        const parsed = JSON.parse(raw) as Partial<StoredCalendarPayload>;
        if (!parsed?.token || parsed.token !== finalToken) {
          try {
            sessionStorage.removeItem(calendarStorageKey);
          } catch {}
          setCalendarHydrated(true);
          return;
        }

        const s = parsed?.startISO ? atNoon(new Date(parsed.startISO)) : null;
        const e = parsed?.endISO ? atNoon(new Date(parsed.endISO)) : null;

        setSharedCalendar({
          range: { start: s, end: e },
          deliveryTime: normalizeTimeLocal(parsed?.deliveryTime),
          returnTime: normalizeTimeLocal(parsed?.returnTime),
        });

        setCalendarHydrated(true);
      } catch {
        setCalendarHydrated(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [calendarStorageKey]);

  useEffect(() => {
    if (!calendarHydrated) return;
    if (!visitToken) return;

    const s = sharedCalendar.range.start;
    const e = sharedCalendar.range.end;

    if (!s || !e) {
      try {
        sessionStorage.removeItem(calendarStorageKey);
      } catch {}
      return;
    }

    try {
      const payload: StoredCalendarPayload = {
        token: visitToken,
        startISO: s.toISOString(),
        endISO: e.toISOString(),
        deliveryTime: normalizeTimeLocal(sharedCalendar.deliveryTime),
        returnTime: normalizeTimeLocal(sharedCalendar.returnTime),
      };
      sessionStorage.setItem(calendarStorageKey, JSON.stringify(payload));
    } catch {}
  }, [sharedCalendar, calendarHydrated, calendarStorageKey, visitToken]);

  useEffect(() => {
    if (hasDates) {
      setSharedCalendar((p) => ({ ...p, range: EMPTY_RANGE }));
    }
  }, [hasDates]);

  /* ---------------- filterKey + Store -> URL ---------------- */

  const filterKey = useMemo(() => {
    const dt = normalizeTime(deliveryTime);
    const rt = normalizeTime(returnTime);

    return JSON.stringify({
      branchIdFromUrl: branchIdFromUrl ?? "MISSING",
      from: from || "",
      to: to || "",
      dt: hasDates ? dt : null,
      rt: hasDates ? rt : null,
      sort: sort || "",
      q: typedSearchTitle,
      brands: brandsFromUrl.join(","),
      cats: (selectedCategories || []).join(","),
      minp: selectedPriceRange?.[0] ?? "",
      maxp: selectedPriceRange?.[1] ?? "",
      locale,
    });
  }, [
    branchIdFromUrl,
    from,
    to,
    hasDates,
    deliveryTime,
    returnTime,
    sort,
    typedSearchTitle,
    brandsFromUrl,
    selectedCategories,
    selectedPriceRange,
    locale,
  ]);

  useEffect(() => {
    if (freezeUrlSyncRef.current) return;
    if (!urlHydratedRef.current) return;
    if (!urlSyncReady) return;

    const params = new URLSearchParams(searchParams.toString());

    if (from && to) {
      params.set("from", from);
      params.set("to", to);

      const dt = normalizeTime(deliveryTime) || "10:00";
      const rt = normalizeTime(returnTime) || "10:00";
      params.set("dt", dt);
      params.set("rt", rt);
    } else {
      params.delete("from");
      params.delete("to");
      params.delete("dt");
      params.delete("rt");
    }

    if (sort) params.set("sort", sort);
    else params.delete("sort");

    if (typedSearchTitle) params.set("search_title", typedSearchTitle);
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

    const next = params.toString();
    if (next === lastPushedRef.current) return;
    if (next === searchParams.toString()) return;

    lastPushedRef.current = next;
    freezeUrlSyncRef.current = true;

    router.replace(
      { pathname, query: toQueryObject(params) as any } as any,
      { scroll: false } as any,
    );

    setTimeout(() => {
      freezeUrlSyncRef.current = false;
    }, 0);
  }, [
    filterKey,
    from,
    to,
    deliveryTime,
    returnTime,
    sort,
    typedSearchTitle,
    selectedCategories,
    selectedPriceRange,
    pathname,
    searchParams,
    router,
    urlSyncReady,
  ]);

  /* ---------------- fetch ---------------- */

  const canFetch = Boolean(branchIdFromUrl) && urlSyncReady;

  const rqParamsSafe: CarFilterParams = useMemo(
    () =>
      ({
        locale,
        branch_id: branchIdFromUrl ?? 0,
        from: from || undefined,
        to: to || undefined,
        dt: hasDates ? normalizeTime(deliveryTime) ?? undefined : undefined,
        rt: hasDates ? normalizeTime(returnTime) ?? undefined : undefined,
        sort: sort ?? undefined,
        search_title: typedSearchTitle || undefined,
        brand: brandRaw || undefined,
        cat_id: selectedCategories || [],
        min_p: selectedPriceRange?.[0],
        max_p: selectedPriceRange?.[1],
      } as any),
    [
      locale,
      branchIdFromUrl,
      from,
      to,
      hasDates,
      deliveryTime,
      returnTime,
      sort,
      typedSearchTitle,
      brandRaw,
      selectedCategories,
      selectedPriceRange,
    ],
  );

  const q = useInfiniteCarFilter(rqParamsSafe, canFetch);

  const lastQueryKeyRef = useRef<string>("");
  useEffect(() => {
    if (!urlSyncReady) return;
    if (lastQueryKeyRef.current !== filterKey) {
      lastQueryKeyRef.current = filterKey;
      clearCarList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, urlSyncReady]);

  useEffect(() => {
    if (!canFetch) return;
    const pages = q.data?.pages || [];
    if (!pages.length) return;
    addCarList(pages.flatMap((p: any) => p?.cars || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data, canFetch]);

  const metaPage = useMemo(
    () => q.data?.pages?.find((p: any) => p?.currency || p?.rate_to_rial != null) ?? null,
    [q.data],
  );

  const currency = canFetch ? (metaPage?.currency ?? "") : "";
  const rateToRial = canFetch ? (metaPage?.rate_to_rial ?? null) : null;

  /* ---------------- infinite scroll ---------------- */

  const observerRef = useRef<IntersectionObserver | null>(null);

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;

      observerRef.current?.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const first = entries[0];
          if (!first?.isIntersecting) return;
          if (!canFetch || q.isFetchingNextPage || !q.hasNextPage) return;
          q.fetchNextPage();
        },
        { root: null, threshold: 0.1, rootMargin: "300px 0px 0px 0px" },
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
  const error = canFetch && q.isError ? ((q.error as any)?.message ?? tGlobal("errorLoading")) : null;

  /* ---------------- reserve sheet ---------------- */

  const openReserveSheet = useCallback(
    (carId: number) => {
      if (!Number.isFinite(carId) || carId <= 0) return;
      if (!branchIdFromUrl || !from || !to) return;

      const dt = normalizeTime(deliveryTime) || "10:00";
      const rt = normalizeTime(returnTime) || "10:00";

      if (sheetOpenedRef.current) return;

      sheetOpenedRef.current = true;
      freezeUrlSyncRef.current = true;

      setSelectedCarId(carId);
      setBranchId(branchIdFromUrl);
      setIsAnySheetOpen(true);

      setCarDates([from, to]);
      setDeliveryTime(dt);
      setReturnTime(rt);

      setReserveDraft({
        branch_id: branchIdFromUrl,
        car_id: carId,
        from,
        to,
        dt,
        rt,
        sort: sort ?? null,
        search_title: typedSearchTitle || null,
        categories: selectedCategories || [],
        min_p: selectedPriceRange?.[0] ?? null,
        max_p: selectedPriceRange?.[1] ?? null,
      });

      const params = new URLSearchParams(searchParams.toString());
      params.set("branch_id", String(branchIdFromUrl));
      params.set("from", String(from));
      params.set("to", String(to));
      params.set("dt", String(dt));
      params.set("rt", String(rt));
      params.set("car_id", String(carId));

      const next = params.toString();
      lastPushedRef.current = next;

      router.replace(
        { pathname, query: toQueryObject(params) as any } as any,
        { scroll: false } as any,
      );

      setTimeout(() => {
        freezeUrlSyncRef.current = false;

        openSheet({
          title: tReserve("reserve"),
          content: (
            <div>
              <div className="flex items-center bg-white dark:bg-gray-800">
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

            setIsAnySheetOpen(false);
            setSelectedCarId(null);
            resetReserveDraft();

            const p = new URLSearchParams(window.location.search);
            p.delete("car_id");

            const back = p.toString();
            lastPushedRef.current = back;

            router.replace(
              { pathname, query: toQueryObject(p) as any } as any,
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
      setBranchId,
      setIsAnySheetOpen,
      setCarDates,
      setDeliveryTime,
      setReturnTime,
      setReserveDraft,
      resetReserveDraft,
      sort,
      typedSearchTitle,
      selectedCategories,
      selectedPriceRange,
    ],
  );

  const handleMobileReserve = useCallback(
    (carData: any) => openReserveSheet(Number(carData?.id)),
    [openReserveSheet],
  );

  const safeCarList = carList || [];
  const headerOffsetClass = isHeaderClose ? "translate-y-0" : "translate-y-16";

  // ✅ تا قبل از sync اولیه، هیچ UI وابسته به store را نشان نده
  if (!urlSyncReady) {
    return (
      <>
        <SearchMetaClient title={dynamicTitle} description={dynamicDesc} />
        <Header shadowLess />
        <div className="bg-background">
          <SearchHeader />
        </div>
        <div className="sm:w-[90vw] max-w-334 m-auto relative my-4 px-0 sm:px-2">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 mt-4">
            {Array(6)
              .fill(null)
              .map((_, index) => (
                <div key={`boot-skeleton-${index}`} className="flex w-full">
                  <SkeletonCarCard />
                </div>
              ))}
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <style jsx global>{`
        .searchStickyFade {
          animation: searchStickyFade 200ms ease-out both;
        }
        @keyframes searchStickyFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>

      <SearchMetaClient title={dynamicTitle} description={dynamicDesc} />

      <Header shadowLess />

      <div className="bg-background">
        <SearchHeader />
      </div>

      <div className="sm:w-[90vw] max-w-334 m-auto relative my-4 px-0 sm:px-2">
        <StepRent step={hasDates ? 2 : 1} />
      </div>

      <div className="relative">
        {branchIdFromUrl && (
          <div className="relative">
            <div
              className={cn(
                "sm:w-[90vw] max-w-334 m-auto px-0 sm:px-2",
                "transition-opacity duration-150 ease-out",
                stuck ? "opacity-0 pointer-events-none" : "opacity-100",
              )}
            >
              <SerarchSection searchDisable={isLoading && !isLoadingMore} />
              <div ref={afterNormalRef} className="h-px w-full" />
            </div>

            <div className="fixed left-0 right-0 top-0 z-20">
              <div
                className={cn(
                  "transform-gpu will-change-transform",
                  "transition-transform duration-500 ease-in-out",
                  headerOffsetClass,
                )}
              >
                <div
                  className={cn(
                    "transform-gpu will-change-opacity",
                    "transition-opacity duration-150 ease-out",
                    stuck ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
                  )}
                >
                  {stuck && (
                    <div key={fadeSeq} className="searchStickyFade">
                      <div className="sm:w-[90vw] max-w-334 m-auto px-0 sm:px-2">
                        <SerarchSection searchDisable={isLoading && !isLoadingMore} />
                      </div>
                    </div>
                  )}
                </div>
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
                  safeCarList.map((item: any, index: number) => {
                    const isLast = index === safeCarList.length - 1;

                    if (!hasDates) {
                      return (
                        <div
                          key={`${item.id}-${index}`}
                          className="flex w-full"
                          ref={isLast ? lastElementRef : undefined}
                        >
                          <BranchCarCard
                            data={item}
                            currency={currency}
                            rateToRial={rateToRial}
                            branchId={branchIdFromUrl}
                            forceWhatsappNoDate={true}
                            sharedCalendar={sharedCalendar}
                            onSharedCalendarChange={setSharedCalendar}
                            calendarHydrated={calendarHydrated}
                          />
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`${item.id}-${index}`}
                        className="flex w-full"
                        ref={isLast ? lastElementRef : undefined}
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

              {!isLoading && !isLoadingMore && !error && safeCarList.length === 0 && (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Info size={28} className="opacity-40" />
                  </div>

                  <span className="text-base font-medium">{tGlobal("noCarsFound")}</span>

                  {hasActiveFilters && (
                    <Button
                      type="button"
                      onClick={handleResetAllFilters}
                      variant="outline"
                      className="flex items-center gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl px-5 py-2.5 text-sm font-medium transition-all"
                    >
                      <SlidersHorizontal className="size-4" />
                      حذف همه فیلترها
                    </Button>
                  )}
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