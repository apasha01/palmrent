/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useDebounce } from "@/hooks/useDebounce";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { changeSearchTitle, changeSort, toggleSelectedCategory } from "@/redux/slices/searchSlice";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import {
  Search,
  X,
  HandCoins,
  PiggyBank,
  Gem,
  UsersRound,
  Trophy,
  BriefcaseBusiness,
  Sun,
  BadgeCheck,
  CarFront,
  Car,
  ArrowDownWideNarrow,
  SlidersHorizontal,
} from "lucide-react";

import SearchFilterSheet from "./SearchFilterSheet";

export function SerarchSection({
  searchDisable = false,
  containerClassName,
}: {
  searchDisable?: boolean;
  containerClassName?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === "fa" || locale === "ar";

  const dispatch = useDispatch();

  const searchOrder = useSelector((state: any) => state.search.sort);
  const selectedCategories = useSelector((state: any) => state.search.selectedCategories);
  const reduxSearchTitle = useSelector((state: any) => state.search.search_title);

  const [searchValue, setSearchValue] = useState(reduxSearchTitle || "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchValue, 800);

  const sortList = useMemo(
    () => [
      { id: 14, icon: <HandCoins size={18} />, title: "noDeposite" },
      { id: 3, icon: <PiggyBank size={18} />, title: "economicCar" },
      { id: 13, icon: <Gem size={18} />, title: "luxCar" },
      { id: 15, icon: <UsersRound size={18} />, title: "sevenplus" },
      { id: 19, icon: <Trophy size={18} />, title: "sport" },
      { id: 18, icon: <BriefcaseBusiness size={18} />, title: "business" },
      { id: 21, icon: <Sun size={18} />, title: "crook" },
      { id: 17, icon: <BadgeCheck size={18} />, title: "standard" },
      { id: 9, icon: <CarFront size={18} />, title: "suv" },
      { id: 20, icon: <Car size={18} />, title: "coupe" },
    ],
    []
  );

  const selectedItems = useMemo(
    () => sortList.filter((x) => selectedCategories.includes(x.id)),
    [sortList, selectedCategories]
  );

  useEffect(() => {
    if (debouncedSearchTerm !== undefined) dispatch(changeSearchTitle(debouncedSearchTerm));
  }, [debouncedSearchTerm, dispatch]);

  const handleSortChange = (sortType: string) => dispatch(changeSort(sortType));
  const handleCategoryToggle = (id: number) => dispatch(toggleSelectedCategory(id));

  return (
    <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
      <Card
        className={cn(
          // ✅ خود کارت دیگه sticky/fixed نیست. فقط ظاهر.
          "bg-white dark:bg-gray-900",
          "transition-all duration-300 relative",
          "rounded-none shadow-none border-x-0",
          "sm:rounded-lg sm:shadow-md sm:border",
          "border border-[#E0E0E0] dark:border-gray-700",
          "py-2 sm:py-3",
          containerClassName
        )}
      >
        <div className="relative px-2 sm:px-4 space-y-2 sm:space-y-3">
          {/* Search Row */}
          <div
            className={cn(
              "rounded-md flex items-center",
              "border border-[#0000001f] dark:border-gray-700",
              "bg-gray-50 dark:bg-gray-900"
            )}
          >
            <span className="text-[#4b5259] dark:text-gray-400 px-2 shrink-0">
              <Search size={20} className="transform -scale-x-100" />
            </span>

            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              type="search"
              placeholder={t("carSearch")}
              className={cn(
                "border-none shadow-none bg-transparent",
                "focus:outline-none focus:ring-0 focus:ring-offset-0",
                "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                "h-10 sm:h-9 px-0"
              )}
            />

            <div className="flex items-center gap-1 text-[#75736F] dark:text-gray-400 border-r pr-2 border-gray-300 dark:border-gray-600">
              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn("flex items-center gap-1 p-1.5 rounded", "h-auto hover:bg-gray-200 dark:hover:bg-gray-700")}
                  >
                    <SlidersHorizontal size="20" />
                    <span className="hidden sm:block text-xs font-bold text-nowrap dark:text-gray-300">
                      {searchOrder ? t(searchOrder) : t("sort")}
                    </span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="start"
                  className="w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden"
                >
                  <DropdownMenuItem
                    className="px-4 py-2 text-xs cursor-pointer text-gray-700 dark:text-gray-300 border-b dark:border-gray-700 rounded-none hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    onClick={() => handleSortChange("price_min")}
                  >
                    {t("price_min")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="px-4 py-2 text-xs cursor-pointer text-gray-700 dark:text-gray-300 border-b dark:border-gray-700 rounded-none hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    onClick={() => handleSortChange("price_max")}
                  >
                    {t("price_max")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="px-4 py-2 text-xs cursor-pointer text-gray-700 dark:text-gray-300 rounded-none hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    onClick={() => handleSortChange("new")}
                  >
                    {t("sort1")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Filters */}
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn("flex items-center gap-1 p-1.5 rounded", "h-auto hover:bg-gray-200 dark:hover:bg-gray-700")}
                >
                  <ArrowDownWideNarrow size="20" />
                  <span className="hidden sm:block text-xs font-bold text-nowrap dark:text-gray-300">
                    {t("filters")}
                  </span>
                </Button>
              </SheetTrigger>
            </div>
          </div>

          {/* Selected chips */}
          {selectedItems.length > 0 && (
            <div className={cn("flex flex-wrap gap-2", isRtl ? "justify-start" : "justify-end")}>
              {selectedItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleCategoryToggle(item.id)}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs whitespace-nowrap",
                    "border border-blue-500 dark:border-blue-400",
                    "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-bold"
                  )}
                >
                  {t(item.title)}
                  <X className="size-3 text-blue-500 dark:text-blue-400" />
                </button>
              ))}
            </div>
          )}

          {/* Horizontal category list */}
          <div
            className={cn(
              "w-full overflow-x-auto overflow-y-hidden hide-scrollbar",
              "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            )}
          >
            <div className="flex gap-2">
              {sortList.map((item) => {
                const isSelected = selectedCategories.includes(item.id);
                return (
                  <Button
                    key={item.id}
                    type="button"
                    variant="outline"
                    onClick={() => handleCategoryToggle(item.id)}
                    className={cn(
                      "flex items-center gap-2 px-2 rounded-lg border text-xs cursor-pointer whitespace-nowrap transition-all",
                      "h-auto",
                      "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    )}
                  >
                    {item.icon}
                    {t(item.title)}
                    {isSelected && <X className="size-3 text-gray-400" />}
                  </Button>
                );
              })}
            </div>
          </div>

          {searchDisable && <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 z-40 cursor-wait" />}
        </div>
      </Card>

      <SheetContent
        side={isRtl ? "left" : "right"}
        className="w-full max-w-md p-0 bg-white dark:bg-gray-900 shadow-2xl border-l dark:border-gray-700"
      >
        <SearchFilterSheet closePopup={() => setFiltersOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
