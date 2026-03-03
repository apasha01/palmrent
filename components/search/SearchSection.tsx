"use client"

import { useDebounce } from "@/hooks/useDebounce"
import { useTranslations, useLocale } from "next-intl"
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { AnimatePresence, motion } from "framer-motion"
import { Search } from "lucide-react"
import { IconClose, IconFilter, IconSort } from "../Icons"

import SearchFilterSheet from "./SearchFilterSheet"
import {
  Icon7Plus,
  IconBusiness,
  IconCoupe,
  IconCrook,
  IconEconemy,
  IconLuxury,
  IconNoDeposite,
  IconSport,
  IconStandard,
  IconSuv,
} from "../Icons"

import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store"
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet"

import CAR_DATA from "@/lib/carsSuggestion.json"

type CarEntry = { brand: string; slug: string; models: string[] }
type Suggestion = { value: string; display: string; brand: string; isModel: boolean }

const PARAM_Q = "search_title"
const PARAM_BRAND = "brand"
const PARAM_SORT = "sort"
const PARAM_CATS = "categories"

const MAX_SUGGESTIONS = 10

const POPULAR_BRANDS: string[] = [
  "Toyota",
  "Hyundai",
  "Kia",
  "Nissan",
  "Honda",
  "Volkswagen",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Ford",
]

const FA_TO_BRAND: Record<string, string> = {
  "بی ام و": "BMW",
  "بی‌ام‌و": "BMW",
  "بی‌ ام‌ و": "BMW",
  "بی ام": "BMW",
  "بی‌ام": "BMW",
  "بی امو": "BMW",
  "بیامو": "BMW",
  "بیام و": "BMW",
  "بى ام و": "BMW",
  "bmw": "BMW",

  "مرسدس": "Mercedes-Benz",
  "مرسدس بنز": "Mercedes-Benz",
  "مرسدس‌بنز": "Mercedes-Benz",
  "بنز": "Mercedes-Benz",

  "آئودی": "Audi",
  "اودی": "Audi",

  "تویوتا": "Toyota",
  "هیوندای": "Hyundai",
  "کیا": "Kia",
  "نیسان": "Nissan",
  "هوندا": "Honda",
  "فولکس": "Volkswagen",
  "فولکس واگن": "Volkswagen",
  "فولکس‌واگن": "Volkswagen",
  "فورد": "Ford",
}

const normalize = (s: string) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[‌ـ]/g, " ") // نیم‌فاصله و کشیده
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/\s+/g, " ")

const noSpace = (s: string) => normalize(s).replace(/\s+/g, "")

const FA_TO_BRAND_NORM: Record<string, string> = Object.fromEntries(
  Object.entries(FA_TO_BRAND).map(([k, v]) => [normalize(k), v])
)

function resolveBrandFromFaQuery(raw: string): string | null {
  const q = normalize(raw)
  if (!q) return null

  const qNS = noSpace(raw)

  // ✅ از "بی" به بعد (نه فقط "ب")
  if (qNS.length < 2) return null

  let bestKey = ""
  let bestVal: string | null = null

  const qTokens = q.split(" ").filter(Boolean)

  for (const [kNorm, brand] of Object.entries(FA_TO_BRAND_NORM)) {
    const kNS = noSpace(kNorm)

    // 1) چسبیده/بدون فاصله
    const hitNoSpace = kNS.includes(qNS) || qNS.includes(kNS)

    // 2) توکنی (بی ام) داخل (بی ام و)
    const kTokens = kNorm.split(" ").filter(Boolean)
    const hitTokens =
      qTokens.length > 0 && qTokens.every((qt) => kTokens.some((kt) => kt.includes(qt) || qt.includes(kt)))

    const hit = hitNoSpace || hitTokens
    if (!hit) continue

    // بهترین = کلید طولانی‌تر (دقیق‌تر)
    if (kNorm.length > bestKey.length) {
      bestKey = kNorm
      bestVal = brand
    }
  }

  return bestVal
}

const buildSuggestion = (brand: string, model?: string): Suggestion => {
  if (!model) return { value: brand, display: brand, brand, isModel: false }
  const v = `${brand} ${model}`
  return { value: v, display: v, brand, isModel: true }
}

