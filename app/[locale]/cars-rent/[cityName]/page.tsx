"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useSelector } from "react-redux";
import { useTranslations } from "next-intl";

import NavSection from "@/components/Branchs/Nav-Section";
import TinyInformation from "@/components/Branchs/Tiny-Information";
import ImportantQuestions from "@/components/Branchs/Important-Questions";
import FavoriteBrands from "@/components/Branchs/Favorite-Brands";
import QRApplication from "@/components/Branchs/QR-Application";
import WhyUs from "@/components/Branchs/Why-Us";
import GoogleReview from "@/components/Branchs/Google-Review";
import FAQlanding from "@/components/Branchs/FAQ-landing";
import DescriptionLanding from "@/components/Branchs/Description-Landing";
import CarCategory from "@/components/Branchs/Category-List";
import { SerarchSection } from "@/components/search/SearchSection";
import { useBranchCars } from "@/services/branch-cars/branch-cars.queries";
import SkeletonCarCard from "@/components/Loadings/SkeletonCarCard";
import SkeletonSearchBar from "@/components/Loadings/SkeletonSearchBar";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { ArrowLeftIcon } from "@/components/ui/arrow-left";
import type { ArrowLeftIconHandle } from "@/components/ui/arrow-left";
import BranchName from "@/helpers/BranchNameHelper";
import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store";
import BranchCarCard from "@/components/card/CardCardBranch";
import { useParams } from "next/navigation";

/* ---------------- shared calendar helpers ---------------- */

type PickerRange = { start: Date | null; end: Date | null };

export type SharedCalendar = {
  range: PickerRange;
  deliveryTime: string;
  returnTime: string;
};

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

/** ضد DST/Timezone: تاریخ‌ها روی 12:00 قفل */
const atNoon = (d: Date) => {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
};

/** ✅ microtask defer — جلوگیری از setState سینک داخل effect body */
const defer = (fn: () => void) => {
  if (typeof queueMicrotask === "function") return queueMicrotask(fn);
  Promise.resolve().then(fn);
};

/** ✅ ساخت توکن یکتا */
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

