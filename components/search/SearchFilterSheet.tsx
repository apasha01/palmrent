/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useLocale, useTranslations } from "next-intl"
import type { ReactNode } from "react"
import { useMemo, useState } from "react"

import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"

import {
  ArrowRight,
  Building2,
  Car,
  ChevronUp,
  DollarSign,
  Fuel,
  Luggage,
  Search,
  Settings2,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react"

import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store"

type Props = {
  closePopup?: () => void
  carListLength?: number
}

type SortOption = {
  id: string | null
  labelKey: string
  defaultLabel: string
}

type TranslatedItem = {
  id: number
  labelKey: string
  defaultLabel: string
}

const TOP_BRANDS = [
  "Mercedes-Benz",
  "Toyota",
  "Kia",
  "Mitsubishi",
  "Ferrari",
  "Lamborghini",
  "Maserati",
  "MG",
  "Rolls-Royce",
  "BMW",
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
  "Hyundai",
  "Nissan",
  "Chevrolet",
  "Fiat",
  "Renault",
]

const ALL_BRANDS = [...TOP_BRANDS, ...EXTRA_BRANDS]

const SORT_OPTIONS: SortOption[] = [
  { id: null, labelKey: "palmrent_suggest", defaultLabel: "پیشنهاد پالم رنت" },
  { id: "price_min", labelKey: "price_min", defaultLabel: "ارزان‌ترین قیمت" },
  { id: "price_max", labelKey: "price_max", defaultLabel: "گران‌ترین قیمت" },
  { id: "new", labelKey: "sort1", defaultLabel: "جدیدترین" },
]

const CAR_CLASS_ITEMS: TranslatedItem[] = [
  { id: 3, labelKey: "economicCar", defaultLabel: "اقتصادی" },
  { id: 13, labelKey: "luxCar", defaultLabel: "لوکس" },
  { id: 7, labelKey: "businessCar", defaultLabel: "بیزینسی" },
  { id: 15, labelKey: "sevenplus", defaultLabel: "۷+ نفره" },
  { id: 9, labelKey: "suv", defaultLabel: "شاسی‌بلند / SUV" },
  { id: 21, labelKey: "crook", defaultLabel: "کوپه / کانورتیبل" },
  { id: 22, labelKey: "sedan", defaultLabel: "سدان" },
]

const GEARBOX_ITEMS: TranslatedItem[] = [
  { id: 901, labelKey: "automatic", defaultLabel: "اتوماتیک" },
  { id: 902, labelKey: "geared", defaultLabel: "دستی" },
  { id: 903, labelKey: "hybrid", defaultLabel: "هیبرید" },
]

const FUEL_ITEMS: TranslatedItem[] = [
  { id: 801, labelKey: "petrol", defaultLabel: "بنزینی" },
  { id: 802, labelKey: "diesel", defaultLabel: "گازوئیلی" },
  { id: 803, labelKey: "hybrid_fuel", defaultLabel: "هیبریدی" },
  { id: 804, labelKey: "electric", defaultLabel: "برقی" },
]

const SEAT_COUNT_ITEMS = [
  { id: 701, value: "1" },
  { id: 702, value: "2" },
  { id: 703, value: "3" },
  { id: 704, value: "4" },
  { id: 705, value: "5" },
  { id: 706, value: "6" },
  { id: 707, value: "7" },
  { id: 708, value: "8+" },
]

const LUGGAGE_ITEMS = [
  { id: 601, value: "1" },
  { id: 602, value: "2" },
  { id: 603, value: "3" },
  { id: 604, value: "4" },
  { id: 605, value: "5+" },
]

const AMENITY_ITEMS: TranslatedItem[] = [
  { id: 14, labelKey: "noDeposite", defaultLabel: "بدون ودیعه" },
  { id: 11, labelKey: "specialOffer", defaultLabel: "پیشنهاد ویژه" },
  { id: 12, labelKey: "hotelDelivery", defaultLabel: "تحویل درب هتل" },
  { id: 4, labelKey: "airportDelivery", defaultLabel: "تحویل در فرودگاه" },
]

function Divider() {
  return <div className="mx-0 h-px bg-gray-100" />
}

function getTranslatedLabel(
  t: ReturnType<typeof useTranslations>,
  item: { labelKey: string; defaultLabel: string }
) {
  try {
    return t(item.labelKey)
  } catch {
    return item.defaultLabel
  }
}

function formatNumberByLocale(value: number, locale: string) {
  if (locale === "fa") return value.toLocaleString("fa-IR")
  if (locale === "ar") return value.toLocaleString("ar-IQ")
  if (locale === "tr") return value.toLocaleString("tr-TR")
  return value.toLocaleString("en-US")
}

function SectionHeader({
  icon,
  title,
  open,
  onToggle,
}: {
  icon?: ReactNode
  title: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between py-1"
    >
      <div className="flex items-center gap-2">
        {icon && <span className="text-blue-500">{icon}</span>}
        <span className="text-sm font-bold text-gray-800">{title}</span>
      </div>

      <ChevronUp
        className={cn(
          "size-5 text-gray-400 transition-transform duration-200",
          !open && "rotate-180"
        )}
      />
    </button>
  )
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex w-full items-center justify-between rounded px-1 py-2 transition-colors hover:bg-gray-50"
    >
      <div
        className={cn(
          "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors",
          checked ? "border-blue-500 bg-blue-500" : "border-gray-300 bg-white"
        )}
      >
        {checked && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path
              d="M1 4L4 7.5L10 1"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      <span className="flex-1 pr-3 text-right text-sm text-gray-700">{label}</span>
    </button>
  )
}

function PillButton({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all duration-150",
        selected
          ? "border-gray-800 bg-gray-800 text-white"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
      )}
    >
      {label}
    </button>
  )
}

