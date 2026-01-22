// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client"

// import { Suspense } from "react"
// import { useLocale, useTranslations } from "next-intl"
// import { usePathname, useRouter, useSearchParams } from "next/navigation"
// import { useCallback, useEffect, useMemo, useRef, useState } from "react"
// import { useDispatch, useSelector } from "react-redux"

// // Components
// import SearchHeader from "@/components/search/search-header"
// import DescriptionPopup from "@/components/DescriptionPopup"
// import Footer from "@/components/Footer"
// import Header from "@/components/layouts/Header"
// import InformationStep from "@/components/InformationStep"
// import PopupReels from "@/components/PopupReels"
// import SearchFilterSheet from "@/components/search/SearchFilterSheet"
// import SearchPopup from "@/components/SearchPopup"
// import StepRent from "@/components/search/StepsRent"


// // Redux & Utils
// import { api } from "@/lib/apiClient"
// import { addCarList, clearCarList, selectCar } from "@/redux/slices/carListSlice"
// import { changeCarDates, changeRoadMapStep } from "@/redux/slices/globalSlice"
// import {
//   changePriceRange,
//   changeSearchCurrency,
//   changeSearchTitle,
//   changeSelectedCategories,
//   changeSort,
// } from "@/redux/slices/searchSlice"
// import SearchStepOne from "@/components/reserve-steps/SearchStepOne"

// function SearchResultPageContent() {
//   const dispatch = useDispatch()
//   const t = useTranslations()
//   const locale = useLocale()
//   const searchParams = useSearchParams()
//   const router = useRouter()
//   const pathname = usePathname()

//   // ✅ offset زیر Header (هدر شما fixed و 64px هست)
//   const isHeaderClose = useSelector((state: any) => state.global.isHeaderClose)
//   const topOffset = isHeaderClose ? 0 : 64

//   // -- Redux State --
//   const carList = useSelector((state: any) => state.carList.carList)
//   const roadMapStep = useSelector((state: any) => state.global.roadMapStep)
//   const isReelActive = useSelector((state: any) => state.reels.isReelActive)
//   const isSearchOpen = useSelector((state: any) => state.global.isSearchOpen)
//   const isFilterOpen = useSelector((state: any) => state.global.isFilterOpen)
//   const descriptionPopup = useSelector((state: any) => state.global.descriptionPopup)
//   const carDates = useSelector((state: any) => state.global.carDates)

//   // Filters (همه‌چیز از Redux، ولی branch_id فقط از URL میاد)
//   const filterSort = useSelector((state: any) => state.search.sort)
//   const filterCats = useSelector((state: any) => state.search.selectedCategories)
//   const filterPrice = useSelector((state: any) => state.search.selectedPriceRange)
//   const filterTitle = useSelector((state: any) => state.search.search_title)

//   // -- Local State --
//   const [isLoading, setIsLoading] = useState(true)
//   const [isLoadingMore, setIsLoadingMore] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [hasMore, setHasMore] = useState(true)
//   const [isMounted, setIsMounted] = useState(false)

//   // ========= ✅ Refs (ضد لوپ / ضد stale) =========
//   const observerRef = useRef<IntersectionObserver | null>(null)
//   const loadingRef = useRef(false) // قفل درخواست
//   const pageRef = useRef(1) // صفحه واقعی
//   const hasMoreRef = useRef(true) // hasMore واقعی
//   const carCountRef = useRef(0)

//   useEffect(() => {
//     carCountRef.current = carList?.length || 0
//   }, [carList?.length])

//   // ========= ✅ branch_id فقط از URL =========
//   const branchIdFromUrl = useMemo(() => {
//     const raw = searchParams.get("branch_id")
//     if (!raw) return null
//     const n = Number(raw)
//     if (!Number.isFinite(n) || n <= 0) return null
//     return n
//   }, [searchParams])

//   // ========= ✅ Sticky sentinel + CSS fade-in (SAFE) =========
//   const sentinelRef = useRef<HTMLDivElement | null>(null)
//   const [stuck, setStuck] = useState(false)
//   const [playFade, setPlayFade] = useState(false)

//   const stuckRef = useRef(false)
//   const animatedRef = useRef(false)

