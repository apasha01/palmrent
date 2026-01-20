/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Suspense } from "react"
import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

// Components
import SearchHeader from "@/components/search/search-header"
import DescriptionPopup from "@/components/DescriptionPopup"
import Footer from "@/components/Footer"
import Header from "@/components/layouts/Header"
import InformationStep from "@/components/InformationStep"
import PopupReels from "@/components/PopupReels"
import SearchFilterSheet from "@/components/search/SearchFilterSheet"
import SearchPopup from "@/components/SearchPopup"
import SingleCar from "@/components/card/CarsCard"
import StepRent from "@/components/search/StepsRent"
import { SerarchSection } from "@/components/search/SearchSection"

// Redux & Utils
import { api } from "@/lib/apiClient"
import { addCarList, clearCarList, selectCar } from "@/redux/slices/carListSlice"
import { changeCarDates, changeRoadMapStep } from "@/redux/slices/globalSlice"
import {
  changePriceRange,
  changeSearchCurrency,
  changeSearchTitle,
  changeSelectedCategories,
  changeSort,
} from "@/redux/slices/searchSlice"

// ✅ shadcn/ui
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

// ✅ lucide
import { Info, RefreshCcw } from "lucide-react"

// ===================== ✅ Helpers (Digits + Normalize) =====================
function toEnglishDigits(input: string) {
  const fa = "۰۱۲۳۴۵۶۷۸۹"
  const ar = "٠١٢٣٤٥٦٧٨٩"
  return input
    .split("")
    .map((ch) => {
      const faIndex = fa.indexOf(ch)
      if (faIndex !== -1) return String(faIndex)
      const arIndex = ar.indexOf(ch)
      if (arIndex !== -1) return String(arIndex)
      return ch
    })
    .join("")
}

function normalizeJalali(s: string) {
  return toEnglishDigits(s).replace(/-/g, "/").trim()
}

// ===================== UI =====================
function SkeletonCarCard() {
  return (
    <div className="w-full">
      <div className="rounded-2xl border border-border bg-card p-0 md:p-2.5 h-full overflow-hidden">
        <Skeleton className="w-full aspect-[16/10] md:rounded-lg rounded-none bg-gray-200/80 dark:bg-white/10" />
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
  )
}