function PriceRange({
  isRtl,
  t,
  locale,
}: {
  isRtl: boolean
  t: ReturnType<typeof useTranslations>
  locale: string
}) {
  const priceRange = useSearchPageStore((s) => s.priceRange)
  const selectedPriceRange = useSearchPageStore((s) => s.selectedPriceRange)
  const setSelectedPriceRange = useSearchPageStore((s) => s.setSelectedPriceRange)
  const currency = useSearchPageStore((s) => s.currency) || "AED"

  const safePriceRange: [number, number] =
    priceRange && priceRange.length === 2 ? priceRange : [0, 50000]

  const MIN_LIMIT = Math.min(...safePriceRange)
  const MAX_LIMIT = Math.max(...safePriceRange)

  const controlledValues = useMemo<[number, number]>(() => {
    if (selectedPriceRange && selectedPriceRange.length === 2) {
      return [Math.min(...selectedPriceRange), Math.max(...selectedPriceRange)]
    }

    return [MIN_LIMIT, MAX_LIMIT]
  }, [MIN_LIMIT, MAX_LIMIT, selectedPriceRange])

  const [draftValues, setDraftValues] = useState<[number, number] | null>(null)
  const values = draftValues ?? controlledValues

  const handleValueChange = (v: number[]) => {
    if (v.length < 2) return
    setDraftValues([Math.min(v[0], v[1]), Math.max(v[0], v[1])])
  }

  const handleValueCommit = (v: number[]) => {
    if (v.length < 2) return

    const next: [number, number] = [Math.min(v[0], v[1]), Math.max(v[0], v[1])]
    setDraftValues(null)
    setSelectedPriceRange(next)
  }

  return (
    <div className="w-full" dir={isRtl ? "rtl" : "ltr"}>
      <div className="mb-5 flex items-center gap-3">
        <div className="relative flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 pb-1.5 pt-5">
          <span className="absolute right-3 top-1.5 text-[10px] text-gray-400">
            {t("priceMax")}
          </span>
          <span className="text-sm font-bold text-gray-900" dir="ltr">
            {formatNumberByLocale(values[1], locale)}
          </span>
          <span className="absolute bottom-1.5 left-3 text-[10px] text-gray-400">
            {currency}
          </span>
        </div>

        <div className="relative flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 pb-1.5 pt-5">
          <span className="absolute right-3 top-1.5 text-[10px] text-gray-400">
            {t("priceMin")}
          </span>
          <span className="text-sm font-bold text-gray-900" dir="ltr">
            {formatNumberByLocale(values[0], locale)}
          </span>
          <span className="absolute bottom-1.5 left-3 text-[10px] text-gray-400">
            {currency}
          </span>
        </div>
      </div>

      <Slider
        min={MIN_LIMIT}
        max={MAX_LIMIT}
        step={10}
        value={values}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        className="w-full"
      />
    </div>
  )
}

