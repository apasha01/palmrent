/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useTranslations, useLocale } from "next-intl"
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

import { AnimatePresence, motion } from "framer-motion"
import { CalendarDays, Check, Search, X } from "lucide-react"
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
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../ui/drawer"
import { DateRangePickerPopover } from "@/components/custom/calender/date-range-picker"
import { jalaliToDate, formatJalaliDate } from "@/lib/date-utils"
import { normalizeTime } from "@/lib/rent-days"

type CarEntry = { brand: string; slug: string; models: string[] }
type Suggestion = { value: string; display: string; brand: string; isModel: boolean }

const PARAM_Q = "search_title"
const PARAM_BRAND = "brand"
const PARAM_SORT = "sort"
const PARAM_CATS = "categories"
const PARAM_FROM = "from"
const PARAM_TO = "to"
const PARAM_DT = "dt"
const PARAM_RT = "rt"

const MAX_SUGGESTIONS = 10

const POPULAR_BRANDS: string[] = [
  "Toyota",
  "Mercedes-Benz",
  "Kia",
  "Hyundai",
  "Mitsubishi",
  "Nissan",
  "Chevrolet",
  "BMW",
  "Fiat",
  "Renault",
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
  "بی": "BMW",
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
  "میتسوبیشی": "Mitsubishi",
  "میتسو": "Mitsubishi",
  "شورلت": "Chevrolet",
  "شورولت": "Chevrolet",
  "فیات": "Fiat",
  "رنو": "Renault",
}

