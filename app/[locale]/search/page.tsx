/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"

// Components
import SearchHeader from "@/components/search/search-header"
import Footer from "@/components/Footer"
import Header from "@/components/layouts/Header"
import InformationStep from "@/components/InformationStep"
import SearchFilterSheet from "@/components/search/SearchFilterSheet"
import SearchPopup from "@/components/SearchPopup"
import StepRent from "@/components/search/StepsRent"
import DescriptionPopup from "@/components/DescriptionPopup"
import SearchStepOne from "@/components/reserve-steps/SearchStepOne"

// React Query
import { useInfiniteCarFilter } from "@/services/car-filter/car-filter.hooks"
import type { CarFilterParams } from "@/services/car-filter/car-filter.types"

// Zustand
import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store"

/**
 * ✅ بدون دست زدن به Header:
 * offset واقعی را از div fixed داخل header می‌خوانیم
 */
function useHeaderOffsetPx(defaultPx = 64) {
  const [offset, setOffset] = useState(defaultPx)

  useEffect(() => {
    let raf = 0

    const findFixedHeaderEl = () => {
      const header = document.querySelector("header") as HTMLElement | null
      if (header) {
        const inside = header.querySelector("div.fixed") as HTMLElement | null
        if (inside) return inside
      }
      const fallback = document.querySelector("div.fixed.z-50") as HTMLElement | null
      if (fallback) return fallback
      return header
    }

    const measure = () => {
      const el = findFixedHeaderEl()
      if (!el) {
        setOffset(defaultPx)
        return
      }
      const rect = el.getBoundingClientRect()
      const next = Math.max(0, Math.round(rect.bottom))
      setOffset((prev) => (prev === next ? prev : next))
    }

    const onScrollOrResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener("scroll", onScrollOrResize, { passive: true })
    window.addEventListener("resize", onScrollOrResize)

    const el = findFixedHeaderEl()
    const ro = el ? new ResizeObserver(onScrollOrResize) : null
    if (el && ro) ro.observe(el)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", onScrollOrResize)
      window.removeEventListener("resize", onScrollOrResize)
      if (ro) ro.disconnect()
    }
  }, [defaultPx])

  return offset
}