function BrandSection({
  t,
  locale,
}: {
  t: ReturnType<typeof useTranslations>
  locale: string
}) {
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState(false)

  const selectedBrands = useSearchPageStore((s) => s.selectedBrands)
  const toggleSelectedBrand = useSearchPageStore((s) => s.toggleSelectedBrand)

  const isSearching = query.trim().length > 0

  const visibleBrands = useMemo(() => {
    if (isSearching) {
      const q = query.toLowerCase().trim()
      return ALL_BRANDS.filter((b) => b.toLowerCase().includes(q))
    }

    return expanded ? ALL_BRANDS : TOP_BRANDS
  }, [query, expanded, isSearching])

  const selectedExtraCount = EXTRA_BRANDS.filter((b) => selectedBrands.includes(b)).length

  return (
    <div className="space-y-1">
      <div className="mb-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 transition-all focus-within:border-blue-400 focus-within:bg-white">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("brandSearchPlaceholder")}
          className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
          dir={locale === "fa" || locale === "ar" ? "rtl" : "ltr"}
        />

        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-gray-400 transition-colors hover:text-gray-600"
            aria-label={t("clear")}
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <Search className="size-4 shrink-0 text-gray-400" />
        )}
      </div>

      <div>
        {visibleBrands.length > 0 ? (
          visibleBrands.map((brand) => (
            <CheckboxRow
              key={brand}
              label={brand}
              checked={selectedBrands.includes(brand)}
              onChange={() => toggleSelectedBrand(brand)}
            />
          ))
        ) : (
          <p className="py-2 text-right text-sm text-gray-400">{t("noBrandFound")}</p>
        )}
      </div>

      {!isSearching && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 pt-1 text-sm font-medium text-blue-500 transition-colors hover:text-blue-600"
        >
          <ChevronUp
            className={cn(
              "size-3.5 transition-transform duration-200",
              !expanded && "rotate-180"
            )}
          />
          {expanded
            ? t("showLess")
            : selectedExtraCount > 0
              ? t("showMoreSelected", {
                  count: formatNumberByLocale(selectedExtraCount, locale),
                })
              : t("showMore")}
        </button>
      )}
    </div>
  )
}

function CarClassSection({
  selectedCategories,
  toggleSelectedCategory,
  t,
  locale,
}: {
  selectedCategories: number[]
  toggleSelectedCategory: (id: number) => void
  t: ReturnType<typeof useTranslations>
  locale: string
}) {
  const [expanded, setExpanded] = useState(false)
  const VISIBLE_COUNT = 5

  const visibleItems = expanded
    ? CAR_CLASS_ITEMS
    : CAR_CLASS_ITEMS.slice(0, VISIBLE_COUNT)

  const hiddenSelected = CAR_CLASS_ITEMS.slice(VISIBLE_COUNT).filter((i) =>
    selectedCategories.includes(i.id)
  ).length

  return (
    <div>
      {visibleItems.map((item) => {
        const label = getTranslatedLabel(t, item)

        return (
          <CheckboxRow
            key={item.id}
            label={label}
            checked={selectedCategories.includes(item.id)}
            onChange={() => toggleSelectedCategory(item.id)}
          />
        )
      })}

      {CAR_CLASS_ITEMS.length > VISIBLE_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 pt-1 text-sm font-medium text-blue-500 transition-colors hover:text-blue-600"
        >
          <ChevronUp
            className={cn(
              "size-3.5 transition-transform duration-200",
              !expanded && "rotate-180"
            )}
          />
          {expanded
            ? t("showLess")
            : hiddenSelected > 0
              ? t("showMoreSelected", {
                  count: formatNumberByLocale(hiddenSelected, locale),
                })
              : t("showMore")}
        </button>
      )}
    </div>
  )
}