const normalize = (s: string) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[‌ـ]/g, " ")
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
  if (qNS.length < 1) return null

  let bestKey = ""
  let bestVal: string | null = null

  const qTokens = q.split(" ").filter(Boolean)

  for (const [kNorm, brand] of Object.entries(FA_TO_BRAND_NORM)) {
    const kNS = noSpace(kNorm)
    const hitNoSpace = kNS.startsWith(qNS) || qNS.startsWith(kNS)

    const kTokens = kNorm.split(" ").filter(Boolean)
    const hitTokens =
      qTokens.length > 0 &&
      qTokens.every((qt) =>
        kTokens.some((kt) => kt.startsWith(qt) || qt.startsWith(kt))
      )

    if (!(hitNoSpace || hitTokens)) continue

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

const ALL_SUGGESTIONS: Suggestion[] = (CAR_DATA as CarEntry[]).flatMap(
  ({ brand, models }) => [buildSuggestion(brand), ...models.map((m) => buildSuggestion(brand, m))]
)

const DEFAULT_SUGGESTIONS: Suggestion[] = POPULAR_BRANDS.map((b) => buildSuggestion(b)).slice(
  0,
  MAX_SUGGESTIONS
)

function uniqBrands(arr: string[]) {
  const out: string[] = []
  const seen = new Set<string>()

  for (const x of arr || []) {
    const v = String(x || "").trim()
    if (!v || seen.has(v)) continue
    seen.add(v)
    out.push(v)
  }

  return out
}

function toEnglishDigits(input: string) {
  const fa = "۰۱۲۳۴۵۶۷۸۹"
  const ar = "٠١٢٣٤٥٦٧٨٩"

  return String(input)
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

function normalizeJalaliString(s: string) {
  return toEnglishDigits(s).replace(/-/g, "/").trim()
}

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

function normalizeJalaliParam(input?: string | null) {
  if (!input) return null

  const clean = toEnglishDigits(String(input)).replace(/-/g, "/").trim()
  const [y, m, d] = clean.split("/").map((x) => parseInt(x, 10))

  if (!y || !m || !d) return null

  return `${y}/${pad2(m)}/${pad2(d)}`
}

function toPersianDigits(input: string) {
  const en = "0123456789"
  const fa = "۰۱۲۳۴۵۶۷۸۹"

  return String(input).replace(/[0-9]/g, (d) => fa[en.indexOf(d)])
}

function parseJalaliToDateNoon(s?: string | null) {
  const norm = normalizeJalaliParam(s)
  if (!norm) return null

  const [y, m, d] = norm.split("/").map((x) => parseInt(x, 10))
  if (!y || !m || !d) return null

  const date = jalaliToDate(y, m - 1, d)
  if (!date) return null

  date.setHours(12, 0, 0, 0)
  return date
}

function safeTime(input: any, fallback: string) {
  const n = normalizeTime(input)
  if (!n || typeof n !== "string" || n.length < 4) return fallback
  return n
}

function formatShortDate(dateString?: string | null, locale?: string) {
  const norm = normalizeJalaliParam(dateString)
  if (!norm) return ""
  return locale === "fa" ? toPersianDigits(norm) : norm
}

// ─────────────────────────────────────────
// ✅ Sort Drawer
// ─────────────────────────────────────────
function SortDrawer({
  open,
  onClose,
  currentSort,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  currentSort: string | null
  onSelect: (val: string | null) => void
}) {
  const t = useTranslations()

  const sortItems: { id: string | null; label: string; sub?: string }[] = [
    { id: null, label: "پیشنهاد پالم رنت" },
    { id: "price_min", label: t("price_min") },
    { id: "price_max", label: t("price_max") },
    { id: "new", label: t("sort1") },
  ]

  const activeId = currentSort ?? null

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      <DrawerContent>
        <div className="w-full max-w-3xl mx-auto">
          <DrawerHeader className="flex flex-row items-center justify-between px-5 py-2.5 border-b border-gray-100 dark:border-gray-800 space-y-0">
            <DrawerTitle className="font-bold text-sm text-gray-900 dark:text-gray-100">
              مرتب‌سازی
            </DrawerTitle>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
            >
              <X className="size-4" />
            </button>
          </DrawerHeader>

          <div className="py-2 px-3 w-full overflow-auto max-h-[calc(85vh-56px)]">
            {sortItems.map((item, idx) => {
              const isActive = activeId === item.id

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onSelect(item.id)
                    onClose()
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-3",
                    "px-4 py-3 rounded-xl text-sm transition-all mb-0.5 last:mb-0",
                    isActive
                      ? "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <div className="flex flex-col items-start gap-0.5 text-right">
                    <span className="font-medium">{item.label}</span>
                    {item.sub && (
                      <span
                        className={cn(
                          "text-xs",
                          isActive
                            ? "text-blue-400 dark:text-blue-500"
                            : "text-gray-400 dark:text-gray-500"
                        )}
                      >
                        {item.sub}
                      </span>
                    )}
                  </div>

                  <span
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                      isActive
                        ? "border-blue-600 bg-blue-600 dark:border-blue-400 dark:bg-blue-400"
                        : "border-gray-300 dark:border-gray-600"
                    )}
                  >
                    {isActive && <Check className="size-3 text-white dark:text-gray-900" />}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="h-5" />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

// ─────────────────────────────────────────
// ✅ Main Component
// ─────────────────────────────────────────
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

  const sort = useSearchPageStore((s) => s.sort)
  const setSort = useSearchPageStore((s) => s.setSort)
  const selectedCategories = useSearchPageStore((s) => s.selectedCategories)
  const toggleSelectedCategory = useSearchPageStore((s) => s.toggleSelectedCategory)

  const search_title = useSearchPageStore((s) => s.search_title)
  const setSearchTitle = useSearchPageStore((s) => s.setSearchTitle)

  const storeBrands = useSearchPageStore((s) => s.selectedBrands)
  const setStoreBrands = useSearchPageStore((s) => s.setSelectedBrands)

  const carDates = useSearchPageStore((s) => s.carDates)
  const setCarDates = useSearchPageStore((s) => s.setCarDates)

  const deliveryTime = useSearchPageStore((s) => s.deliveryTime)
  const setDeliveryTime = useSearchPageStore((s) => s.setDeliveryTime)

  const returnTime = useSearchPageStore((s) => s.returnTime)
  const setReturnTime = useSearchPageStore((s) => s.setReturnTime)

  const [searchValue, setSearchValue] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sortDrawerOpen, setSortDrawerOpen] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  const suppressUrlSyncRef = useRef(false)
  const pendingParamsRef = useRef<string | null>(null)

  const dtFallback = useMemo(() => safeTime(deliveryTime, "10:00"), [deliveryTime])
  const rtFallback = useMemo(() => safeTime(returnTime, "10:00"), [returnTime])

  const hasDates = Boolean(carDates?.[0] && carDates?.[1])

  const initialRange = useMemo(() => {
    const start = parseJalaliToDateNoon(carDates?.[0] ?? null)
    const end = parseJalaliToDateNoon(carDates?.[1] ?? null)
    return { start, end }
  }, [carDates?.[0], carDates?.[1]])

  const scrollToTop = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (typeof window === "undefined") return

    requestAnimationFrame(() =>
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior }))
    )
  }, [])

  const deliveryDateText = useMemo(
    () => formatShortDate(carDates?.[0] ?? null, locale),
    [carDates?.[0], locale]
  )

  const returnDateText = useMemo(
    () => formatShortDate(carDates?.[1] ?? null, locale),
    [carDates?.[1], locale]
  )

  const dateChipLabel = useMemo(() => {
    if (!hasDates) return ""

    const dtText = locale === "fa" ? toPersianDigits(dtFallback) : dtFallback
    const rtText = locale === "fa" ? toPersianDigits(rtFallback) : rtFallback

    return `${deliveryDateText} (${dtText}) - ${returnDateText} (${rtText})`
  }, [hasDates, locale, dtFallback, rtFallback, deliveryDateText, returnDateText])

  const popoverKey = useMemo(() => {
    const f = normalizeJalaliParam(carDates?.[0] ?? "") ?? ""
    const to = normalizeJalaliParam(carDates?.[1] ?? "") ?? ""
    return `search-dates-${f}-${to}-${dtFallback}-${rtFallback}`
  }, [carDates?.[0], carDates?.[1], dtFallback, rtFallback])

  const pushURL = useCallback(
    (patch: {
      q?: string
      brands?: string[]
      sortVal?: string | null
      cats?: number[]
      from?: string | null
      to?: string | null
      dt?: string | null
      rt?: string | null
    }) => {
      const p = new URLSearchParams(searchParams.toString())

      const q = patch.q !== undefined ? patch.q : (search_title || "")
      const brands = patch.brands !== undefined ? patch.brands : storeBrands
      const sortVal = "sortVal" in patch ? patch.sortVal : sort
      const cats = patch.cats !== undefined ? patch.cats : selectedCategories

      const fromVal = patch.from !== undefined ? patch.from : (carDates?.[0] ?? null)
      const toVal = patch.to !== undefined ? patch.to : (carDates?.[1] ?? null)
      const dtVal = patch.dt !== undefined ? patch.dt : dtFallback
      const rtVal = patch.rt !== undefined ? patch.rt : rtFallback

      if (q && String(q).trim()) p.set(PARAM_Q, String(q).trim())
      else p.delete(PARAM_Q)

      const cleanBrands = uniqBrands(brands)
      if (cleanBrands.length) p.set(PARAM_BRAND, cleanBrands.join(","))
      else p.delete(PARAM_BRAND)

      if (sortVal && String(sortVal).trim()) p.set(PARAM_SORT, String(sortVal).trim())
      else p.delete(PARAM_SORT)

      if (cats.length) p.set(PARAM_CATS, cats.join(","))
      else p.delete(PARAM_CATS)

      if (fromVal && String(fromVal).trim()) p.set(PARAM_FROM, String(fromVal).trim())
      else p.delete(PARAM_FROM)

      if (toVal && String(toVal).trim()) p.set(PARAM_TO, String(toVal).trim())
      else p.delete(PARAM_TO)

      if (fromVal && dtVal && String(dtVal).trim()) p.set(PARAM_DT, String(dtVal).trim())
      else p.delete(PARAM_DT)

      if (toVal && rtVal && String(rtVal).trim()) p.set(PARAM_RT, String(rtVal).trim())
      else p.delete(PARAM_RT)

      const nextParams = p.toString()
      pendingParamsRef.current = nextParams
      suppressUrlSyncRef.current = true

      const nextUrl = nextParams ? `${pathname}?${nextParams}` : pathname
      router.replace(nextUrl, { scroll: false })
    },
    [
      searchParams,
      search_title,
      storeBrands,
      sort,
      selectedCategories,
      carDates,
      dtFallback,
      rtFallback,
      pathname,
      router,
    ]
  )

  useEffect(() => {
    const currentParams = searchParams.toString()

    if (suppressUrlSyncRef.current && pendingParamsRef.current) {
      if (currentParams !== pendingParamsRef.current) return

      suppressUrlSyncRef.current = false
      pendingParamsRef.current = null
    }

    const q = searchParams.get(PARAM_Q) || ""
    const brandsRaw = searchParams.get(PARAM_BRAND) || ""
    const sortRaw = searchParams.get(PARAM_SORT) || ""

    const fromRaw = normalizeJalaliParam(searchParams.get(PARAM_FROM))
    const toRaw = normalizeJalaliParam(searchParams.get(PARAM_TO))
    const dtRaw = safeTime(searchParams.get(PARAM_DT), "10:00")
    const rtRaw = safeTime(searchParams.get(PARAM_RT), "10:00")

    const urlBrands = brandsRaw ? uniqBrands(brandsRaw.split(",").filter(Boolean)) : []

    if (storeBrands.join(",") !== urlBrands.join(",")) setStoreBrands(urlBrands)

    if (sortRaw) {
      if (sortRaw !== (sort ?? "")) setSort(sortRaw)
    } else {
      if (sort !== null) setSort(null)
    }

    if (q !== search_title) setSearchTitle(q)

    const currentFrom = normalizeJalaliParam(carDates?.[0] ?? null)
    const currentTo = normalizeJalaliParam(carDates?.[1] ?? null)

    if (currentFrom !== fromRaw || currentTo !== toRaw) {
      setCarDates([fromRaw, toRaw])
    }

    if (safeTime(deliveryTime, "10:00") !== dtRaw) {
      setDeliveryTime(dtRaw)
    }

    if (safeTime(returnTime, "10:00") !== rtRaw) {
      setReturnTime(rtRaw)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

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
      document.removeEventListener("touchstart", fn as any)
    }
  }, [])

  const suggestions = useMemo<Suggestion[]>(() => {
    const qNorm = normalize(searchValue)
    if (!qNorm) return DEFAULT_SUGGESTIONS

    const mappedBrand = resolveBrandFromFaQuery(qNorm)
    const q2 = mappedBrand ? normalize(mappedBrand) : qNorm

    const matches = ALL_SUGGESTIONS.filter((s) => normalize(s.value).includes(q2))

    return [...matches.filter((s) => !s.isModel), ...matches.filter((s) => s.isModel)].slice(
      0,
      MAX_SUGGESTIONS
    )
  }, [searchValue])

  const handleSuggestionClick = (s: Suggestion) => {
    setShowSuggestions(false)

    const brandOnly = s.brand
    const nextBrands = storeBrands.includes(brandOnly)
      ? storeBrands.filter((b) => b !== brandOnly)
      : uniqBrands([...storeBrands, brandOnly])

    setStoreBrands(nextBrands)
    setSearchTitle("")
    setSearchValue("")
    inputRef.current?.blur()

    pushURL({ q: "", brands: nextBrands })
    scrollToTop("smooth")
  }

  const handleInputChange = (vRaw: string) => {
    setSearchValue(vRaw)
    setShowSuggestions(true)

    if (!vRaw.trim()) {
      setShowSuggestions(false)
    }
  }

  const commitSearch = useCallback(() => {
    const raw = (searchValue || "").trim()

    if (!raw) {
      setShowSuggestions(false)
      return
    }

    setShowSuggestions(false)

    const maybeBrand = resolveBrandFromFaQuery(raw)

    if (maybeBrand) {
      const brandOnly = maybeBrand
      const nextBrands = storeBrands.includes(brandOnly)
        ? storeBrands
        : uniqBrands([...storeBrands, brandOnly])

      setStoreBrands(nextBrands)
      setSearchTitle("")
      setSearchValue("")
      inputRef.current?.blur()

      pushURL({ q: "", brands: nextBrands })
      scrollToTop("smooth")
      return
    }

    setSearchTitle(raw)
    setSearchValue("")
    inputRef.current?.blur()

    pushURL({ q: raw })
    scrollToTop("smooth")
  }, [searchValue, storeBrands, pushURL, scrollToTop, setSearchTitle, setStoreBrands])

  const handleRemoveBrand = (brand: string) => {
    const nextBrands = storeBrands.filter((b) => b !== brand)
    setStoreBrands(nextBrands)
    pushURL({ brands: nextBrands })
    scrollToTop("smooth")
  }

  const handleRemoveSearchChip = () => {
    setSearchTitle("")
    pushURL({ q: "" })
    scrollToTop("smooth")
  }

  const handleSortSelect = (val: string | null) => {
    setSort(val)
    pushURL({ sortVal: val })
    scrollToTop("smooth")
  }

  const handleRemoveSortChip = () => {
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

  const handleDateConfirm = ({
    start,
    end,
    deliveryTime: dtRaw,
    returnTime: rtRaw,
  }: any) => {
    if (!start || !end) return

    const s = new Date(start)
    const e = new Date(end)

    s.setHours(12, 0, 0, 0)
    e.setHours(12, 0, 0, 0)

    const fromRaw = normalizeJalaliString(formatJalaliDate(s))
    const toRaw = normalizeJalaliString(formatJalaliDate(e))

    const fromStr = normalizeJalaliParam(fromRaw)
    const toStr = normalizeJalaliParam(toRaw)

    if (!fromStr || !toStr) return

    const safeDt = safeTime(dtRaw, dtFallback)
    const safeRt = safeTime(rtRaw, rtFallback)

    setCarDates([fromStr, toStr])
    setDeliveryTime(safeDt)
    setReturnTime(safeRt)

    pushURL({
      from: fromStr,
      to: toStr,
      dt: safeDt,
      rt: safeRt,
    })

    scrollToTop("smooth")
  }

  const handleClearDates = () => {
    setCarDates([null, null])
    setDeliveryTime("10:00")
    setReturnTime("10:00")

    pushURL({
      from: null,
      to: null,
      dt: null,
      rt: null,
    })

    scrollToTop("smooth")
  }

  const handleSheetOpenChange = (open: boolean) => {
    setFiltersOpen(open)

    if (!open) {
      pushURL({ brands: storeBrands })
      scrollToTop("smooth")
    }
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

  const hasSearchChip = !!(search_title && String(search_title).trim())
  const hasSortChip = !!sort

  const hasChips =
    hasSearchChip ||
    hasSortChip ||
    storeBrands.length > 0 ||
    selectedCategoryItems.length > 0

  const sortLabel = useMemo(() => {
    if (!sort) return "پیشنهاد پالم رنت"
    if (sort === "price_min") return t("price_min")
    if (sort === "price_max") return t("price_max")
    if (sort === "new") return t("sort1")
    return "پیشنهاد پالم رنت"
  }, [sort, t])

  const dateTrigger = (
    <DateRangePickerPopover
      key={popoverKey}
      initialRange={initialRange}
      defaultIsJalali={true}
      initialTimes={{ deliveryTime: dtFallback, returnTime: rtFallback }}
      onConfirm={handleDateConfirm}
      onClear={handleClearDates}
      trigger={
        <button
          type="button"
          className={cn(
            "flex shrink-0 items-center gap-2 p-2 h-[33px] rounded-lg border text-xs",
            "border-[#0000001f] text-[#4b5259] transition-all cursor-pointer",
            "sm:hover:bg-[#3B82F61A] sm:hover:text-[#3B82F6]"
          )}
        >
          <CalendarDays className="size-4" />
          <span>{hasDates ? dateChipLabel : "انتخاب تاریخ"}</span>
        </button>
      }
    />
  )

  return (
    <>
      <Sheet open={filtersOpen} onOpenChange={handleSheetOpenChange}>
        <div
          className={cn(
            "relative bg-white z-20",
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      commitSearch()
                    }

                    if (e.key === "Escape") {
                      setShowSuggestions(false)
                      inputRef.current?.blur()
                    }
                  }}
                  type="search"
                  placeholder={t("carSearch")}
                  className="w-full px-2 outline-0 placeholder:text-[#4b5259] text-[14px] sm:text-xs leading-none"
                />
              </div>

              {!!searchValue.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchValue("")
                    setShowSuggestions(false)
                    inputRef.current?.focus()
                  }}
                  className="p-1 rounded-md hover:bg-gray-100 text-gray-400 shrink-0"
                  aria-label="clear"
                >
                  <X className="size-4" />
                </button>
              )}

              <div className="flex items-center gap-1 text-[#75736F] shrink-0">
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 rtl:border-l ltr:border-r border-[#4b5259] px-2 cursor-pointer"
                  >
                    <span className="text-[#626262]">
                      <span className="sm:hidden">
                        <IconFilter size="22" />
                      </span>
                      <span className="max-sm:hidden">
                        <IconFilter size="20" />
                      </span>
                    </span>

                    <span className="max-sm:hidden text-sm">{t("filters")}</span>
                  </button>
                </SheetTrigger>

                <button
                  type="button"
                  onClick={() => setSortDrawerOpen(true)}
                  className="flex items-center gap-1 cursor-pointer relative"
                >
                  <span className="text-[#626262]">
                    <span className="max-sm:hidden">
                      <IconSort size="22" className={undefined} />
                    </span>
                    <span className="sm:hidden">
                      <IconSort size="20" className={undefined} />
                    </span>
                  </span>

                  <span className="max-sm:hidden text-sm text-[#4b5259]">
                    {sort ? sortLabel : "مرتب‌سازی"}
                  </span>

                  {sort && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500 sm:hidden" />
                  )}
                </button>
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
                      "z-20 overflow-hidden"
                    )}
                  >
                    <div className="p-2 max-h-[46vh] overflow-auto overscroll-contain">
                      {suggestions.map((item, i) => {
                        const isActive = storeBrands.includes(item.brand)

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
                              "px-3 py-1.75 rounded-lg text-xs transition-colors cursor-pointer",
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

              {searchDisable && (
                <div className="absolute inset-0 bg-white/25 pointer-events-none z-5 rounded-md" />
              )}
            </div>

            {hasChips && (
              <div className="w-full overflow-auto hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex md:gap-2 gap-1">
                  {hasSearchChip && (
                    <button
                      type="button"
                      onClick={handleRemoveSearchChip}
                      className="flex shrink-0 items-center gap-2 p-2 h-8.25 rounded-lg transition-all text-xs bg-[#3B82F61A] border border-[#0077db] text-[#0077db] cursor-pointer mb-2 select-none"
                      title={String(search_title)}
                    >
                      <span className="truncate">{String(search_title)}</span>
                      <span className="size-3 flex items-center text-[#0077db]">
                        <IconClose className={undefined} />
                      </span>
                    </button>
                  )}

                  {hasSortChip && (
                    <button
                      type="button"
                      onClick={handleRemoveSortChip}
                      className="flex shrink-0 items-center gap-2 p-2 h-8.25 rounded-lg transition-all text-xs bg-[#3B82F61A] border border-[#0077db] text-[#0077db] cursor-pointer mb-2 select-none"
                      title={sortLabel}
                    >
                      <span className="truncate">{sortLabel}</span>
                      <span className="size-3 flex items-center text-[#0077db]">
                        <IconClose className={undefined} />
                      </span>
                    </button>
                  )}

                  {storeBrands.map((brand) => (
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
                      <input
                        onChange={() => handleCategoryToggle(item.id)}
                        checked={true}
                        className="peer hidden"
                        type="checkbox"
                        readOnly
                      />
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
                    {!hasDates && dateTrigger}

                    {sortList
                      .filter((item) => !selectedCategories.includes(item.id))
                      .map((item) => (
                        <label key={item.id} className="flex gap-2 select-none">
                          <input
                            checked={false}
                            onChange={() => handleCategoryToggle(item.id)}
                            className="peer hidden"
                            value={item.id}
                            type="checkbox"
                            readOnly
                          />
                          <div className="p-2 h-[33px] rounded-lg border text-xs border-[#0000001f] text-[#4b5259] transition-all peer-checked:bg-[#7CABF9] sm:hover:bg-[#3B82F61A] sm:hover:text-[#3B82F6] peer-checked:text-white flex gap-2 cursor-pointer items-center">
                            {item.icon}
                            {t(item.title)}
                          </div>
                        </label>
                      ))}
                  </div>
                </div>
              </div>

              {searchDisable && (
                <div className="absolute inset-0 bg-white/25 pointer-events-none z-[5] rounded-lg" />
              )}
            </div>
          </div>
        </div>

        <SheetContent
          side={isRtl ? "left" : "right"}
          className="w-full max-w-md p-0 bg-white shadow-2xl border-l"
        >
          <SearchFilterSheet
            closePopup={() => setFiltersOpen(false)}
            carListLength={carListLength}
          />
        </SheetContent>
      </Sheet>

      <SortDrawer
        open={sortDrawerOpen}
        onClose={() => setSortDrawerOpen(false)}
        currentSort={sort}
        onSelect={handleSortSelect}
      />
    </>
  )
}