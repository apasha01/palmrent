/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useLocale, useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

// shadcn/ui
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Slider } from "@/components/ui/slider"

// lucide
import { Building2, Car, Check, ChevronDown, DollarSign, RefreshCw, Search, Settings2, Sparkles, X } from "lucide-react"

// zustand
import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store"

type Props = {
  closePopup?: () => void
  carListLength?: number
}

const TOP_BRANDS = [
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

const EXTRA_BRANDS = [
  "Audi",
  "Volkswagen",
  "Ford",
  "Honda",
  "Lexus",
  "Porsche",
  "Land Rover",
  "Jeep",
  "Dodge",
  "Infiniti",
  "Mazda",
  "Subaru",
  "Volvo",
  "Peugeot",
  "Citroën",
]

const ALL_BRANDS = [...TOP_BRANDS, ...EXTRA_BRANDS]

export default function SearchFilterSheet({ closePopup, carListLength = 0 }: Props) {
  const t = useTranslations()
  const locale = useLocale()
  const isRtl = locale === "fa" || locale === "ar"

  const selectedCategories = useSearchPageStore((s) => s.selectedCategories)
  const resetCategories = useSearchPageStore((s) => s.resetCategories)
  const selectedBrands = useSearchPageStore((s) => s.selectedBrands)
  const resetBrands = useSearchPageStore((s) => s.resetBrands)

  const handleReset = () => {
    resetCategories()
    resetBrands()
  }

  const hasAnyFilter = selectedCategories.length > 0 || selectedBrands.length > 0

  const filterGroups = useMemo(
    () => [
      {
        title: "نوع خودرو",
        icon: <Car className="size-4" />,
        shouldTranslate: true,
        items: [
          { id: 3, title: "economicCar" },
          { id: 13, title: "luxCar" },
          { id: 9, title: "suv" },
          { id: 19, title: "sport" },
          { id: 15, title: "sevenplus" },
          { id: 21, title: "crook" },
        ],
      },
      {
        title: "گیربکس",
        icon: <Settings2 className="size-4" />,
        shouldTranslate: true,
        items: [
          { id: 901, title: "automatic" },
          { id: 902, title: "geared" },
        ],
      },
      {
        title: "امکانات",
        icon: <Sparkles className="size-4" />,
        shouldTranslate: true,
        items: [
          { id: 14, title: "noDeposite" },
          { id: 2, title: "freeDelivery" },
          { id: 4, title: "unlimitedKilometers" },
        ],
      },
    ],
    []
  )

  return (
    <div className={cn("dark:bg-gray-950", isRtl ? "text-right" : "text-left")}>
      <div className="p-5 border-b border-gray-200 dark:border-gray-900 dark:bg-gray-950">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{t("filters")}</div>
          <div className="flex items-center gap-3">
            {hasAnyFilter && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
                className="text-red-500 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 h-auto"
              >
                <RefreshCw className="size-4" />
                <span className="hidden sm:inline">حذف فیلترها</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-88px-88px)]">
        <div className="p-5 pb-6 space-y-8 dark:bg-gray-950">

          <section>
            <div className="flex items-center gap-2 mb-6 text-gray-900 dark:text-gray-100">
              <span className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-blue-600 dark:text-blue-400">
                <DollarSign className="size-5" />
              </span>
              <h3 className="font-bold">بازه قیمتی (روزانه)</h3>
            </div>
            <div className="px-2">
              <PriceRange isRtl={isRtl} />
            </div>
          </section>

          <Separator className="bg-gray-200 dark:bg-gray-800" />

          <section>
            <div className="flex items-center gap-2 mb-4 text-gray-900 dark:text-gray-100">
              <span className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-400">
                <Building2 className="size-4" />
              </span>
              <h3 className="font-bold">برند</h3>
              {selectedBrands.length > 0 && (
                <span className="mr-auto text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                  {selectedBrands.length} انتخاب شده
                </span>
              )}
            </div>
            <BrandSection />
          </section>

          <Separator className="bg-gray-200 dark:bg-gray-800" />

          {filterGroups.map((group, index) => (
            <div key={index}>
              <div className="flex items-center gap-2 mb-4 text-gray-900 dark:text-gray-100">
                <span className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-400">
                  {group.icon}
                </span>
                <h3 className="font-bold">{group.title}</h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <FilterChip
                    key={item.id}
                    id={item.id}
                    label={group.shouldTranslate ? t(item.title) : item.title}
                  />
                ))}
              </div>

              {index < filterGroups.length - 1 && (
                <Separator className="bg-gray-200 dark:bg-gray-800 mt-6" />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="px-2 pt-4 border-t">
        <Button
          type="button"
          onClick={closePopup}
          className={cn(
            "w-full font-bold text-lg py-7 rounded-xl transition-all",
            "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white",
            "flex justify-between px-6"
          )}
        >
          <span>مشاهده نتایج</span>
          <Badge className="bg-white/20 text-white hover:bg-white/20 px-2 py-0.5 rounded text-sm flex items-center">
            {carListLength} خودرو
          </Badge>
        </Button>
      </div>
    </div>
  )
}

function BrandSection() {
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState(false)
  const selectedBrands = useSearchPageStore((s) => s.selectedBrands)

  const isSearching = query.trim().length > 0

  const visibleBrands = useMemo(() => {
    if (isSearching) {
      const q = query.toLowerCase().trim()
      return ALL_BRANDS.filter((b) => b.toLowerCase().includes(q))
    }
    if (expanded) return ALL_BRANDS
    return TOP_BRANDS
  }, [query, expanded, isSearching])

  const selectedExtraCount = EXTRA_BRANDS.filter((b) => selectedBrands.includes(b)).length

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-gray-900 focus-within:border-blue-400 focus-within:bg-white dark:focus-within:bg-gray-800 transition-all">
        <Search className="size-4 text-gray-400 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجوی برند..."
          className="w-full text-sm outline-none bg-transparent placeholder:text-gray-400 text-gray-800 dark:text-gray-200"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleBrands.length > 0 ? (
          visibleBrands.map((brand) => (
            <BrandFilterChip key={brand} brandName={brand} />
          ))
        ) : (
          <p className="text-sm text-gray-400 py-2">برندی پیدا نشد</p>
        )}
      </div>

      {!isSearching && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium mt-1 hover:text-blue-700 transition-colors"
        >
          <ChevronDown
            className={cn("size-3.5 transition-transform duration-200", expanded && "rotate-180")}
          />
          {expanded
            ? "نمایش کمتر"
            : `نمایش بیشتر${selectedExtraCount > 0 ? ` (${selectedExtraCount} انتخاب شده)` : ""}`}
        </button>
      )}
    </div>
  )
}