//   useEffect(() => {
//     const el = sentinelRef.current
//     if (!el) return

//     const io = new IntersectionObserver(
//       ([entry]) => {
//         const nowStuck = !entry.isIntersecting

//         if (nowStuck !== stuckRef.current) {
//           stuckRef.current = nowStuck
//           setStuck(nowStuck)

//           if (nowStuck && !animatedRef.current) {
//             animatedRef.current = true
//             setPlayFade(true)
//           }

//           if (!nowStuck && animatedRef.current) {
//             animatedRef.current = false
//             setPlayFade(false)
//           }
//         }
//       },
//       {
//         threshold: 0,
//         rootMargin: `-${topOffset}px 0px 0px 0px`,
//       }
//     )

//     io.observe(el)
//     return () => io.disconnect()
//   }, [topOffset])

//   // ========= ✅ Step slide animation (FULL like apps) =========
//   const ANIM_MS = 340
//   const prevStepRef = useRef<number>(roadMapStep || 1)

//   const [activeStepForUI, setActiveStepForUI] = useState<number>(roadMapStep || 1)
//   const [leavingStep, setLeavingStep] = useState<number | null>(null)
//   const [animDir, setAnimDir] = useState<"forward" | "back">("forward")
//   const [isAnimating, setIsAnimating] = useState(false)

//   const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

//   useEffect(() => {
//     const prev = prevStepRef.current || 1
//     const next = roadMapStep || 1
//     if (prev === next) return

//     if (animTimerRef.current) clearTimeout(animTimerRef.current)

//     setAnimDir(next > prev ? "forward" : "back")
//     setLeavingStep(activeStepForUI) // خروجی همون صفحه‌ای که الان UI نشون میده
//     setActiveStepForUI(next) // ورودی همزمان رندر میشه
//     setIsAnimating(true)

//     prevStepRef.current = next

//     animTimerRef.current = setTimeout(() => {
//       setLeavingStep(null)
//       setIsAnimating(false)
//     }, ANIM_MS)

//     return () => {
//       if (animTimerRef.current) clearTimeout(animTimerRef.current)
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [roadMapStep])

//   // ========= ✅ Params key (برای تشخیص تغییر واقعی فیلترها) =========
//   const filterKey = useMemo(() => {
//     return JSON.stringify({
//       // ✅ branch_id از URL
//       branchIdFromUrl: branchIdFromUrl ?? "MISSING",
//       from: carDates?.[0] || "",
//       to: carDates?.[1] || "",
//       sort: filterSort || "price_min",
//       title: filterTitle || "",
//       cats: (filterCats || []).join(","),
//       minp: filterPrice?.length === 2 ? Math.min(...filterPrice) : "",
//       maxp: filterPrice?.length === 2 ? Math.max(...filterPrice) : "",
//       locale,
//       step: roadMapStep,
//     })
//   }, [branchIdFromUrl, carDates, filterSort, filterTitle, filterCats, filterPrice, locale, roadMapStep])

//   // ========= ✅ 1) URL -> Redux Sync (Fix Back/Forward UI restore) =========
//   const syncFromUrl = useCallback(() => {
//     const from = searchParams.get("from")
//     const to = searchParams.get("to")
//     const cats = searchParams.get("categories")
//     const stepParam = searchParams.get("step")
//     const carIdParam = searchParams.get("car_id")
//     const sortParam = searchParams.get("sort")
//     const searchTitleParam = searchParams.get("search_title")

//     if (from && to) dispatch(changeCarDates([from, to]))
//     if (cats) dispatch(changeSelectedCategories(cats.split(",").map(Number)))
//     if (sortParam) dispatch(changeSort(sortParam))
//     if (searchTitleParam) dispatch(changeSearchTitle(searchTitleParam))

//     const stepNum = stepParam ? Number(stepParam) : 1
//     const safeStep = Number.isFinite(stepNum) && stepNum > 0 ? stepNum : 1

//     if (carIdParam) {
//       const carIdNum = Number(carIdParam)
//       if (Number.isFinite(carIdNum) && carIdNum > 0) {
//         dispatch(selectCar(carIdNum))
//       }
//     }