const ALL_SUGGESTIONS: Suggestion[] = (CAR_DATA as CarEntry[]).flatMap(({ brand, models }) => [
  buildSuggestion(brand),
  ...models.map((m) => buildSuggestion(brand, m)),
])

const DEFAULT_SUGGESTIONS: Suggestion[] =
  POPULAR_BRANDS.map((b) => buildSuggestion(b)).slice(0, MAX_SUGGESTIONS)

function uniqBrands(arr: string[]) {
  const out: string[] = []
  const seen = new Set<string>()
  for (const x of arr || []) {
    const v = String(x || "").trim()
    if (!v) continue
    if (seen.has(v)) continue
    seen.add(v)
    out.push(v)
  }
  return out
}

export function SerarchSection({
  searchDisable = false,
  containerClassName,
  carListLength = 0,
}: {
  searchDisable?: boolean
  containerClassName?: string
  carListLength?: number
}) {
  const t = useTranslations()
  const locale = useLocale()
  const isRtl = locale === "fa" || locale === "ar"

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // zustand
  const sort = useSearchPageStore((s) => s.sort)
  const setSort = useSearchPageStore((s) => s.setSort)
  const selectedCategories = useSearchPageStore((s) => s.selectedCategories)
  const toggleSelectedCategory = useSearchPageStore((s) => s.toggleSelectedCategory)
  const search_title = useSearchPageStore((s) => s.search_title)
  const setSearchTitle = useSearchPageStore((s) => s.setSearchTitle)

  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [searchValue, setSearchValue] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const debouncedSearch = useDebounce(searchValue, 800)

  const didMountRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  const userTypedRef = useRef(false)
  const lastAppliedQRef = useRef<string>("__INIT__")

  // ✅ قفل sync تا رسیدن URL به مقصد (رفع کامل غیب شدن badge / تاخیر حذف فیلتر)
  const suppressUrlSyncRef = useRef(false)
  const pendingParamsRef = useRef<string | null>(null)

  const ignoreNextDebounceRef = useRef(false)

  const scrollToTop = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (typeof window === "undefined") return
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior })
      })
    })
  }, [])

  const pushURL = useCallback(
    (patch: { q?: string; brands?: string[]; sortVal?: string | null; cats?: number[] }) => {
      const p = new URLSearchParams(searchParams.toString())

      const q = patch.q !== undefined ? patch.q : (search_title || "")
      const brands = patch.brands !== undefined ? patch.brands : selectedBrands
      const sortVal = patch.sortVal !== undefined ? patch.sortVal : sort
      const cats = patch.cats !== undefined ? patch.cats : selectedCategories

      if (q && String(q).trim()) p.set(PARAM_Q, String(q).trim())
      else p.delete(PARAM_Q)

      const cleanBrands = uniqBrands(brands)
      if (cleanBrands.length) p.set(PARAM_BRAND, cleanBrands.join(","))
      else p.delete(PARAM_BRAND)

      if (sortVal && String(sortVal).trim()) p.set(PARAM_SORT, String(sortVal).trim())
      else p.delete(PARAM_SORT)

      if (cats.length) p.set(PARAM_CATS, cats.join(","))
      else p.delete(PARAM_CATS)

      const nextParams = p.toString()

      pendingParamsRef.current = nextParams
      suppressUrlSyncRef.current = true

      router.replace(`${pathname}?${nextParams}`, { scroll: false })
    },
    [searchParams, search_title, selectedBrands, sort, selectedCategories, pathname, router]
  )

  /**
   * ✅ Sync from URL (با قفل ضد باگ)
   */
  useEffect(() => {
    const currentParams = searchParams.toString()

    if (suppressUrlSyncRef.current && pendingParamsRef.current) {
      if (currentParams !== pendingParamsRef.current) {
        didMountRef.current = true
        return
      }
      suppressUrlSyncRef.current = false
      pendingParamsRef.current = null
    }

    const q = searchParams.get(PARAM_Q) || ""
    const brandsRaw = searchParams.get(PARAM_BRAND) || ""
    const sortRaw = searchParams.get(PARAM_SORT) || ""

    const urlBrands = brandsRaw ? uniqBrands(brandsRaw.split(",").filter(Boolean)) : []
    if (selectedBrands.join(",") !== urlBrands.join(",")) setSelectedBrands(urlBrands)

    if (sortRaw) {
      if (sortRaw !== (sort ?? "")) setSort(sortRaw)
    } else {
      if (sort !== null) setSort(null)
    }

    if (q !== search_title) setSearchTitle(q)
    lastAppliedQRef.current = q

    if (!userTypedRef.current) {
      if (searchValue !== q) setSearchValue(q)
    }

    didMountRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  /**
   * ✅ تایپ کاربر → debounce → apply q
   */
  useEffect(() => {
    if (!didMountRef.current) return
    if (!userTypedRef.current) return

    if (ignoreNextDebounceRef.current) {
      ignoreNextDebounceRef.current = false
      userTypedRef.current = false
      return
    }

    const nextQ = (debouncedSearch ?? "").trim()

    if (lastAppliedQRef.current === nextQ) {
      userTypedRef.current = false
      return
    }

    lastAppliedQRef.current = nextQ
    setSearchTitle(nextQ)
    pushURL({ q: nextQ })

    scrollToTop("smooth")

    userTypedRef.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  // outside click close
  useEffect(() => {
    const fn = (e: Event) => {
      const target = e.target as Node
      if (
        !inputRef.current?.contains(target) &&
        !dropRef.current?.contains(target) &&
        !barRef.current?.contains(target)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", fn)
    document.addEventListener("touchstart", fn, { passive: true })

    return () => {
      document.removeEventListener("mousedown", fn)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      document.removeEventListener("touchstart", fn as any)
    }
  }, [])

  const suggestions = useMemo<Suggestion[]>(() => {
    const qNorm = normalize(searchValue)

    if (!qNorm) return DEFAULT_SUGGESTIONS

    const mappedBrand = resolveBrandFromFaQuery(qNorm)
    const q2 = mappedBrand ? normalize(mappedBrand) : qNorm

    const matches = ALL_SUGGESTIONS.filter((s) => normalize(s.value).includes(q2))
    const brandsFirst = matches.filter((s) => !s.isModel)
    const modelsAfter = matches.filter((s) => s.isModel)

    return [...brandsFirst, ...modelsAfter].slice(0, MAX_SUGGESTIONS)
  }, [searchValue])

  const handleSuggestionClick = (s: Suggestion) => {
    setShowSuggestions(false)

    const brandOnly = s.brand
    const nextBrands = selectedBrands.includes(brandOnly)
      ? selectedBrands.filter((b) => b !== brandOnly)
      : uniqBrands([...selectedBrands, brandOnly])

    setSelectedBrands(nextBrands)

    ignoreNextDebounceRef.current = true
    userTypedRef.current = false
    lastAppliedQRef.current = ""
    setSearchValue("")
    setSearchTitle("")
    inputRef.current?.blur()

    pushURL({ q: "", brands: nextBrands })

    scrollToTop("smooth")
  }

  const handleInputChange = (vRaw: string) => {
    const v = vRaw
    userTypedRef.current = true
    setSearchValue(v)
    setShowSuggestions(true)

    if (!v.trim()) {
      ignoreNextDebounceRef.current = true
      userTypedRef.current = false
      lastAppliedQRef.current = ""
      setSearchTitle("")
      pushURL({ q: "" })
      setShowSuggestions(false)
    }
  }

  const handleRemoveBrand = (brand: string) => {
    const nextBrands = selectedBrands.filter((b) => b !== brand)

    setSelectedBrands(nextBrands)
    pushURL({ brands: nextBrands })
    scrollToTop("smooth")
  }

  const handleSortChange = (sortType: string) => {
    setSort(sortType)
    pushURL({ sortVal: sortType })
    scrollToTop("smooth")
  }

  const handleClearSort = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSort(null)
    pushURL({ sortVal: null })
    scrollToTop("smooth")
  }

  const handleCategoryToggle = (id: number) => {
    const next = selectedCategories.includes(id)
      ? selectedCategories.filter((c) => c !== id)
      : [...selectedCategories, id]

    toggleSelectedCategory(id)
    pushURL({ cats: next })
    scrollToTop("smooth")
  }

  const sortList = useMemo(
    () => [
      { id: 14, icon: <IconNoDeposite />, title: "noDeposite" },
      { id: 3, icon: <IconEconemy />, title: "economicCar" },
      { id: 13, icon: <IconLuxury />, title: "luxCar" },
      { id: 15, icon: <Icon7Plus />, title: "sevenplus" },
      { id: 19, icon: <IconSport />, title: "sport" },
      { id: 18, icon: <IconBusiness />, title: "business" },
      { id: 21, icon: <IconCrook />, title: "crook" },
      { id: 17, icon: <IconStandard />, title: "standard" },
      { id: 9, icon: <IconSuv />, title: "suv" },
      { id: 20, icon: <IconCoupe />, title: "coupe" },
    ],
    []
  )

  const selectedCategoryItems = useMemo(
    () => sortList.filter((x) => selectedCategories.includes(x.id)),
    [sortList, selectedCategories]
  )

  const hasChips = selectedBrands.length > 0 || selectedCategoryItems.length > 0

  return (
    <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
      <div
        className={cn(
          "relative bg-white z-[20]",
          "transition-all",
          "sm:rounded-lg rounded-none",
          "sm:shadow-[0_4px_20px_0px_rgba(0,0,0,.06)]",
          "sm:p-4 p-2 max-sm:py-3 m-0",
          "max-sm:border-t-0 text-nowrap border border-[#E0E0E0]",
          containerClassName
        )}
      >
        <div className="relative space-y-2">
          <div
            ref={barRef}
            className="rounded-md flex items-center p-4 sm:py-2 py-1 relative mb-2 border border-[#0000001f]"
          >
            <span className="text-[#4b5259] shrink-0">
              <Search size={20} />
            </span>

            <div className="relative w-full">
              <input
                ref={inputRef}
                value={searchValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                type="search"
                placeholder={t("carSearch")}
                className="w-full px-2 outline-0 placeholder:text-[#4b5259] text-[16px] sm:text-xs leading-none"
              />
            </div>

            <div className="flex items-center gap-1 text-[#75736F] shrink-0">
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 rtl:border-l ltr:border-r border-[#4b5259] px-2 cursor-pointer"
                >
                  <span className="text-[#626262]">
                    <span className="sm:hidden"><IconFilter size="22" /></span>
                    <span className="max-sm:hidden"><IconFilter size="20" /></span>
                  </span>
                  <span className="max-sm:hidden text-sm">{t("filters")}</span>
                </button>
              </SheetTrigger>

              <div className="flex relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="flex items-center gap-1 cursor-pointer">
                      <span className="text-[#626262]">
                        <span className="max-sm:hidden"><IconSort size="22" className={undefined} /></span>
                        <span className="sm:hidden"><IconSort size="20" className={undefined} /></span>
                      </span>
                      <span className="max-sm:hidden text-sm">{sort ? t(sort) : t("sort")}</span>
                      {sort && (
                        <span onClick={handleClearSort} className="size-4 transition-all flex items-center overflow-hidden">
                          <IconClose className={undefined} />
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="start"
                    className="z-[999] flex flex-col bg-white p-2 border border-[#cccccc] rounded-lg shadow-none"
                  >
                    <DropdownMenuItem
                      className="text-[#4b5259] p-2 px-3 text-nowrap border-b lg:border-b-0 hover:bg-[#f8fafb] lg:rounded-lg cursor-pointer text-xs"
                      onClick={() => handleSortChange("price_min")}
                    >
                      {t("price_min")}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="text-[#4b5259] p-2 px-3 text-nowrap border-b lg:border-b-0 hover:bg-[#f8fafb] lg:rounded-lg cursor-pointer text-xs"
                      onClick={() => handleSortChange("price_max")}
                    >
                      {t("price_max")}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="text-[#4b5259] p-2 px-3 text-nowrap hover:bg-[#f8fafb] lg:rounded-lg cursor-pointer text-xs"
                      onClick={() => handleSortChange("new")}
                    >
                      {t("sort1")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  ref={dropRef}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className={cn(
                    "absolute top-[calc(100%+8px)] left-0 right-0",
                    "bg-white border border-[#E8E8E8] rounded-xl",
                    "shadow-[0_8px_24px_rgba(0,0,0,0.08)]",
                    "z-[20] overflow-hidden"
                  )}
                >
                  <div className="p-2 max-h-[46vh] overflow-auto overscroll-contain">
                    {suggestions.map((item, i) => {
                      const isActive = selectedBrands.includes(item.brand)
                      return (
                        <motion.button
                          key={`${item.value}-${i}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          type="button"
                          onPointerDown={(e) => e.preventDefault()}
                          onClick={() => handleSuggestionClick(item)}
                          className={cn(
                            "w-full text-left flex items-center justify-between gap-2",
                            "px-3 py-[7px] rounded-lg text-xs transition-colors cursor-pointer",
                            isActive
                              ? "bg-[#EBF4FF] text-[#0077db]"
                              : "text-[#333] hover:bg-[#F5F8FC] hover:text-[#0077db]"
                          )}
                        >
                          <span>{item.display}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {searchDisable && <div className="absolute inset-0 bg-white/25 pointer-events-none z-5 rounded-md" />}
          </div>

          {hasChips && (
            <div className="w-full overflow-auto hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex md:gap-2 gap-1">
                {selectedBrands.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => handleRemoveBrand(brand)}
                    className="flex shrink-0 items-center gap-2 p-2 h-8.25 rounded-lg transition-all text-xs bg-[#3B82F61A] border border-[#0077db] text-[#0077db] cursor-pointer mb-2 select-none"
                  >
                    <span className="truncate">{brand}</span>
                    <span className="size-3 flex items-center text-[#0077db]">
                      <IconClose className={undefined} />
                    </span>
                  </button>
                ))}

                {selectedCategoryItems.map((item) => (
                  <label key={item.id} className="flex gap-2 mb-2 select-none shrink-0">
                    <input onChange={() => handleCategoryToggle(item.id)} checked={true} className="peer hidden" type="checkbox" readOnly />
                    <div className="p-2 h-[33px] rounded-lg transition-all text-xs peer-checked:bg-[#3B82F61A] border border-[#0077db] peer-checked:text-[#0077db] flex gap-2 cursor-pointer items-center">
                      {t(item.title)}
                      <span className="size-3 flex items-center text-[#0077db]">
                        <IconClose className={undefined} />
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="block md:flex-nowrap flex-wrap items-center justify-between gap-2 lg:text-sm md:text-xs text-xs relative">
            <div className="flex md:w-auto w-full items-start gap-2 lg:text-sm md:text-xs text-xs">
              <div className="w-full block overflow-auto hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex md:gap-2 gap-1">
                  {sortList
                    .filter((item) => !selectedCategories.includes(item.id))
                    .map((item) => (
                      <label key={item.id} className="flex gap-2 select-none">
                        <input checked={false} onChange={() => handleCategoryToggle(item.id)} className="peer hidden" value={item.id} type="checkbox" readOnly />
                        <div className="p-2 h-[33px] rounded-lg border text-xs border-[#0000001f] text-[#4b5259] transition-all peer-checked:bg-[#7CABF9] sm:hover:bg-[#3B82F61A] sm:hover:text-[#3B82F6] peer-checked:text-white flex gap-2 cursor-pointer items-center">
                          {item.icon}
                          {t(item.title)}
                        </div>
                      </label>
                    ))}
                </div>
              </div>
            </div>

            {searchDisable && <div className="absolute inset-0 bg-white/25 pointer-events-none z-[5] rounded-lg" />}
          </div>
        </div>
      </div>

      <SheetContent side={isRtl ? "left" : "right"} className="w-full max-w-md p-0 bg-white shadow-2xl border-l">
        <SearchFilterSheet closePopup={() => setFiltersOpen(false)} carListLength={carListLength} />
      </SheetContent>
    </Sheet>
  )
}