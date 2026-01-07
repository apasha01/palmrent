/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useLocale, useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import { changeSelectedCategories, changeSelectedPriceRange, toggleSelectedCategory } from "@/redux/slices/searchSlice"

// shadcn/ui
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Slider } from "@/components/ui/slider"

// lucide
import { Building2, Car, Check, DollarSign, RefreshCw, Settings2, Sparkles } from "lucide-react"

type Props = {
  closePopup?: () => void
}

export default function SearchFilterSheet({ closePopup }: Props) {
  const t = useTranslations()
  const locale = useLocale()
  const dispatch = useDispatch()

  const isRtl = locale === "fa" || locale === "ar"

  const selectedCategories = useSelector((state: any) => state.search.selectedCategories)
  const carListLength = useSelector((state: any) => state.carList.carList.length)

  const handleReset = () => {
    dispatch(changeSelectedCategories([]))
  }

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
        title: "برند",
        icon: <Building2 className="size-4" />,
        shouldTranslate: false,
        items: [
          { id: 28, title: "Hyundai" },
          { id: 44, title: "Mercedes-Benz" },
          { id: 24, title: "Toyota" },
          { id: 25, title: "Kia" },
          { id: 30, title: "BMW" },
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
    [],
  )

  return (
    <div className={cn("dark:bg-gray-950", isRtl ? "text-right" : "text-left")}>
      <div className="p-5 border-b border-gray-200 dark:border-gray-900  dark:bg-gray-950">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold  text-gray-900 dark:text-gray-100">{t("filters")}</div>

          <div className="flex items-center gap-3">
            {selectedCategories.length > 0 && (
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

      {/* Scrollable Content */}
      <ScrollArea className="h-[calc(100vh-88px-88px)]">
        <div className="p-5 pb-6 space-y-8  dark:bg-gray-950">
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
                  <FilterChip key={item.id} id={item.id} label={group.shouldTranslate ? t(item.title) : item.title} />
                ))}
              </div>

              {index < filterGroups.length - 1 && <Separator className="bg-gray-200 dark:bg-gray-800 mt-6" />}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="px-2 pt-4  border-t ">
        <Button
          type="button"
          onClick={closePopup}
          className={cn(
            "w-full font-bold text-lg py-7 rounded-xl transition-all",
            "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white",
            "flex justify-between px-6",
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

function FilterChip({ id, label }: { id: number; label: string }) {
  const dispatch = useDispatch()
  const selectedCategories = useSelector((state: any) => state.search.selectedCategories)
  const isSelected = selectedCategories.includes(id)

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => dispatch(toggleSelectedCategory(id))}
      className={cn(
        "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
        "flex items-center gap-2 select-none h-auto",
        isSelected
          ? "bg-blue-600 dark:bg-blue-600 text-white border-blue-600 dark:border-blue-600 shadow-md shadow-blue-200 dark:shadow-blue-900/50 hover:bg-blue-600"
          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700",
      )}
    >
      {isSelected && <Check className="size-3 text-white" />}
      {label}
    </Button>
  )
}

function PriceRange({ isRtl }: { isRtl: boolean }) {
  const dispatch = useDispatch()
  const priceRange = useSelector((state: any) => state.search.priceRange)
  const selectedPriceRange = useSelector((state: any) => state.search.selectedPriceRange)
  const currency = useSelector((state: any) => state.search.currency) || "AED"

  const safePriceRange = priceRange && priceRange.length >= 2 ? priceRange : [0, 50000]
  const MIN_LIMIT = Math.min(...safePriceRange)
  const MAX_LIMIT = Math.max(...safePriceRange)

  const [values, setValues] = useState<[number, number]>([MIN_LIMIT, MAX_LIMIT])

  useEffect(() => {
    if (selectedPriceRange && selectedPriceRange.length >= 2) {
      setValues([Math.min(...selectedPriceRange), Math.max(...selectedPriceRange)])
    } else {
      setValues([MIN_LIMIT, MAX_LIMIT])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceRange])

  const commit = (v: number[]) => {
    if (v?.length >= 2) dispatch(changeSelectedPriceRange([v[0], v[1]]))
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