//     dispatch(changeRoadMapStep(safeStep))
//   }, [searchParams, dispatch])

//   useEffect(() => {
//     syncFromUrl()
//     if (!isMounted) setIsMounted(true)
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [syncFromUrl])

//   // ========= ✅ Fetch (branch_id فقط از URL / بدون default) =========
//   const fetchCars = useCallback(
//     async (isLoadMore = false) => {
//       if (roadMapStep !== 1) return

//       if (!branchIdFromUrl) {
//         setIsLoading(false)
//         setIsLoadingMore(false)
//         hasMoreRef.current = false
//         setHasMore(false)
//         setError("branch_id در آدرس صفحه وجود ندارد یا نامعتبر است.")
//         return
//       }

//       if (!carDates?.[0] || !carDates?.[1]) {
//         setIsLoading(false)
//         setIsLoadingMore(false)
//         return
//       }

//       if (isLoadMore && !hasMoreRef.current) return
//       if (loadingRef.current) return
//       loadingRef.current = true

//       const nextPage = isLoadMore ? pageRef.current + 1 : 1

//       if (isLoadMore) setIsLoadingMore(true)
//       else setIsLoading(true)

//       setError(null)

//       const bodyData = {
//         branch_id: branchIdFromUrl,
//         from: carDates[0],
//         to: carDates[1],
//         sort: filterSort || "price_min",
//         search_title: filterTitle || "",
//         page: nextPage,
//         min_p: filterPrice?.length === 2 ? Math.min(...filterPrice) : "0",
//         max_p: filterPrice?.length === 2 ? Math.max(...filterPrice) : "50000",
//         cat_id: filterCats || [],
//       }

//       console.log("=== SEARCH API REQUEST ===")
//       console.log("URL:", `${pathname}?${searchParams.toString()}`)
//       console.log("locale:", locale)
//       console.log("endpoint:", `/car/filter/${locale}`)
//       console.log("body:", bodyData)
//       console.log("==========================")

//       try {
//         const response = await api.post(`/car/filter/${locale}`, bodyData)
//         if (response.status !== 200) throw new Error("Invalid response status")

//         const { cars, currency, min_price, max_price, count_cars } = response.data

//         dispatch(changeSearchCurrency(currency))

//         if (!isLoadMore && (!filterPrice || filterPrice.length === 0)) {
//           dispatch(changePriceRange([min_price, max_price]))
//         }

//         if (!cars || cars.length === 0) {
//           hasMoreRef.current = false
//           setHasMore(false)
//           return
//         }

//         const existingIds = new Set((carList || []).map((c: any) => c?.id))
//         const uniqueCars = cars.filter((c: any) => !existingIds.has(c?.id))

//         if (uniqueCars.length === 0) {
//           hasMoreRef.current = false
//           setHasMore(false)
//           return
//         }

//         dispatch(addCarList(uniqueCars))

//         const loadedBefore = isLoadMore ? carCountRef.current : 0
//         const loadedAfter = loadedBefore + uniqueCars.length

//         if (typeof count_cars === "number" && loadedAfter >= count_cars) {
//           hasMoreRef.current = false
//           setHasMore(false)
//         } else {
//           hasMoreRef.current = true
//           setHasMore(true)
//           pageRef.current = nextPage
//         }
//       } catch (err) {
//         console.error("Search Fetch Error:", err)
//         hasMoreRef.current = false
//         setHasMore(false)
//         if (!isLoadMore) setError(t("errorLoading") || "خطا در بارگذاری")
//       } finally {
//         loadingRef.current = false
//         setIsLoading(false)
//         setIsLoadingMore(false)
//       }
//     },
//     [
//       roadMapStep,
//       branchIdFromUrl,
//       carDates,
//       filterSort,
//       filterTitle,
//       filterPrice,
//       filterCats,
//       locale,
//       dispatch,
//       t,
//       carList,
//       pathname,
//       searchParams,
//     ]
//   )

//   // ========= ✅ Reset + Fetch when filters change =========
//   useEffect(() => {
//     if (!isMounted || roadMapStep !== 1) return

//     const params = new URLSearchParams(searchParams.toString())

