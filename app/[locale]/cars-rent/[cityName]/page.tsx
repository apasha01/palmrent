"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { useSelector } from "react-redux"

import NavSection from "@/components/Branchs/Nav-Section"
import TinyInformation from "@/components/Branchs/Tiny-Information"
import ImportantQuestions from "@/components/Branchs/Important-Questions"
import FavoriteBrands from "@/components/Branchs/Favorite-Brands"
import QRApplication from "@/components/Branchs/QR-Application"
import WhyUs from "@/components/Branchs/Why-Us"
import GoogleReview from "@/components/Branchs/Google-Review"
import FAQlanding from "@/components/Branchs/FAQ-landing"
import DescriptionLanding from "@/components/Branchs/Description-Landing"

import CarCategory from "@/components/Branchs/Category-List"
import { SerarchSection } from "@/components/search/SearchSection"
import SingleCar from "@/components/card/CarsCard"

import { useBranchCars } from "@/services/branch-cars/branch-cars.queries"

import SkeletonCarCard from "@/components/Loadings/SkeletonCarCard"
import SkeletonSearchBar from "@/components/Loadings/SkeletonSearchBar"

import { RainbowButton } from "@/components/ui/rainbow-button"
import { ArrowLeftIcon } from "@/components/ui/arrow-left"
import type { ArrowLeftIconHandle } from "@/components/ui/arrow-left"
import BranchName from "@/helpers/BranchNameHelper"

// ✅ Zustand (برای فیلترها)
import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store"

