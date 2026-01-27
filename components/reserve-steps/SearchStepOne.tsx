/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React from "react"

// Components
import { SerarchSection } from "@/components/search/SearchSection"
import SingleCar from "@/components/card/CarsCard"

// ✅ shadcn/ui
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

// ✅ lucide
import { Info, RefreshCcw } from "lucide-react"

function SkeletonCarCard() {
  return (
    <div className="w-full">
      <div className="rounded-2xl border border-border bg-card p-0 md:p-2.5 h-full overflow-hidden">
        <Skeleton className="w-full aspect-[16/10] md:rounded-lg rounded-none bg-gray-200/80 dark:bg-white/10" />
        <div className="pt-3 flex flex-col gap-2 px-2 md:px-0">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-5 w-2/3 rounded-md bg-gray-200/80 dark:bg-white/10" />
            <Skeleton className="h-5 w-5 rounded-md bg-gray-200/80 dark:bg-white/10" />
          </div>
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border">
            <Skeleton className="h-4 rounded-md bg-gray-200/80 dark:bg-white/10" />
            <Skeleton className="h-4 rounded-md bg-gray-200/80 dark:bg-white/10" />
            <Skeleton className="h-4 rounded-md bg-gray-200/80 dark:bg-white/10" />
            <Skeleton className="h-4 rounded-md bg-gray-200/80 dark:bg-white/10" />
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <Skeleton className="h-4 w-1/2 rounded-md bg-gray-200/80 dark:bg-white/10" />
            <div className="flex flex-col items-end gap-1">
              <Skeleton className="h-3 w-16 rounded-md bg-gray-200/80 dark:bg-white/10" />
              <Skeleton className="h-5 w-24 rounded-md bg-gray-200/80 dark:bg-white/10" />
            </div>
          </div>
          <div className="flex gap-2 mt-1 pb-2">
            <Skeleton className="h-10 flex-1 rounded-xl bg-gray-200/80 dark:bg-white/10" />
            <Skeleton className="h-10 w-12 rounded-xl bg-gray-200/80 dark:bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  )
}

type Props = {
  topOffset: number
  stuck: boolean
  playFade: boolean

  isLoading: boolean
  isLoadingMore: boolean
  error: string | null
  carList: any[]

  sentinelRef: React.RefObject<HTMLDivElement | null>
  lastElementRef: (node: HTMLDivElement | null) => void
  onRetry: () => void
  t: (key: string) => string
  currency: string
  rateToRial: number | null
}

export default function SearchStepOne({
  topOffset,
  stuck,
  playFade,
  isLoading,
  isLoadingMore,
  error,
  carList,
  sentinelRef,
  lastElementRef,
  onRetry,
  t,
  currency,
  rateToRial,
}: Props) {
  return (
    <>
      <div ref={sentinelRef} className="h-px w-full" />

      <div
        className={`
          sticky top-0 z-40
          transition-[transform,background-color,box-shadow,backdrop-filter]
          duration-500 ease-out
          ${playFade ? "animate-fade-in" : ""}
        `}
        style={{
          transform: stuck ? `translateY(${topOffset}px)` : "translateY(0px)",
          willChange: "transform",
        }}
      >
        <div className="sm:w-[90vw] max-w-334 m-auto px-0 sm:px-2">
          <SerarchSection
            searchDisable={isLoading && !isLoadingMore}
            containerClassName={
              stuck
                ? "shadow-lg shadow-black/5 dark:shadow-black/20 border-b border-gray-200/80 dark:border-gray-700/80"
                : ""
            }
          />
        </div>
      </div>

      <div className="md:w-[90vw] max-w-334 m-auto relative min-h-[50vh] px-0 md:px-2 mt-4">
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-red-500 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-100 dark:border-red-900/40">
            <Info size={48} className="opacity-80" />
            <span className="mt-2 font-bold">{error}</span>

            <Button onClick={onRetry} className="mt-4 flex items-center gap-2" variant="default">
              <RefreshCcw className="size-4" />
              {t("tryAgain")}
            </Button>
          </div>
        )}

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {!isLoading &&
            carList.map((item: any, index: number) => {
              const isLast = carList.length === index + 1
              return (
                <div
                  ref={isLast ? lastElementRef : undefined}
                  key={`${item.id}-${index}`}
                  className="flex w-full"
                >
                  <SingleCar data={item} currency={currency} rateToRial={rateToRial} />
                </div>
              )
            })}

          {(isLoading || isLoadingMore) &&
            Array(6)
              .fill(null)
              .map((_, index) => (
                <div key={`skeleton-${index}`} className="flex w-full">
                  <SkeletonCarCard />
                </div>
              ))}
        </div>

        {!isLoading && !isLoadingMore && !error && carList.length === 0 && (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400 flex flex-col items-center gap-2">
            <Info size={40} className="opacity-30" />
            <span>{t("noCarsFound")}</span>
          </div>
        )}
      </div>
    </>
  )
}
