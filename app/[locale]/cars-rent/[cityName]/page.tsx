"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import TinyInformation from "@/components/Branchs/Tiny-Information";
import ImportantQuestions from "@/components/Branchs/Important-Questions";
import QRApplication from "@/components/Branchs/QR-Application";

import DescriptionLanding from "@/components/Branchs/Description-Landing";
import { SerarchSection } from "@/components/search/SearchSection";
import { useBranchCars } from "@/services/branch-cars/branch-cars.queries";
import type { BranchCarsParams } from "@/services/branch-cars/branch-cars.api";
import SkeletonCarCard from "@/components/Loadings/SkeletonCarCard";
import SkeletonSearchBar from "@/components/Loadings/SkeletonSearchBar";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { ArrowLeftIcon } from "@/components/ui/arrow-left";
import type { ArrowLeftIconHandle } from "@/components/ui/arrow-left";
import BranchName from "@/helpers/BranchNameHelper";
import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store";
import NavSection from "@/components/Branchs/Nav-SectionNew";
import Header from "@/components/layouts/Header";
import Footer from "@/components/Footer";
import BranchCarCard from "@/components/card/CardCardBranch";
import { Button } from "@/components/ui/button";
import { Info, SlidersHorizontal } from "lucide-react";
import { useBranchSupport } from "@/services/branches/branch-support.queries";
import BranchFaq from "@/components/Branchs/BranchFaq";

/* ---------------- shared calendar helpers ---------------- */

type PickerRange = { start: Date | null; end: Date | null };

export type SharedCalendar = {
  range: PickerRange;
  deliveryTime: string;
  returnTime: string;
};

const EMPTY_RANGE: PickerRange = { start: null, end: null };
const SEARCH_SECTION_SCROLL_ID = "branch-search-section";

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

/* ---------------- value normalizers for filters ---------------- */

const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  if (typeof value === "object") {
    const maybeId = (value as any)?.id;
    if (maybeId !== null && maybeId !== undefined && maybeId !== "") {
      const n = Number(maybeId);
      return Number.isFinite(n) ? n : null;
    }
  }

  return null;
};

const normalizeNumberArray = (values: unknown): number[] | null => {
  if (!Array.isArray(values) || values.length === 0) return null;

  const result = values
    .map((item) => toNumberOrNull(item))
    .filter((item): item is number => item !== null);

  return result.length ? result : null;
};

const normalizeStringArray = (values: unknown): string[] | null => {
  if (!Array.isArray(values) || values.length === 0) return null;

  const result = values
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (typeof item === "number") return String(item);
      if (item && typeof item === "object") {
        const candidate =
          (item as any)?.value ??
          (item as any)?.slug ??
          (item as any)?.key ??
          (item as any)?.title ??
          "";
        return String(candidate).trim();
      }
      return "";
    })
    .filter((item) => item !== "");

  return result.length ? result : null;
};