// ✅ استایل انتخاب‌شده: border آبی، bg سفید، text آبی، تیک آبی
function FilterChip({ id, label }: { id: number; label: string }) {
  const selectedCategories = useSearchPageStore((s) => s.selectedCategories)
  const toggleSelectedCategory = useSearchPageStore((s) => s.toggleSelectedCategory)
  const isSelected = selectedCategories.includes(id)

  return (
    <button
      type="button"
      onClick={() => toggleSelectedCategory(id)}
      className={cn(
        "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 select-none",
        "flex items-center gap-1.5 h-auto border",
        isSelected
          ? "border-blue-500 text-blue-600 bg-white dark:bg-gray-950 dark:text-blue-400 dark:border-blue-400"
          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
      )}
    >
      {isSelected && <Check className="size-3.5 text-blue-500 dark:text-blue-400 shrink-0" />}
      {label}
    </button>
  )
}

// ✅ استایل انتخاب‌شده: border آبی، bg سفید، text آبی، تیک آبی
function BrandFilterChip({ brandName }: { brandName: string }) {
  const selectedBrands = useSearchPageStore((s) => s.selectedBrands)
  const toggleSelectedBrand = useSearchPageStore((s) => s.toggleSelectedBrand)
  const isSelected = selectedBrands.includes(brandName)

  return (
    <button
      type="button"
      onClick={() => toggleSelectedBrand(brandName)}
      className={cn(
        "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 select-none",
        "flex items-center gap-1.5 h-auto border",
        isSelected
          ? "border-blue-500 text-blue-600 bg-white dark:bg-gray-950 dark:text-blue-400 dark:border-blue-400"
          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
      )}
    >
      {isSelected && <Check className="size-3.5 text-blue-500 dark:text-blue-400 shrink-0" />}
      {brandName}
    </button>
  )
}

function PriceRange({ isRtl }: { isRtl: boolean }) {
  const priceRange = useSearchPageStore((s) => s.priceRange)
  const selectedPriceRange = useSearchPageStore((s) => s.selectedPriceRange)
  const setSelectedPriceRange = useSearchPageStore((s) => s.setSelectedPriceRange)
  const currency = useSearchPageStore((s) => s.currency) || "AED"

  const safePriceRange = priceRange && priceRange.length === 2 ? priceRange : ([0, 50000] as [number, number])
  const MIN_LIMIT = Math.min(...safePriceRange)
  const MAX_LIMIT = Math.max(...safePriceRange)

  const [values, setValues] = useState<[number, number]>([MIN_LIMIT, MAX_LIMIT])

  useEffect(() => {
    if (selectedPriceRange && selectedPriceRange.length === 2) {
      setValues([Math.min(...selectedPriceRange), Math.max(...selectedPriceRange)])
    } else {
      setValues([MIN_LIMIT, MAX_LIMIT])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceRange, selectedPriceRange?.[0], selectedPriceRange?.[1]])

  const commit = (v: number[]) => {
    if (v?.length >= 2) setSelectedPriceRange([v[0], v[1]])
  }

  return (
    <div className="w-full pt-2" dir={isRtl ? "rtl" : "ltr"}>
      <div className="px-1 pt-3">
        <Slider
          min={MIN_LIMIT}
          max={MAX_LIMIT}
          step={10}
          value={values}
          onValueChange={(v) => setValues([v[0], v[1]] as [number, number])}
          onValueCommit={commit}
          className="w-full"
        />
      </div>

      <div className="flex justify-between items-center mt-5 text-gray-700 dark:text-gray-400">
        <div className="flex flex-col items-center border border-gray-300 dark:border-gray-700 rounded-lg p-2 px-3 min-w-[100px] bg-white dark:bg-gray-950">
          <span className="text-[10px] text-gray-500 dark:text-gray-500">حداقل</span>
          <span className="font-bold text-sm text-center text-gray-900 dark:text-gray-100" dir="ltr">
            {values[0].toLocaleString()} <small className="text-[10px]">{currency}</small>
          </span>
        </div>

        <div className="w-4 h-[2px] bg-gray-300 dark:bg-gray-700" />

        <div className="flex flex-col items-center border border-gray-300 dark:border-gray-700 rounded-lg p-2 px-3 min-w-[100px] bg-white dark:bg-gray-950">
          <span className="text-[10px] text-gray-500 dark:text-gray-500">حداکثر</span>
          <span className="font-bold text-sm text-center text-gray-900 dark:text-gray-100" dir="ltr">
            {values[1].toLocaleString()} <small className="text-[10px]">{currency}</small>
          </span>
        </div>
      </div>
    </div>
  )
}