export default function SearchFilterSheet({
  closePopup,
  carListLength = 0,
}: Props) {
  const t = useTranslations("SearchFilterSheet")
  const locale = useLocale()
  const isRtl = locale === "fa" || locale === "ar"

  const sort = useSearchPageStore((s) => s.sort)
  const setSort = useSearchPageStore((s) => s.setSort)

  const selectedCategories = useSearchPageStore((s) => s.selectedCategories)
  const toggleSelectedCategory = useSearchPageStore((s) => s.toggleSelectedCategory)
  const resetCategories = useSearchPageStore((s) => s.resetCategories)

  const selectedBrands = useSearchPageStore((s) => s.selectedBrands)
  const resetBrands = useSearchPageStore((s) => s.resetBrands)

  const selectedPriceRange = useSearchPageStore((s) => s.selectedPriceRange)
  const setSelectedPriceRange = useSearchPageStore((s) => s.setSelectedPriceRange)

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    sort: true,
    brand: true,
    price: true,
    carClass: true,
    gearbox: true,
    fuel: true,
    seats: true,
    luggage: true,
    amenities: false,
  })

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleReset = () => {
    resetCategories()
    resetBrands()
    setSelectedPriceRange(null)
    setSort(null)
  }

  const activeBadges = useMemo(() => {
    const badges: { key: string; label: string; onRemove: () => void }[] = []

    selectedBrands.forEach((b) =>
      badges.push({
        key: `brand-${b}`,
        label: b,
        onRemove: () => useSearchPageStore.getState().toggleSelectedBrand(b),
      })
    )

    selectedCategories.forEach((id) => {
      const classItem = CAR_CLASS_ITEMS.find((i) => i.id === id)
      if (classItem) {
        badges.push({
          key: `class-${id}`,
          label: getTranslatedLabel(t, classItem),
          onRemove: () => useSearchPageStore.getState().toggleSelectedCategory(id),
        })
        return
      }

      const gearItem = GEARBOX_ITEMS.find((i) => i.id === id)
      if (gearItem) {
        badges.push({
          key: `gear-${id}`,
          label: getTranslatedLabel(t, gearItem),
          onRemove: () => useSearchPageStore.getState().toggleSelectedCategory(id),
        })
        return
      }

      const fuelItem = FUEL_ITEMS.find((i) => i.id === id)
      if (fuelItem) {
        badges.push({
          key: `fuel-${id}`,
          label: getTranslatedLabel(t, fuelItem),
          onRemove: () => useSearchPageStore.getState().toggleSelectedCategory(id),
        })
        return
      }

      const seatItem = SEAT_COUNT_ITEMS.find((i) => i.id === id)
      if (seatItem) {
        badges.push({
          key: `seat-${id}`,
          label: seatItem.value,
          onRemove: () => useSearchPageStore.getState().toggleSelectedCategory(id),
        })
        return
      }

      const lugItem = LUGGAGE_ITEMS.find((i) => i.id === id)
      if (lugItem) {
        badges.push({
          key: `lug-${id}`,
          label: lugItem.value,
          onRemove: () => useSearchPageStore.getState().toggleSelectedCategory(id),
        })
        return
      }

      const amenityItem = AMENITY_ITEMS.find((i) => i.id === id)
      if (amenityItem) {
        badges.push({
          key: `amenity-${id}`,
          label: getTranslatedLabel(t, amenityItem),
          onRemove: () => useSearchPageStore.getState().toggleSelectedCategory(id),
        })
      }
    })

    if (sort) {
      const sortOpt = SORT_OPTIONS.find((s) => s.id === sort)
      if (sortOpt) {
        badges.push({
          key: `sort-field-${sort}`,
          label: getTranslatedLabel(t, sortOpt),
          onRemove: () => useSearchPageStore.getState().setSort(null),
        })
      }
    }

    if (selectedPriceRange?.length === 2) {
      badges.push({
        key: "price-range",
        label: `${formatNumberByLocale(selectedPriceRange[0], locale)} - ${formatNumberByLocale(
          selectedPriceRange[1],
          locale
        )}`,
        onRemove: () => useSearchPageStore.getState().setSelectedPriceRange(null),
      })
    }

    return badges
  }, [selectedBrands, selectedCategories, sort, selectedPriceRange, t, locale])

  const getSortLabel = (id: string | null): string => {
    const opt = SORT_OPTIONS.find((s) => s.id === id)
    if (!opt) return id ?? ""
    return getTranslatedLabel(t, opt)
  }

  const getLabel = (items: TranslatedItem[], id: number): string => {
    const item = items.find((i) => i.id === id)
    if (!item) return ""
    return getTranslatedLabel(t, item)
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden bg-white",
        isRtl ? "text-right" : "text-left"
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 py-3.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={closePopup}
            className="flex items-center gap-2 text-gray-400 transition-colors hover:text-gray-600"
            aria-label={t("back")}
          >
            <ArrowRight className="size-5" />
            <span className="text-base font-bold text-gray-900">{t("filters")}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="text-sm font-medium text-blue-500 transition-colors hover:text-blue-600"
        >
          {t("clearAllFilters")}
        </button>
      </div>

      <div className="flex-shrink-0 border-b border-gray-100 bg-gray-50 px-4 py-2">
        <p className="text-right text-xs text-gray-500">
          {t("availableCarsCount", {
            count: formatNumberByLocale(carListLength, locale),
          })}
        </p>
      </div>

      {activeBadges.length > 0 && (
        <div className="flex flex-shrink-0 items-center gap-2 overflow-x-auto border-b border-gray-100 bg-white px-4 py-2">
          {activeBadges.map((badge) => (
            <span
              key={badge.key}
              className="flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-700"
            >
              <button
                type="button"
                onClick={badge.onRemove}
                className="text-gray-500 transition-colors hover:text-gray-700"
                aria-label={t("removeFilterAria", { label: badge.label })}
              >
                <X className="size-3" />
              </button>
              {badge.label}
            </span>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="px-4">
          <div className="py-3">
            <SectionHeader
              title={t("sortTitle")}
              icon={<SlidersHorizontal className="size-4" />}
              open={openSections.sort}
              onToggle={() => toggleSection("sort")}
            />

            {openSections.sort && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {SORT_OPTIONS.map((opt) => (
                  <PillButton
                    key={String(opt.id)}
                    label={getSortLabel(opt.id)}
                    selected={sort === opt.id}
                    onClick={() => setSort(opt.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <Divider />

          <div className="py-3">
            <SectionHeader
              title={t("priceRangeTitle")}
              icon={<DollarSign className="size-4" />}
              open={openSections.price}
              onToggle={() => toggleSection("price")}
            />

            {openSections.price && (
              <div className="mt-3">
                <PriceRange isRtl={isRtl} t={t} locale={locale} />
              </div>
            )}
          </div>

          <Divider />

          <div className="py-3">
            <SectionHeader
              title={t("brandNameTitle")}
              icon={<Building2 className="size-4" />}
              open={openSections.brand}
              onToggle={() => toggleSection("brand")}
            />

            {openSections.brand && (
              <div className="mt-3">
                <BrandSection t={t} locale={locale} />
              </div>
            )}
          </div>

          <Divider />

          <div className="py-3">
            <SectionHeader
              title={t("carClassTitle")}
              icon={<Car className="size-4" />}
              open={openSections.carClass}
              onToggle={() => toggleSection("carClass")}
            />

            {openSections.carClass && (
              <div className="mt-2">
                <CarClassSection
                  selectedCategories={selectedCategories}
                  toggleSelectedCategory={toggleSelectedCategory}
                  t={t}
                  locale={locale}
                />
              </div>
            )}
          </div>

          <Divider />

          <div className="py-3">
            <SectionHeader
              title={t("gearboxTitle")}
              icon={<Settings2 className="size-4" />}
              open={openSections.gearbox}
              onToggle={() => toggleSection("gearbox")}
            />

            {openSections.gearbox && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {GEARBOX_ITEMS.map((item) => (
                  <PillButton
                    key={item.id}
                    label={getLabel(GEARBOX_ITEMS, item.id)}
                    selected={selectedCategories.includes(item.id)}
                    onClick={() => toggleSelectedCategory(item.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <Divider />

          <div className="py-3">
            <SectionHeader
              title={t("fuelTypeTitle")}
              icon={<Fuel className="size-4" />}
              open={openSections.fuel}
              onToggle={() => toggleSection("fuel")}
            />

            {openSections.fuel && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {FUEL_ITEMS.map((item) => (
                  <PillButton
                    key={item.id}
                    label={getLabel(FUEL_ITEMS, item.id)}
                    selected={selectedCategories.includes(item.id)}
                    onClick={() => toggleSelectedCategory(item.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <Divider />

          <div className="py-3">
            <SectionHeader
              title={t("seatCountTitle")}
              icon={<Users className="size-4" />}
              open={openSections.seats}
              onToggle={() => toggleSection("seats")}
            />

            {openSections.seats && (
              <div className="mt-2">
                {SEAT_COUNT_ITEMS.map((item) => (
                  <CheckboxRow
                    key={item.id}
                    label={item.value}
                    checked={selectedCategories.includes(item.id)}
                    onChange={() => toggleSelectedCategory(item.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <Divider />

          <div className="py-3">
            <SectionHeader
              title={t("luggageCapacityTitle")}
              icon={<Luggage className="size-4" />}
              open={openSections.luggage}
              onToggle={() => toggleSection("luggage")}
            />

            {openSections.luggage && (
              <div className="mt-2">
                {LUGGAGE_ITEMS.map((item) => (
                  <CheckboxRow
                    key={item.id}
                    label={item.value}
                    checked={selectedCategories.includes(item.id)}
                    onChange={() => toggleSelectedCategory(item.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <Divider />

          <div className="py-3">
            <SectionHeader
              title={t("amenitiesTitle")}
              icon={<SlidersHorizontal className="size-4" />}
              open={openSections.amenities}
              onToggle={() => toggleSection("amenities")}
            />

            {openSections.amenities && (
              <div className="mt-2">
                {AMENITY_ITEMS.map((item) => (
                  <CheckboxRow
                    key={item.id}
                    label={getTranslatedLabel(t, item)}
                    checked={selectedCategories.includes(item.id)}
                    onChange={() => toggleSelectedCategory(item.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="h-2" />
        </div>
      </div>

      <div className="flex shrink-0 gap-3 border-t border-gray-100 bg-white px-4 py-3">
        <button
          type="button"
          onClick={handleReset}
          className="flex-1 rounded-xl border border-gray-200 py-3.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
        >
          {t("clearFilters")}
        </button>

        <button
          type="button"
          onClick={closePopup}
          className="flex-[2] rounded-xl bg-blue-500 py-3.5 text-sm font-bold text-white transition-colors hover:bg-blue-600"
        >
          {t("viewResults", {
            count: formatNumberByLocale(carListLength, locale),
          })}
        </button>
      </div>
    </div>
  )
}