//     if (filterSort) params.set("sort", filterSort)
//     else params.delete("sort")

//     if (filterTitle) params.set("search_title", filterTitle)
//     else params.delete("search_title")

//     if (filterCats?.length) params.set("categories", filterCats.join(","))
//     else params.delete("categories")

//     if (filterPrice?.length === 2) {
//       params.set("min_p", String(Math.min(...filterPrice)))
//       params.set("max_p", String(Math.max(...filterPrice)))
//     } else {
//       params.delete("min_p")
//       params.delete("max_p")
//     }

//     router.replace(`${pathname}?${params.toString()}`, { scroll: false })

//     dispatch(clearCarList())
//     setError(null)

//     pageRef.current = 1
//     hasMoreRef.current = true
//     setHasMore(true)

//     setIsLoading(true)
//     setIsLoadingMore(false)

//     fetchCars(false)
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [filterKey])

//   // ========= ✅ Infinite Scroll observer =========
//   const lastElementRef = useCallback(
//     (node: HTMLDivElement | null) => {
//       if (!node) return
//       if (observerRef.current) observerRef.current.disconnect()

//       observerRef.current = new IntersectionObserver(
//         (entries) => {
//           const first = entries[0]
//           if (!first?.isIntersecting) return
//           if (loadingRef.current) return
//           if (!hasMoreRef.current) return
//           if (error) return
//           fetchCars(true)
//         },
//         {
//           root: null,
//           threshold: 0,
//           rootMargin: "250px 0px 250px 0px",
//         }
//       )

//       observerRef.current.observe(node)
//     },
//     [fetchCars, error]
//   )

//   useEffect(() => {
//     return () => {
//       observerRef.current?.disconnect()
//     }
//   }, [])

//   // ========= ✅ Step renderer =========
//   const renderStep = (step: number) => {
//     return (
//       <>
//         {step === 1 && (
//           <SearchStepOne
//             isHeaderClose={isHeaderClose}
//             stuck={stuck}
//             playFade={playFade}
//             isLoading={isLoading}
//             isLoadingMore={isLoadingMore}
//             error={error}
//             carList={carList || []}
//             sentinelRef={sentinelRef}
//             lastElementRef={lastElementRef}
//             onRetry={() => {
//               hasMoreRef.current = true
//               setHasMore(true)
//               pageRef.current = 1
//               dispatch(clearCarList())
//               fetchCars(false)
//             }}
//             t={(key: string) => t(key)}
//           />
//         )}

//         {step === 2 && (
//           <div className="sm:w-[90vw] max-w-334 m-auto px-0 sm:px-2">
//             <InformationStep />
//           </div>
//         )}
//       </>
//     )
//   }

//   return (
//     <>
//       <Header shadowLess />

//       <div className="bg-white dark:bg-background">
//         <SearchHeader />
//       </div>

//       <div className="sm:w-[90vw] max-w-334 m-auto relative my-4 px-0 sm:px-2">
//         {(!searchParams.get("step") || Number(searchParams.get("step")) < 3) && (
//           <StepRent step={Number(roadMapStep)} />
//         )}
//       </div>

//       {/* ✅ FULL transition container */}
//       <div className={`step-stage ${isAnimating ? "is-animating" : ""}`}>
//         {/* Leaving (old) layer */}
//         {leavingStep !== null && (
//           <div className={`step-layer ${animDir === "forward" ? "exit-forward" : "exit-back"}`}>
//             {renderStep(leavingStep)}
//           </div>
//         )}

//         {/* Active (new) layer */}
//         <div
//           className={`step-layer ${
//             isAnimating ? (animDir === "forward" ? "enter-forward" : "enter-back") : ""
//           }`}
//         >
//           {renderStep(activeStepForUI)}
//         </div>
//       </div>

//       {isReelActive && <PopupReels />}
//       {isSearchOpen && <SearchPopup />}
//       {isFilterOpen && <SearchFilterSheet />}
//       {descriptionPopup?.description && <DescriptionPopup />}

//       <Footer />
//     </>
//   )
// }

// export default function SearchResultPage() {
//   return (
//     <Suspense fallback={null}>
//       <SearchResultPageContent />
//     </Suspense>
//   )
// }