export default function HomePage() {
  const t = useTranslations("branchLanding");
  const routeParams = useParams() as { locale?: string; cityName?: string };

  const resolvedLocale = String(routeParams?.locale || "fa");
  const slug = String(routeParams?.cityName || "");

  const filterSort = useSearchPageStore((s) => s.sort);
  const setSort = useSearchPageStore((s) => s.setSort);

  const filterTitle = useSearchPageStore((s) => s.search_title);
  const setSearchTitle = useSearchPageStore((s) => s.setSearchTitle);

  const filterCats = useSearchPageStore((s) => s.selectedCategories);
  const selectedBrands = useSearchPageStore((s) => s.selectedBrands);
  const selectedGearboxes = useSearchPageStore((s) => s.selectedGearboxes);
  const selectedFuels = useSearchPageStore((s) => s.selectedFuels);
  const selectedPersons = useSearchPageStore((s) => s.selectedPersons);
  const selectedBaggages = useSearchPageStore((s) => s.selectedBaggages);

  const selectedDeposit = useSearchPageStore((s) => s.selectedDeposit);
  const selectedFreeDelivery = useSearchPageStore((s) => s.selectedFreeDelivery);
  const selectedInsurance = useSearchPageStore((s) => s.selectedInsurance);
  const selectedKm = useSearchPageStore((s) => s.selectedKm);

  const selectedPriceRange = useSearchPageStore((s) => s.selectedPriceRange);
  const setSelectedPriceRange = useSearchPageStore((s) => s.setSelectedPriceRange);

  const resetBrands = useSearchPageStore((s) => s.resetBrands);
  const resetCategories = useSearchPageStore((s) => s.resetCategories);
  const resetGearboxes = useSearchPageStore((s) => s.resetGearboxes);
  const resetFuels = useSearchPageStore((s) => s.resetFuels);
  const resetPersons = useSearchPageStore((s) => s.resetPersons);
  const resetBaggages = useSearchPageStore((s) => s.resetBaggages);
  const resetReserveFlags = useSearchPageStore((s) => s.resetReserveFlags);

  const isHeaderClose = useSelector((state: any) => state.global?.isHeaderClose);
  const topOffset = isHeaderClose ? 0 : 64;

  useEffect(() => {
    return () => {
      const st = useSearchPageStore.getState() as any;
      if (typeof st.resetFilters === "function") st.resetFilters();
    };
  }, []);

  /* --------------------------------------------------------
     Shared Calendar scoped to THIS history entry
  -------------------------------------------------------- */
  const calendarStorageKey = useMemo(() => {
    return `branch-search:calendar:${resolvedLocale}:${slug}`;
  }, [resolvedLocale, slug]);

  const [sharedCalendar, setSharedCalendar] = useState<SharedCalendar>({
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
          typeof prevState.__branchCalendarToken === "string"
            ? (prevState.__branchCalendarToken as string)
            : null;

        const finalToken = existingToken ?? makeToken();

        if (!existingToken) {
          window.history.replaceState(
            { ...prevState, __branchCalendarToken: finalToken },
            document.title
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

  /* --------------------------------------------------------
     Pagination
  -------------------------------------------------------- */
  const [page, setPage] = useState(1);
  const [cars, setCars] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const manualGatePage = 3;
  const [manualUnlocked, setManualUnlocked] = useState(false);
  const [pendingFilter, setPendingFilter] = useState(false);

  const COOLDOWN_MS = 800;
  const cooldownRef = useRef(false);
  const cooldownTimerRef = useRef<number | null>(null);

  const startCooldown = useCallback(() => {
    cooldownRef.current = true;

    if (cooldownTimerRef.current) {
      window.clearTimeout(cooldownTimerRef.current);
    }

    cooldownTimerRef.current = window.setTimeout(() => {
      cooldownRef.current = false;
    }, COOLDOWN_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) window.clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  /* --------------------------------------------------------
     Normalized filters
  -------------------------------------------------------- */
  const normalizedCats = useMemo(() => normalizeNumberArray(filterCats), [filterCats]);
  const normalizedBrands = useMemo(() => normalizeNumberArray(selectedBrands), [selectedBrands]);
  const normalizedGearboxes = useMemo(
    () => normalizeStringArray(selectedGearboxes),
    [selectedGearboxes]
  );
  const normalizedFuels = useMemo(() => normalizeStringArray(selectedFuels), [selectedFuels]);
  const normalizedPersons = useMemo(() => normalizeNumberArray(selectedPersons), [selectedPersons]);
  const normalizedBaggages = useMemo(
    () => normalizeNumberArray(selectedBaggages),
    [selectedBaggages]
  );

  /* --------------------------------------------------------
     Filters key — reset on change
  -------------------------------------------------------- */
  const filterKey = useMemo(() => {
    return JSON.stringify({
      sort: filterSort || "",
      title: filterTitle || "",
      cats: (normalizedCats || []).join(","),
      brands: (normalizedBrands || []).join(","),
      gearboxes: (normalizedGearboxes || []).join(","),
      fuels: (normalizedFuels || []).join(","),
      persons: (normalizedPersons || []).join(","),
      baggages: (normalizedBaggages || []).join(","),
      deposit: selectedDeposit || "",
      freeDelivery: selectedFreeDelivery || "",
      insurance: selectedInsurance || "",
      km: selectedKm || "",
      minP: selectedPriceRange?.[0] ?? "",
      maxP: selectedPriceRange?.[1] ?? "",
      slug,
      locale: resolvedLocale,
    });
  }, [
    filterSort,
    filterTitle,
    normalizedCats,
    normalizedBrands,
    normalizedGearboxes,
    normalizedFuels,
    normalizedPersons,
    normalizedBaggages,
    selectedDeposit,
    selectedFreeDelivery,
    selectedInsurance,
    selectedKm,
    selectedPriceRange,
    slug,
    resolvedLocale,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setCars([]);
      setHasMore(true);
      setManualUnlocked(false);
      setPendingFilter(true);
      cooldownRef.current = false;

      if (cooldownTimerRef.current) {
        window.clearTimeout(cooldownTimerRef.current);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [filterKey]);

  /* --------------------------------------------------------
     Query
  -------------------------------------------------------- */
  const queryParams = useMemo<BranchCarsParams>(() => {
    return {
      page,
      sort: filterSort ?? null,
      search_title: filterTitle ?? null,
      cat_id: normalizedCats,
      brand: normalizedBrands,
      gearbox: normalizedGearboxes,
      fuel: normalizedFuels,
      person: normalizedPersons,
      baggage: normalizedBaggages,
      deposit: selectedDeposit ?? null,
      free_delivery: selectedFreeDelivery ?? null,
      insurance: selectedInsurance ?? null,
      km: selectedKm ?? null,
      min_p: selectedPriceRange?.[0] ?? null,
      max_p: selectedPriceRange?.[1] ?? null,
    };
  }, [
    page,
    filterSort,
    filterTitle,
    normalizedCats,
    normalizedBrands,
    normalizedGearboxes,
    normalizedFuels,
    normalizedPersons,
    normalizedBaggages,
    selectedDeposit,
    selectedFreeDelivery,
    selectedInsurance,
    selectedKm,
    selectedPriceRange,
  ]);

  const query = useBranchCars(slug, resolvedLocale, queryParams);

  const currency = String(query.data?.currency || "");
  const rateToRial = query.data?.rate_to_rial ?? null;
  const branchId = Number(query.data?.branch?.id || 1);

  /* --------------------------------------------------------
     Support Query
  -------------------------------------------------------- */
  const supportQuery = useBranchSupport(resolvedLocale, 1);

  const branchSupportTitle = String(supportQuery.data?.branch?.title || "");
  const branchSupportDescription = String(
    supportQuery.data?.branch?.description_1 || ""
  );
  const branchSupportCategories = supportQuery.data?.categories || [];

  /* --------------------------------------------------------
     Append / Replace cars
  -------------------------------------------------------- */
  useEffect(() => {
    if (!query.data) return;

    const newCars = (query.data?.cars ?? []) as any[];
    const apiHasMore = Boolean(query.data?.has_more);

    const timer = window.setTimeout(() => {
      setHasMore(apiHasMore);
      setPendingFilter(false);

      setCars((prev) => {
        if (page === 1) return newCars;

        const prevIds = new Set(prev.map((x: any) => x?.id));
        const unique = newCars.filter((x: any) => !prevIds.has(x?.id));
        return [...prev, ...unique];
      });

      startCooldown();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [query.data, page, startCooldown]);

  const listLoading = (pendingFilter || query.isFetching) && cars.length === 0;

  /* --------------------------------------------------------
     Refs
  -------------------------------------------------------- */
  const pageRef = useRef(page);
  const hasMoreRef = useRef(hasMore);
  const isFetchingRef = useRef(query.isFetching);
  const manualUnlockedRef = useRef(manualUnlocked);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    isFetchingRef.current = query.isFetching;
  }, [query.isFetching]);

  useEffect(() => {
    manualUnlockedRef.current = manualUnlocked;
  }, [manualUnlocked]);

  /* --------------------------------------------------------
     Load more
  -------------------------------------------------------- */
  const loadMore = useCallback(() => {
    if (isFetchingRef.current) return;
    if (!hasMoreRef.current) return;
    if (cooldownRef.current) return;

    setPage((p) => p + 1);
  }, []);

  /* --------------------------------------------------------
     Infinite scroll observer
  -------------------------------------------------------- */
  const observerRef = useRef<IntersectionObserver | null>(null);

  const infiniteSentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;

      observerRef.current?.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry?.isIntersecting) return;
          if (!hasMoreRef.current) return;
          if (isFetchingRef.current) return;
          if (cooldownRef.current) return;

          const nextPage = pageRef.current + 1;
          if (!manualUnlockedRef.current && nextPage >= manualGatePage) return;

          loadMore();
        },
        { root: null, threshold: 0, rootMargin: "350px 0px 350px 0px" }
      );

      observerRef.current.observe(node);
    },
    [loadMore]
  );

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  /* --------------------------------------------------------
     Manual load more button
  -------------------------------------------------------- */
  const showLoadMoreButton = useMemo(() => {
    if (!hasMore) return false;
    if (manualUnlocked) return false;
    return page >= manualGatePage - 1;
  }, [hasMore, manualUnlocked, page]);

  const onManualLoadOnce = useCallback(() => {
    if (query.isFetching) return;
    if (!hasMore) return;

    setManualUnlocked(true);
    loadMore();
  }, [query.isFetching, hasMore, loadMore]);

  const buttonText = useMemo(() => {
    if (query.isFetching) return t("loadingMore");
    return t("viewMore");
  }, [query.isFetching, t]);

  /* --------------------------------------------------------
     Sticky sentinel + fade
  -------------------------------------------------------- */
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);
  const [playFade, setPlayFade] = useState(false);
  const stuckRef = useRef(false);
  const animatedRef = useRef(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        const nowStuck = !entry.isIntersecting;

        if (nowStuck !== stuckRef.current) {
          stuckRef.current = nowStuck;
          setStuck(nowStuck);

          if (nowStuck && !animatedRef.current) {
            animatedRef.current = true;
            setPlayFade(true);
          }

          if (!nowStuck && animatedRef.current) {
            animatedRef.current = false;
            setPlayFade(false);
          }
        }
      },
      {
        threshold: 0,
        rootMargin: `-${topOffset}px 0px 0px 0px`,
      }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [topOffset]);

  /* --------------------------------------------------------
     Arrow button animation
  -------------------------------------------------------- */
  const arrowRef = useRef<ArrowLeftIconHandle | null>(null);

  const handleBtnEnter = useCallback(() => {
    arrowRef.current?.startAnimation();
  }, []);

  const handleBtnLeave = useCallback(() => {
    arrowRef.current?.stopAnimation();
  }, []);

  /* --------------------------------------------------------
     Reset all filters
  -------------------------------------------------------- */
  const handleResetAllFilters = useCallback(() => {
    resetCategories();
    resetBrands();
    resetGearboxes();
    resetFuels();
    resetPersons();
    resetBaggages();
    resetReserveFlags();

    setSort(null);
    setSearchTitle("");
    setSelectedPriceRange(null);

    setPage(1);
    setCars([]);
    setHasMore(true);
    setManualUnlocked(false);
    setPendingFilter(true);
    cooldownRef.current = false;

    if (cooldownTimerRef.current) {
      window.clearTimeout(cooldownTimerRef.current);
    }
  }, [
    resetCategories,
    resetBrands,
    resetGearboxes,
    resetFuels,
    resetPersons,
    resetBaggages,
    resetReserveFlags,
    setSort,
    setSearchTitle,
    setSelectedPriceRange,
  ]);

  const hasActiveFilters = useMemo(() => {
    return (
      (normalizedCats?.length ?? 0) > 0 ||
      (normalizedBrands?.length ?? 0) > 0 ||
      (normalizedGearboxes?.length ?? 0) > 0 ||
      (normalizedFuels?.length ?? 0) > 0 ||
      (normalizedPersons?.length ?? 0) > 0 ||
      (normalizedBaggages?.length ?? 0) > 0 ||
      !!selectedDeposit ||
      !!selectedFreeDelivery ||
      !!selectedInsurance ||
      !!selectedKm ||
      !!filterSort ||
      !!String(filterTitle || "").trim() ||
      !!selectedPriceRange
    );
  }, [
    normalizedCats,
    normalizedBrands,
    normalizedGearboxes,
    normalizedFuels,
    normalizedPersons,
    normalizedBaggages,
    selectedDeposit,
    selectedFreeDelivery,
    selectedInsurance,
    selectedKm,
    filterSort,
    filterTitle,
    selectedPriceRange,
  ]);

  return (
    <>
      <Header shadowLess />

      <main className="mx-auto w-full bg-white dark:bg-gray-950">
        <NavSection
          image="/images/head-list-branch.jpg"
          title={t.rich("heroTitle", { Branch: () => <BranchName /> })}
          subtitle1={t("heroSubtitle1")}
          subtitle2={t("heroSubtitle2")}
        />

        <div className="mx-auto max-w-7xl">
          <div>
            <TinyInformation />
          </div>


                <div className="mt-6">
            <BranchFaq
              loading={supportQuery.isLoading || supportQuery.isFetching}
              categories={branchSupportCategories}
            />
          </div>


          <div className="mt-6">
            <ImportantQuestions
              onlySupportView
              whatsappNumber={query.data?.branch?.whatsapp ?? undefined}
              phoneNumber={query.data?.branch?.phone ?? undefined}
            />
          </div>

          <div ref={sentinelRef} className="mt-2 h-px w-full" />
          <div id={SEARCH_SECTION_SCROLL_ID} className="h-px w-full" />

          <p className="mt-4 px-2 text-center font-bold md:text-start">
            لیست خودرو های <BranchName />
          </p>

          <div
            className={`
              sticky z-40
              transition-[top] duration-500 ease-in-out
              ${playFade ? "animate-fade-in" : ""}
            `}
            style={{ top: `${topOffset}px` }}
          >
            <div className="m-auto mt-4 px-0 sm:px-2">
              {query.isLoading ? (
                <SkeletonSearchBar stuck={stuck} />
              ) : (
                <SerarchSection
                  redirectToSearchOnDateConfirm
                  redirectbranch_id="1"
                  searchDisable={query.isFetching}
                  scrollTargetId={SEARCH_SECTION_SCROLL_ID}
                  scrollOffset={topOffset}
                />
              )}
            </div>
          </div>

          <div className="relative m-auto mt-2 min-h-[50vh] px-0 md:px-2">
            {listLoading && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={`first-skel-${i}`} className="flex w-full">
                    <SkeletonCarCard />
                  </div>
                ))}
              </div>
            )}

            {!listLoading && !query.isError && (
              <>
                {cars.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-20 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      <Info size={28} className="opacity-40" />
                    </div>

                    <span className="text-base font-medium">{t("noCarsFound")}</span>

                    {hasActiveFilters && (
                      <Button
                        type="button"
                        onClick={handleResetAllFilters}
                        variant="outline"
                        className="flex items-center gap-2 rounded-xl border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        <SlidersHorizontal className="size-4" />
                        حذف همه فیلترها
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {cars.map((item: any, index: number) => (
                        <div key={`${item.id}-${index}`} className="flex w-full">
                          <BranchCarCard
                            forceWhatsappNoDate
                            data={item}
                            currency={currency}
                            rateToRial={rateToRial}
                            accordionPriceList
                            branchId={branchId}
                            sharedCalendar={sharedCalendar}
                            onSharedCalendarChange={setSharedCalendar}
                            badgesOnImage
                            calendarHydrated={calendarHydrated}
                          />
                        </div>
                      ))}

                      {query.isFetching &&
                        Array.from({ length: 6 }).map((_, i) => (
                          <div key={`more-skel-${i}`} className="flex w-full">
                            <SkeletonCarCard />
                          </div>
                        ))}
                    </div>

                    <div ref={infiniteSentinelRef} className="h-6 w-full" />

                 <div className="mt-4 flex justify-center px-4 sm:px-0 md:px-0">
  {hasMore ? (
    showLoadMoreButton ? (
      <Button
        type="button"
        variant="outline"
        onClick={onManualLoadOnce}
        disabled={query.isFetching}
        onMouseEnter={handleBtnEnter}
        onMouseLeave={handleBtnLeave}
        onFocus={handleBtnEnter}
        onBlur={handleBtnLeave}
        className="w-full border border-[#0077db] bg-transparent text-base font-medium text-[#0077db] shadow-none hover:bg-[#0077db]/10 hover:text-[#0077db] md:w-auto md:px-12 md:py-3 md:text-lg"
      >
        {buttonText}
        <ArrowLeftIcon ref={arrowRef} />
      </Button>
    ) : (
      <div className="h-10" />
    )
  ) : (
    <div className="text-sm text-gray-500 dark:text-gray-400">
      {t("noMoreResults")}
    </div>
  )}
</div>
                  </>
                )}
              </>
            )}

            {query.isError && !listLoading && (
              <div className="py-20 text-center text-red-500">{t("fetchError")}</div>
            )}
          </div>

          <div className="mt-6">
            <QRApplication />
          </div>

    
          <div className="mt-6">
            <DescriptionLanding
              title={branchSupportTitle}
              html={branchSupportDescription}
            />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}