export default function HomePage() {
  const t = useTranslations("branchLanding");

  const routeParams = useParams() as { locale?: string; cityName?: string };

  const resolvedLocale = String(routeParams?.locale || "fa");
  const slug = String(routeParams?.cityName || "");

  // ✅ فیلترها از zustand
  const filterSort = useSearchPageStore((s) => s.sort);
  const filterTitle = useSearchPageStore((s) => s.search_title);
  const filterCats = useSearchPageStore((s) => s.selectedCategories);

  // ✅ از Redux (sticky خراب نشود)
  const isHeaderClose = useSelector((state: any) => state.global?.isHeaderClose);
  const topOffset = isHeaderClose ? 0 : 64;

  // ✅ cleanup filters on unmount (safe)
  useEffect(() => {
    return () => {
      const st = useSearchPageStore.getState() as any;
      if (typeof st.resetFilters === "function") st.resetFilters();
    };
  }, []);

  // ==========================================================
  // ✅ Shared Calendar scoped to THIS history entry
  // Back => stays | New entry (link/menu) => cleared
  // ==========================================================
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

  // ✅ hydrate once (page-level)
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

        // ✅ همیشه string
        const existingToken =
          typeof prevState.__branchCalendarToken === "string" ? (prevState.__branchCalendarToken as string) : null;

        const finalToken = existingToken ?? makeToken();

        // اگر نداشت، روی همین history entry ذخیره کن
        if (!existingToken) {
          window.history.replaceState(
            { ...prevState, __branchCalendarToken: finalToken },
            document.title,
          );
        }

        setVisitToken(finalToken);

        // از sessionStorage بخون
        const raw = sessionStorage.getItem(calendarStorageKey);
        if (!raw) {
          setCalendarHydrated(true);
          return;
        }

        const parsed = JSON.parse(raw) as Partial<StoredCalendarPayload>;

        // اگر token نخونه => یعنی این ورود “جدید” بوده => پاک
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

  // ✅ persist whenever sharedCalendar changes (after hydration)
  useEffect(() => {
    if (!calendarHydrated) return;
    if (!visitToken) return;

    const s = sharedCalendar.range.start;
    const e = sharedCalendar.range.end;

    // اگر خالی شد => حذف
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

  // ---------- Pagination ----------
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
    if (cooldownTimerRef.current) window.clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = window.setTimeout(() => {
      cooldownRef.current = false;
    }, COOLDOWN_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) window.clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  // ---------- Filters key ----------
  const filterKey = useMemo(() => {
    return JSON.stringify({
      sort: filterSort || "",
      title: filterTitle || "",
      cats: (filterCats || []).join(","),
      slug,
      locale: resolvedLocale,
    });
  }, [filterSort, filterTitle, filterCats, slug, resolvedLocale]);

  // ✅ Reset when filters change
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setCars([]);
      setHasMore(true);
      setManualUnlocked(false);

      setPendingFilter(true);

      cooldownRef.current = false;
      if (cooldownTimerRef.current) window.clearTimeout(cooldownTimerRef.current);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [filterKey]);

  // ---------- Query params ----------
  const queryParams = useMemo(() => {
    return {
      page,
      sort: filterSort ?? null,
      search_title: filterTitle ?? null,
      cat_id: Array.isArray(filterCats) && filterCats.length ? filterCats : null,
    };
  }, [page, filterSort, filterTitle, filterCats]);

  const query = useBranchCars(slug, resolvedLocale, queryParams);

  // ✅ currency/rate از بک
  const currency = String(query.data?.currency || "");
  const rateToRial = query.data?.rate_to_rial ?? null;

  // ✅ branchId واقعی از API
  const branchId = Number(query.data?.branch?.id || 0);

  const categories = (query.data?.categories ?? []) as Array<{
    id: number;
    title: string;
    image?: string | null;
  }>;

  // ---------- Append/Replace cars on data ----------
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
  const refetching = query.isFetching && cars.length > 0;

  // ---------- Refs (ضد stale) ----------
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

  // ---------- Load more ----------
  const loadMore = useCallback(() => {
    if (isFetchingRef.current) return;
    if (!hasMoreRef.current) return;
    if (cooldownRef.current) return;
    setPage((p) => p + 1);
  }, []);

  // ---------- Infinite scroll observer ----------
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
        { root: null, threshold: 0, rootMargin: "350px 0px 350px 0px" },
      );

      observerRef.current.observe(node);
    },
    [loadMore],
  );

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  // ---------- Button logic ----------
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

  // ---------- Sticky sentinel + fade ----------
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
      },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [topOffset]);

  // ---------- Arrow animation on button hover ----------
  const arrowRef = useRef<ArrowLeftIconHandle | null>(null);

  const handleBtnEnter = useCallback(() => {
    arrowRef.current?.startAnimation();
  }, []);

  const handleBtnLeave = useCallback(() => {
    arrowRef.current?.stopAnimation();
  }, []);

  return (
    <>
      <main className="max-w-7xl w-full mx-auto">
        <NavSection
          image="/images/head-list-branch.jpg"
          title={t.rich("heroTitle", { Branch: () => <BranchName /> })}
          subtitle1={t("heroSubtitle1")}
          subtitle2={t("heroSubtitle2")}
        />

        {/* Categories */}
        <div className="px-0 sm:px-2">
          <CarCategory categories={categories} loading={query.isLoading} />
        </div>

        {/* sentinel دقیقا قبل از sticky سرچ */}
        <div ref={sentinelRef} className="h-px w-full" />

        {/* Sticky Search */}
        <div
          className={`
            sticky top-0 z-40
            transition-[transform,background-color,box-shadow,backdrop-filter]
            mt-2
            duration-500 ease-out
            ${playFade ? "animate-fade-in" : ""}
          `}
          style={{
            transform: stuck ? `translateY(${topOffset}px)` : "translateY(0px)",
          }}
        >
          <div className="m-auto px-0 sm:px-2 mt-6">
            {query.isLoading ? <SkeletonSearchBar stuck={stuck} /> : <SerarchSection searchDisable={query.isFetching} />}
          </div>
        </div>

        {/* Cars */}
        <div className="m-auto relative min-h-[50vh] px-0 md:px-2 mt-2">
          {refetching && (
            <div className="absolute inset-0 z-20 bg-white/40 dark:bg-black/30 backdrop-blur-[1px] rounded-xl pointer-events-none" />
          )}

          {listLoading && (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
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
                <div className="text-center pt-6 text-gray-500 dark:text-gray-400">{t("noCarsFound")}</div>
              ) : (
                <>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {cars.map((item: any, index: number) => (
                      <div key={`${item.id}-${index}`} className="flex w-full">
                        <BranchCarCard
                          forceWhatsappNoDate
                          data={item}
                          currency={currency}
                          rateToRial={rateToRial}
                          branchId={branchId}
                          sharedCalendar={sharedCalendar}
                          onSharedCalendarChange={setSharedCalendar}
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

                  <div className="flex justify-center">
                    {hasMore ? (
                      showLoadMoreButton ? (
                        <RainbowButton
                          variant="outline"
                          type="button"
                          onClick={onManualLoadOnce}
                          disabled={query.isFetching}
                          onMouseEnter={handleBtnEnter}
                          onMouseLeave={handleBtnLeave}
                          onFocus={handleBtnEnter}
                          onBlur={handleBtnLeave}
                        >
                          {buttonText} <ArrowLeftIcon ref={arrowRef} />
                        </RainbowButton>
                      ) : (
                        <div className="h-10" />
                      )
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">{t("noMoreResults")}</div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {query.isError && !listLoading && <div className="text-center py-20 text-red-500">{t("fetchError")}</div>}
        </div>

        {/* rest */}
        <div className="mt-16">
          <TinyInformation />
        </div>

        <div className="mt-6">
          <ImportantQuestions whatsappNumber={query.data?.branch?.whatsapp ?? undefined} phoneNumber={query.data?.branch?.phone ?? undefined} />
        </div>

        <div className="mt-8">
          <FavoriteBrands />
        </div>
        <div className="mt-6">
          <QRApplication />
        </div>
        <div className="mt-6">
          <WhyUs />
        </div>
        <div className="mt-8">
          <GoogleReview />
        </div>
        <div className="mt-6">
          <FAQlanding />
        </div>
        <div className="mt-6">
          <DescriptionLanding />
        </div>
      </main>
    </>
  );
}