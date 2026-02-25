"use client"

import { useDebounce } from "@/hooks/useDebounce"
import { useTranslations, useLocale } from "next-intl"
import { useEffect, useMemo, useState } from "react"

import { cn } from "@/lib/utils"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { Search, X } from "lucide-react"
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

// zustand
import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store"
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet"

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

  // zustand state
  const sort = useSearchPageStore((s) => s.sort)
  const setSort = useSearchPageStore((s) => s.setSort)

  const selectedCategories = useSearchPageStore((s) => s.selectedCategories)
  const toggleSelectedCategory = useSearchPageStore((s) => s.toggleSelectedCategory)

  const search_title = useSearchPageStore((s) => s.search_title)
  const setSearchTitle = useSearchPageStore((s) => s.setSearchTitle)

  const [searchValue, setSearchValue] = useState(search_title || "")
  const [filtersOpen, setFiltersOpen] = useState(false)

  const debouncedSearchTerm = useDebounce(searchValue, 800)

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

  const selectedItems = useMemo(
    () => sortList.filter((x) => selectedCategories.includes(x.id)),
    [sortList, selectedCategories]
  )

  useEffect(() => {
    setSearchTitle(debouncedSearchTerm ?? "")
  }, [debouncedSearchTerm, setSearchTitle])

  const handleSortChange = (sortType: string) => setSort(sortType)
  const handleCategoryToggle = (id: number) => toggleSelectedCategory(id)

  return (
    <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
      <div
        className={cn(
          "bg-white z-30 transition-all sm:rounded-lg rounded-none sm:shadow-[0_4px_20px_0px_rgba(0,0,0,.06)] sm:p-4 p-2 max-sm:py-3 m-0 max-sm:border-t-0 text-nowrap border border-[#E0E0E0]",
          containerClassName
        )}
      >
        <div className="relative space-y-2">

          {/* ── Search Row ── */}
          <div className="rounded-md flex items-center p-4 sm:py-2 py-1 relative mb-2 border border-[#0000001f]">
            <span className="text-[#4b5259]">
              <Search size={20} />
            </span>

            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              type="search"
              placeholder={t("carSearch")}
              className="w-full px-2 outline-0 placeholder:text-[#4b5259] text-xs"
            />

            <div className="flex items-center gap-1 text-[#75736F]">
              {/* Filter button */}
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

              {/* Sort dropdown */}
              <div className="flex relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <span className="text-[#626262]">
                        <span className="max-sm:hidden">
                          <IconSort size="22" className={undefined} />
                        </span>
                        <span className="sm:hidden">
                          <IconSort size="20" className={undefined} />
                        </span>
                      </span>
                      <span className="max-sm:hidden text-sm">
                        {sort ? t(sort) : t("sort")}
                      </span>
                      {sort && (
                        <span
                          onClick={(e) => { e.stopPropagation(); setSort("") }}
                          className="size-4 transition-all flex items-center overflow-hidden"
                        >
                          <IconClose className={undefined} />
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="start"
                    className="flex flex-col bg-white p-2 border border-[#cccccc] rounded-lg shadow-none"
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

            {searchDisable && (
              <div className="w-full h-full bg-white opacity-50 absolute top-0 z-20" />
            )}
          </div>

          {/* ── Selected chips ── */}
          {selectedItems.length > 0 && (
            <div className="w-full block overflow-auto hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex md:gap-2 gap-1">
                {selectedItems.map((item) => (
                  <label key={item.id} className="flex gap-2 mb-2 select-none">
                    <input
                      onChange={() => handleCategoryToggle(item.id)}
                      checked={true}
                      className="peer hidden"
                      value={item.id}
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

          {/* ── Category list ── */}
          <div className="block md:flex-nowrap flex-wrap items-center justify-between gap-2 lg:text-sm md:text-xs text-xs relative">
            <div className="flex md:w-auto w-full items-start gap-2 lg:text-sm md:text-xs text-xs">
              <div className="w-full block overflow-auto hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex md:gap-2 gap-1">
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
              <div className="w-full h-full bg-white opacity-50 absolute top-0 z-20" />
            )}
          </div>

        </div>
      </div>

      <SheetContent
        side={isRtl ? "left" : "right"}
        className="w-full max-w-md p-0 bg-white shadow-2xl border-l"
      >
        <SearchFilterSheet closePopup={() => setFiltersOpen(false)} carListLength={carListLength} />
      </SheetContent>
    </Sheet>
  )
}