export default function HomePage() {
  const routeParams = useParams() as { locale?: string; cityName?: string }

  const resolvedLocale = String(routeParams?.locale || "fa")
  const slug = String(routeParams?.cityName || "")

  // ✅✅✅ فیلترها از zustand (تا با SerarchSection یکی باشد)
  const filterSort = useSearchPageStore((s) => s.sort)
  const filterTitle = useSearchPageStore((s) => s.search_title)
  const filterCats = useSearchPageStore((s) => s.selectedCategories)

  // ✅✅✅ این قسمت حتماً مثل قبل از Redux بماند تا sticky خراب نشود
  const isHeaderClose = useSelector((state: any) => state.global?.isHeaderClose)
  const topOffset = isHeaderClose ? 0 : 64 // همون قبلی

  // ✅✅✅ وقتی از این صفحه رفتی بیرون، فیلترهای zustand پاک بشن
  useEffect(() => {
    return () => {
      useSearchPageStore.getState().resetFilters?.()
    }
  }, [])

  // ---------- Pagination ----------
  const [page, setPage] = useState(1)
  const [cars, setCars] = useState<any[]>([])
  const [hasMore, setHasMore] = useState(true)

  const manualGatePage = 3
  const [manualUnlocked, setManualUnlocked] = useState(false)

  // ✅ Pending filter (برای اسکلتون موقع تغییر فیلتر)
  const [pendingFilter, setPendingFilter] = useState(false)

  // ---------- Cooldown ----------
  const COOLDOWN_MS = 800
  const cooldownRef = useRef(false)
  const cooldownTimerRef = useRef<number | null>(null)

  const startCooldown = useCallback(() => {
    cooldownRef.current = true
    if (cooldownTimerRef.current) window.clearTimeout(cooldownTimerRef.current)
    cooldownTimerRef.current = window.setTimeout(() => {
      cooldownRef.current = false
    }, COOLDOWN_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) window.clearTimeout(cooldownTimerRef.current)
    }
  }, [])

  // ---------- Filters key ----------
  const filterKey = useMemo(() => {
    return JSON.stringify({
      sort: filterSort || "",
      title: filterTitle || "",
      cats: (filterCats || []).join(","),
      slug,
      locale: resolvedLocale,
    })
  }, [filterSort, filterTitle, filterCats, slug, resolvedLocale])

  // ✅ Reset when filters change
  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1)
      setCars([])
      setHasMore(true)
      setManualUnlocked(false)

      setPendingFilter(true)

      cooldownRef.current = false
      if (cooldownTimerRef.current) window.clearTimeout(cooldownTimerRef.current)
    }, 0)

    return () => window.clearTimeout(t)
  }, [filterKey])

  // ---------- Query params ----------
  const queryParams = useMemo(() => {
    return {
      page,
      sort: filterSort || null,
      search_title: filterTitle || null,
      cat_id: Array.isArray(filterCats) && filterCats.length ? filterCats : null,
    }
  }, [page, filterSort, filterTitle, filterCats])

  const query = useBranchCars(slug, resolvedLocale, queryParams)

  const categories = (query.data?.categories ?? []) as Array<{
    id: number
    title: string
    image?: string | null
  }>

  // ---------- Append/Replace cars on data ----------
  useEffect(() => {
    if (!query.data) return

    const newCars = (query.data?.cars ?? []) as any[]
    const apiHasMore = Boolean(query.data?.has_more)

    const t = window.setTimeout(() => {
      setHasMore(apiHasMore)
      setPendingFilter(false)

      setCars((prev) => {
        if (page === 1) return newCars

        const prevIds = new Set(prev.map((x: any) => x?.id))
        const unique = newCars.filter((x: any) => !prevIds.has(x?.id))
        return [...prev, ...unique]
      })

      startCooldown()
    }, 0)

    return () => window.clearTimeout(t)
  }, [query.data, page, startCooldown])

  const listLoading = (pendingFilter || query.isFetching) && cars.length === 0
  const refetching = query.isFetching && cars.length > 0

  // ---------- Refs (ضد stale) ----------
  const pageRef = useRef(page)
  const hasMoreRef = useRef(hasMore)
  const isFetchingRef = useRef(query.isFetching)
  const manualUnlockedRef = useRef(manualUnlocked)

  useEffect(() => {
    pageRef.current = page
  }, [page])

  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])

  useEffect(() => {
    isFetchingRef.current = query.isFetching
  }, [query.isFetching])

  useEffect(() => {
    manualUnlockedRef.current = manualUnlocked
  }, [manualUnlocked])

  // ---------- Load more ----------
  const loadMore = useCallback(() => {
    if (isFetchingRef.current) return
    if (!hasMoreRef.current) return
    if (cooldownRef.current) return
    setPage((p) => p + 1)
  }, [])

  // ---------- Infinite scroll observer ----------
  const observerRef = useRef<IntersectionObserver | null>(null)

  const infiniteSentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return
      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          if (!entry?.isIntersecting) return

          if (!hasMoreRef.current) return
          if (isFetchingRef.current) return
          if (cooldownRef.current) return

          const nextPage = pageRef.current + 1
          if (!manualUnlockedRef.current && nextPage >= manualGatePage) return

          loadMore()
        },
        { root: null, threshold: 0, rootMargin: "350px 0px 350px 0px" }
      )

      observerRef.current.observe(node)
    },
    [loadMore]
  )

  useEffect(() => {
    return () => observerRef.current?.disconnect()
  }, [])

  // ---------- Button logic ----------
  const showLoadMoreButton = useMemo(() => {
    if (!hasMore) return false
    if (manualUnlocked) return false
    return page >= manualGatePage - 1
  }, [hasMore, manualUnlocked, page])

  const onManualLoadOnce = useCallback(() => {
    if (query.isFetching) return
    if (!hasMore) return
    setManualUnlocked(true)
    loadMore()
  }, [query.isFetching, hasMore, loadMore])

  const buttonText = useMemo(() => {
    if (query.isFetching) return "در حال دریافت…"
    return "مشاهده بیشتر"
  }, [query.isFetching])

  // ---------- Sticky sentinel + fade (همون قبلی) ----------
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
      {
        threshold: 0,
        rootMargin: `-${topOffset}px 0px 0px 0px`,
      }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [topOffset])

  // ---------- Arrow animation on button hover ----------
  const arrowRef = useRef<ArrowLeftIconHandle | null>(null)

  const handleBtnEnter = useCallback(() => {
    arrowRef.current?.startAnimation()
  }, [])

  const handleBtnLeave = useCallback(() => {
    arrowRef.current?.stopAnimation()
  }, [])

  return (
    <>
      <main className="max-w-7xl w-full mx-auto">
        <NavSection
          image="/images/head-list-branch.jpg"
          title={
            <>
              {" "}
              اجاره خودرو در <BranchName /> بدون دپوزیت{" "}
            </>
          }
          subtitle1="تحویل فوری در فرودگاه هتل یا بیمه رایگان"
          subtitle2="رزرو آنلاین سریع, پرداخت هنگام تحویل و پشتیبانی ۷/۲۴"
        />

        {/* Categories */}
        <div className=" px-0 sm:px-2">
          <CarCategory categories={categories} loading={query.isLoading} />
        </div>

        {/* ✅ sentinel دقیقا قبل از sticky سرچ */}
        <div ref={sentinelRef} className="h-px w-full" />

        {/* ✅ Sticky Search (همون قبلی) */}
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
            {query.isLoading ? (
              <SkeletonSearchBar stuck={stuck} />
            ) : (
              <SerarchSection searchDisable={query.isFetching} />
            )}
          </div>
        </div>

        {/* Cars */}
        <div className=" m-auto relative min-h-[50vh] px-0 md:px-2 mt-2">
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
                <div className="text-center pt-6 text-gray-500 dark:text-gray-400">
                  خودرویی یافت نشد
                </div>
              ) : (
                <>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {cars.map((item: any, index: number) => (
                      <div key={`${item.id}-${index}`} className="flex w-full">
                        <SingleCar data={item} />
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
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        مورد بیشتری وجود ندارد
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {query.isError && !listLoading && (
            <div className="text-center py-20 text-red-500">خطا در دریافت اطلاعات</div>
          )}
        </div>

        {/* rest */}
        <div className="mt-16">
          <TinyInformation />
        </div>
        <div className="mt-6 ">
          <ImportantQuestions
            whatsappNumber={query.data?.branch?.whatsapp ?? undefined}
            phoneNumber={query.data?.branch?.phone ?? undefined}
          />
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
  )
}