function SearchResultPageContent() {
  const dispatch = useDispatch()
  const t = useTranslations()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // ✅ offset زیر Header (هدر شما fixed و 64px هست)
  const isHeaderClose = useSelector((state: any) => state.global.isHeaderClose)
  const topOffset = isHeaderClose ? 0 : 64

  // -- Redux State --
  const carList = useSelector((state: any) => state.carList.carList)
  const roadMapStep = useSelector((state: any) => state.global.roadMapStep)
  const isReelActive = useSelector((state: any) => state.reels.isReelActive)
  const isSearchOpen = useSelector((state: any) => state.global.isSearchOpen)
  const isFilterOpen = useSelector((state: any) => state.global.isFilterOpen)
  const descriptionPopup = useSelector((state: any) => state.global.descriptionPopup)
  const carDates = useSelector((state: any) => state.global.carDates)

  // Filters (همه‌چیز از Redux، ولی branch_id فقط از URL میاد)
  const filterSort = useSelector((state: any) => state.search.sort)
  const filterCats = useSelector((state: any) => state.search.selectedCategories)
  const filterPrice = useSelector((state: any) => state.search.selectedPriceRange)
  const filterTitle = useSelector((state: any) => state.search.search_title)

  // -- Local State --
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  // ========= ✅ Refs =========
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef(false)
  const pageRef = useRef(1)
  const hasMoreRef = useRef(true)
  const carCountRef = useRef(0)

  useEffect(() => {
    carCountRef.current = carList?.length || 0
  }, [carList?.length])

  // ========= ✅ branch_id فقط از URL =========
  const branchIdFromUrl = useMemo(() => {
    const raw = searchParams.get("branch_id")
    if (!raw) return null
    const n = Number(raw)
    if (!Number.isFinite(n) || n <= 0) return null
    return n
  }, [searchParams])

  // ========= ✅ Sticky sentinel =========
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [stuck, setStuck] = useState(false)
  const [playFade, setPlayFade] = useState(false)

  const stuckRef = useRef(false)
  const animatedRef = useRef(false)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const io = new IntersectionObserver(
      ([entry]) => {
        const nowStuck = !entry.isIntersecting
        if (nowStuck !== stuckRef.current) {
          stuckRef.current = nowStuck
          setStuck(nowStuck)

          if (nowStuck && !animatedRef.current) {
            animatedRef.current = true
            setPlayFade(true)
          }
          if (!nowStuck && animatedRef.current) {
            animatedRef.current = false
            setPlayFade(false)
          }
        }
      },
      { threshold: 0, rootMargin: `-${topOffset}px 0px 0px 0px` }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [topOffset])

  // ========= 1) Initial Hydration =========
  useEffect(() => {
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const cats = searchParams.get("categories")
    const stepParam = searchParams.get("step")
    const carIdParam = searchParams.get("car_id")
    const sortParam = searchParams.get("sort")
    const searchTitleParam = searchParams.get("search_title")

    if (from && to) dispatch(changeCarDates([normalizeJalali(from), normalizeJalali(to)]))
    if (cats) dispatch(changeSelectedCategories(cats.split(",").map(Number)))
    if (sortParam) dispatch(changeSort(sortParam))
    if (searchTitleParam) dispatch(changeSearchTitle(searchTitleParam))

    if (stepParam && carIdParam) {
      dispatch(changeRoadMapStep(Number(stepParam)))
      dispatch(selectCar(Number(carIdParam)))
    } else {
      dispatch(changeRoadMapStep(1))
    }

    setIsMounted(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ========= ✅ (خیلی مهم) Sync URL from/to با Redux carDates =========
  useEffect(() => {
    if (!isMounted) return
    if (!carDates?.[0] || !carDates?.[1]) return

    const fromNorm = normalizeJalali(carDates[0])
    const toNorm = normalizeJalali(carDates[1])

    const currentFrom = searchParams.get("from") || ""
    const currentTo = searchParams.get("to") || ""

    if (currentFrom === fromNorm && currentTo === toNorm) return

    const params = new URLSearchParams(searchParams.toString())
    params.set("from", fromNorm)
    params.set("to", toNorm)

    // ✅ branch_id دست نمی‌خوره چون params از URL فعلی ساخته شده
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [isMounted, carDates?.[0], carDates?.[1], searchParams, router, pathname])

  // ========= ✅ Params key =========
  const filterKey = useMemo(() => {
    return JSON.stringify({
      branchIdFromUrl: branchIdFromUrl ?? "MISSING",
      from: carDates?.[0] || "",
      to: carDates?.[1] || "",
      sort: filterSort || "price_min",
      title: filterTitle || "",
      cats: (filterCats || []).join(","),
      minp: filterPrice?.length === 2 ? Math.min(...filterPrice) : "",
      maxp: filterPrice?.length === 2 ? Math.max(...filterPrice) : "",
      locale,
      step: roadMapStep,
    })
  }, [branchIdFromUrl, carDates, filterSort, filterTitle, filterCats, filterPrice, locale, roadMapStep])

  // ========= ✅ Fetch =========
  const fetchCars = useCallback(
    async (isLoadMore = false) => {
      if (roadMapStep !== 1) return

      if (!branchIdFromUrl) {
        setIsLoading(false)
        setIsLoadingMore(false)
        hasMoreRef.current = false
        setHasMore(false)
        setError("branch_id در آدرس صفحه وجود ندارد یا نامعتبر است.")
        return
      }

      if (!carDates?.[0] || !carDates?.[1]) {
        setIsLoading(false)
        setIsLoadingMore(false)
        return
      }

      if (isLoadMore && !hasMoreRef.current) return
      if (loadingRef.current) return
      loadingRef.current = true

      const nextPage = isLoadMore ? pageRef.current + 1 : 1

      if (isLoadMore) setIsLoadingMore(true)
      else setIsLoading(true)

      setError(null)

      const fromNorm = normalizeJalali(carDates[0])
      const toNorm = normalizeJalali(carDates[1])

      const bodyData = {
        branch_id: branchIdFromUrl,
        from: fromNorm,
        to: toNorm,
        sort: filterSort || "price_min",
        search_title: filterTitle || "",
        page: nextPage,
        min_p: filterPrice?.length === 2 ? Math.min(...filterPrice) : "0",
        max_p: filterPrice?.length === 2 ? Math.max(...filterPrice) : "50000",
        cat_id: filterCats || [],
      }

      try {
        const response = await api.post(`/car/filter/${locale}`, bodyData)
        if (response.status !== 200) throw new Error("Invalid response status")

        const { cars, currency, min_price, max_price, count_cars } = response.data

        dispatch(changeSearchCurrency(currency))

        if (!isLoadMore && (!filterPrice || filterPrice.length === 0)) {
          dispatch(changePriceRange([min_price, max_price]))
        }

        if (!cars || cars.length === 0) {
          hasMoreRef.current = false
          setHasMore(false)
          return
        }

        const existingIds = new Set((carList || []).map((c: any) => c?.id))
        const uniqueCars = cars.filter((c: any) => !existingIds.has(c?.id))

        if (uniqueCars.length === 0) {
          hasMoreRef.current = false
          setHasMore(false)
          return
        }

        dispatch(addCarList(uniqueCars))

        const loadedBefore = isLoadMore ? carCountRef.current : 0
        const loadedAfter = loadedBefore + uniqueCars.length

        if (typeof count_cars === "number" && loadedAfter >= count_cars) {
          hasMoreRef.current = false
          setHasMore(false)
        } else {
          hasMoreRef.current = true
          setHasMore(true)
          pageRef.current = nextPage
        }
      } catch (err: any) {
        console.error("Search Fetch Error:", err)
        hasMoreRef.current = false
        setHasMore(false)

        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          (t("errorLoading") as any) ||
          "خطا در بارگذاری"

        if (!isLoadMore) setError(String(msg))
      } finally {
        loadingRef.current = false
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [
      roadMapStep,
      branchIdFromUrl,
      carDates,
      filterSort,
      filterTitle,
      filterPrice,
      filterCats,
      locale,
      dispatch,
      t,
      carList,
    ]
  )

  // ========= ✅ Reset + Fetch when filters change =========
  useEffect(() => {
    if (!isMounted || roadMapStep !== 1) return

    // ✅ branch_id را دست نمی‌زنیم (params از URL فعلی میاد)
    const params = new URLSearchParams(searchParams.toString())

    if (filterSort) params.set("sort", filterSort)
    else params.delete("sort")

    if (filterTitle) params.set("search_title", filterTitle)
    else params.delete("search_title")

    if (filterCats?.length) params.set("categories", filterCats.join(","))
    else params.delete("categories")

    if (filterPrice?.length === 2) {
      params.set("min_p", String(Math.min(...filterPrice)))
      params.set("max_p", String(Math.max(...filterPrice)))
    } else {
      params.delete("min_p")
      params.delete("max_p")
    }

    // ✅ تاریخ‌ها هم اینجا sync میشن
    if (carDates?.[0]) params.set("from", normalizeJalali(carDates[0]))
    else params.delete("from")

    if (carDates?.[1]) params.set("to", normalizeJalali(carDates[1]))
    else params.delete("to")

    router.replace(`${pathname}?${params.toString()}`, { scroll: false })

    dispatch(clearCarList())
    setError(null)

    pageRef.current = 1
    hasMoreRef.current = true
    setHasMore(true)

    setIsLoading(true)
    setIsLoadingMore(false)

    fetchCars(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey])

  // ========= ✅ Infinite Scroll observer =========
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return
      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const first = entries[0]
          if (!first?.isIntersecting) return
          if (loadingRef.current) return
          if (!hasMoreRef.current) return
          if (error) return
          fetchCars(true)
        },
        { root: null, threshold: 0, rootMargin: "250px 0px 250px 0px" }
      )

      observerRef.current.observe(node)
    },
    [fetchCars, error]
  )

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  return (
    <>
      <Header shadowLess />

      <div className="bg-white dark:bg-background">
        <SearchHeader />
      </div>

      <div className="sm:w-[90vw] max-w-334 m-auto relative my-4 px-0 sm:px-2">
        {(!searchParams.get("step") || Number(searchParams.get("step")) < 3) && (
          <StepRent step={Number(roadMapStep)} />
        )}
      </div>

      {roadMapStep === 1 && (
        <>
          <div ref={sentinelRef} className="h-px w-full" />

          <div
            className={`
              sticky z-40 transition-all duration-500
              ${isHeaderClose ? "top-0" : "top-16"}
              ${playFade ? "animate-fade-in" : ""}
            `}
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
                  onClick={() => {
                    hasMoreRef.current = true
                    setHasMore(true)
                    pageRef.current = 1
                    dispatch(clearCarList())
                    fetchCars(false)
                  }}
                  className="mt-4 flex items-center gap-2"
                  variant="default"
                >
                  <RefreshCcw className="size-4" />
                  {t("tryAgain")}
                </Button>
              </div>
            )}

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {!isLoading &&
                carList.map((item: any, index: number) => {
                  const isLast = carList.length === index + 1
                  return (
                    <div
                      ref={isLast ? lastElementRef : undefined}
                      key={`${item.id}-${index}`}
                      className="flex w-full"
                    >
                      <SingleCar data={item} />
                    </div>
                  )
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

            {!isLoading && !isLoadingMore && !error && carList.length === 0 && (
              <div className="text-center py-20 text-gray-500 dark:text-gray-400 flex flex-col items-center gap-2">
                <Info size={40} className="opacity-30" />
                <span>{t("noCarsFound")}</span>
              </div>
            )}
          </div>
        </>
      )}

      {roadMapStep === 2 && (
        <div className="sm:w-[90vw] max-w-334 m-auto px-0 sm:px-2">
          <InformationStep />
        </div>
      )}

      {isReelActive && <PopupReels />}
      {isSearchOpen && <SearchPopup />}
      {isFilterOpen && <SearchFilterSheet />}
      {descriptionPopup?.description && <DescriptionPopup />}

      <Footer />
    </>
  )
}

export default function SearchResultPage() {
  return (
    <Suspense fallback={null}>
      <SearchResultPageContent />
    </Suspense>
  )
}