function SearchResultPageContent() {
  const t = useTranslations()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const {
    roadMapStep,
    setRoadMapStep,
    isSearchOpen,
    isFilterOpen,

    carDates,
    setCarDates,

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

    // ✅ Cars in store
    carList,
    addCarList,
    clearCarList,
  } = useSearchPageStore()

  const topOffset = useHeaderOffsetPx(64)

  // ========= branch_id فقط از URL =========
  const branchIdFromUrl = useMemo(() => {
    const raw = searchParams.get("branch_id")
    if (!raw) return null
    const n = Number(raw)
    if (!Number.isFinite(n) || n <= 0) return null
    return n
  }, [searchParams])

  // ========= Sticky sentinel =========
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [stuck, setStuck] = useState(false)
  const [playFade, setPlayFade] = useState(false)
  const stuckRef = useRef(false)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const io = new IntersectionObserver(
      ([entry]) => {
        const nowStuck = !entry.isIntersecting
        if (nowStuck === stuckRef.current) return

        stuckRef.current = nowStuck
        setStuck(nowStuck)

        if (nowStuck) {
          setPlayFade(false)
          requestAnimationFrame(() => setPlayFade(true))
        } else {
          setPlayFade(false)
        }
      },
      { threshold: 0, rootMargin: `-${topOffset}px 0px 0px 0px` }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [topOffset])

  // ========= URL -> Store Sync =========
  const syncFromUrl = useCallback(() => {
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const cats = searchParams.get("categories")
    const stepParam = searchParams.get("step")
    const carIdParam = searchParams.get("car_id")
    const sortParam = searchParams.get("sort")
    const searchTitleParam = searchParams.get("search_title")
    const minP = searchParams.get("min_p")
    const maxP = searchParams.get("max_p")

    if (from && to) setCarDates([from, to])

    if (cats) {
      const parsed = cats
        .split(",")
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n) && n > 0)
      setSelectedCategories(parsed)
    } else {
      setSelectedCategories([])
    }

    if (sortParam) setSort(sortParam)
    else setSort(null)

    if (searchTitleParam) setSearchTitle(searchTitleParam)
    else setSearchTitle("")

    const stepNum = stepParam ? Number(stepParam) : 1
    const safeStep = Number.isFinite(stepNum) && stepNum > 0 ? stepNum : 1
    setRoadMapStep(safeStep)

    if (carIdParam) {
      const carIdNum = Number(carIdParam)
      setSelectedCarId(Number.isFinite(carIdNum) && carIdNum > 0 ? carIdNum : null)
    } else {
      setSelectedCarId(null)
    }

    if (minP && maxP) {
      const a = Number(minP)
      const b = Number(maxP)
      if (Number.isFinite(a) && Number.isFinite(b)) {
        setSelectedPriceRange([Math.min(a, b), Math.max(a, b)])
      }
    } else {
      setSelectedPriceRange(null)
    }
  }, [
    searchParams,
    setCarDates,
    setSelectedCategories,
    setSort,
    setSearchTitle,
    setRoadMapStep,
    setSelectedCarId,
    setSelectedPriceRange,
  ])

  useEffect(() => {
    syncFromUrl()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncFromUrl])

  // ========= Store -> URL Sync =========
  const filterKey = useMemo(() => {
    const from = (carDates as any)?.[0] || ""
    const to = (carDates as any)?.[1] || ""

    return JSON.stringify({
      branchIdFromUrl: branchIdFromUrl ?? "MISSING",
      from,
      to,
      sort: sort || "",
      title: search_title || "",
      cats: (selectedCategories || []).join(","),
      minp: selectedPriceRange?.[0] ?? "",
      maxp: selectedPriceRange?.[1] ?? "",
      locale,
      step: roadMapStep,
      car_id: selectedCarId ?? "",
    })
  }, [
    branchIdFromUrl,
    carDates,
    sort,
    search_title,
    selectedCategories,
    selectedPriceRange,
    locale,
    roadMapStep,
    selectedCarId,
  ])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    const from = (carDates as any)?.[0]
    const to = (carDates as any)?.[1]

    if (from && to) {
      params.set("from", from)
      params.set("to", to)
    }

    if (sort) params.set("sort", sort)
    else params.delete("sort")

    if (search_title) params.set("search_title", search_title)
    else params.delete("search_title")

    if (selectedCategories?.length) params.set("categories", selectedCategories.join(","))
    else params.delete("categories")

    if (selectedPriceRange?.length === 2) {
      params.set("min_p", String(selectedPriceRange[0]))
      params.set("max_p", String(selectedPriceRange[1]))
    } else {
      params.delete("min_p")
      params.delete("max_p")
    }

    if (roadMapStep) params.set("step", String(roadMapStep))

    if (selectedCarId) params.set("car_id", String(selectedCarId))
    else params.delete("car_id")

    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey])

  // ========= React Query params =========
  const from = (carDates as any)?.[0]
  const to = (carDates as any)?.[1]
  const canFetch = Boolean(roadMapStep === 1 && branchIdFromUrl && from && to)

  const rqParamsSafe: CarFilterParams = useMemo(
    () => ({
      locale,
      branch_id: branchIdFromUrl ?? 0,
      from: from ?? "",
      to: to ?? "",
      sort: sort || "price_min",
      search_title: search_title || "",
      cat_id: selectedCategories || [],
      min_p: selectedPriceRange?.[0],
      max_p: selectedPriceRange?.[1],
      car_id: selectedCarId ?? undefined,
    }),
    [locale, branchIdFromUrl, from, to, sort, search_title, selectedCategories, selectedPriceRange, selectedCarId]
  )

  const q = useInfiniteCarFilter(rqParamsSafe, canFetch)

  /**
   * ✅ مهم: دیتای react-query رو وارد store می‌کنیم
   * و قبلش در تغییر فیلترها clear می‌کنیم تا duplicate نشه
   */
  const lastQueryKeyRef = useRef<string>("")
  useEffect(() => {
    const key = filterKey
    if (lastQueryKeyRef.current !== key) {
      lastQueryKeyRef.current = key
      clearCarList()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey])

  useEffect(() => {
    if (!canFetch) return
    const pages = q.data?.pages || []
    if (!pages.length) return

    // ✅ فقط cars صفحه‌های جدید
    const all = pages.flatMap((p: any) => p?.cars || [])
    addCarList(all)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data, canFetch])

  // ========= Infinite Scroll observer =========
  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return
      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const first = entries[0]
          if (!first?.isIntersecting) return
          if (!canFetch) return
          if (q.isFetchingNextPage) return
          if (!q.hasNextPage) return
          q.fetchNextPage()
        },
        { root: null, threshold: 0, rootMargin: "250px 0px 250px 0px" }
      )

      observerRef.current.observe(node)
    },
    [q, canFetch]
  )

  useEffect(() => {
    return () => observerRef.current?.disconnect()
  }, [])

  const isLoading = canFetch ? q.isLoading : false
  const isLoadingMore = canFetch ? q.isFetchingNextPage : false
  const error = canFetch && q.isError ? ((q.error as any)?.message ?? t("errorLoading")) : null

  const renderStep = (step: number) => {
    return (
      <>
        {step === 1 && (
          <>
            {!canFetch ? null : (
              <SearchStepOne
                topOffset={topOffset}
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
              />
            )}
          </>
        )}

        {step === 2 && (
          <div className="sm:w-[90vw] max-w-334 m-auto px-0 sm:px-2">
            <InformationStep />
          </div>
        )}
      </>
    )
  }

  const stepSafe = roadMapStep || 1

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

      <div className="step-stage">
        <div className="step-layer">{renderStep(1)}</div>

        <AnimatePresence initial={false}>
          {stepSafe === 2 && (
            <motion.div
              key="step2-overlay"
              className="step-layer"
              initial={{ x: "100%" }}
              animate={{ x: "0%" }}
              exit={{ x: "100%" }}
              transition={{
                type: "tween",
                duration: 0.34,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{ willChange: "transform" }}
            >
              {renderStep(2)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
