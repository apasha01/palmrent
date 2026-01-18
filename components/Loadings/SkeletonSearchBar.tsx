"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonSearchBar({ stuck = false }: { stuck?: boolean }) {
  return (
    <div
      className={[
        "bg-white dark:bg-gray-900",
        "transition-all duration-300",
        "rounded-none shadow-none border-x-0",
        "sm:rounded-lg sm:shadow-md sm:border",
        "border border-[#E0E0E0] dark:border-gray-700",
        "py-2 sm:py-4",
        stuck ? "shadow-lg shadow-black/5 dark:shadow-black/20" : "",
      ].join(" ")}
    >
      <div className="relative px-2 sm:px-4 space-y-3">
        {/* input row */}
        <div className="rounded-md flex items-center border border-[#0000001f] dark:border-gray-700 bg-gray-50 dark:bg-gray-900 h-10 sm:h-9 px-2 gap-2">
          <Skeleton className="h-6 w-6 rounded bg-gray-200/80 dark:bg-white/10" />
          <Skeleton className="h-6 flex-1 rounded bg-gray-200/80 dark:bg-white/10" />
          <Skeleton className="h-6 w-24 rounded bg-gray-200/80 dark:bg-white/10" />
          <Skeleton className="h-6 w-20 rounded bg-gray-200/80 dark:bg-white/10" />
        </div>

        {/* chips row */}
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-9 w-24 rounded-lg bg-gray-200/80 dark:bg-white/10 shrink-0"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
