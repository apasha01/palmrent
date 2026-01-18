"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonCarCard() {
  return (
    <div className="w-full">
      <div className="rounded-2xl border border-border bg-card p-0 md:p-2.5 h-full overflow-hidden">
        <Skeleton className="w-full aspect-[16/10] md:rounded-lg rounded-none bg-gray-200/80 dark:bg-white/10" />

        <div className="pt-3 flex flex-col gap-2 px-2 md:px-0">
          {/* title + heart */}
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-5 w-2/3 rounded-md bg-gray-200/80 dark:bg-white/10" />
            <Skeleton className="h-5 w-5 rounded-md bg-gray-200/80 dark:bg-white/10" />
          </div>

          {/* options */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border">
            <Skeleton className="h-4 rounded-md bg-gray-200/80 dark:bg-white/10" />
            <Skeleton className="h-4 rounded-md bg-gray-200/80 dark:bg-white/10" />
            <Skeleton className="h-4 rounded-md bg-gray-200/80 dark:bg-white/10" />
            <Skeleton className="h-4 rounded-md bg-gray-200/80 dark:bg-white/10" />
          </div>

          {/* price row */}
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <Skeleton className="h-4 w-1/2 rounded-md bg-gray-200/80 dark:bg-white/10" />
            <div className="flex flex-col items-end gap-1">
              <Skeleton className="h-3 w-16 rounded-md bg-gray-200/80 dark:bg-white/10" />
              <Skeleton className="h-5 w-24 rounded-md bg-gray-200/80 dark:bg-white/10" />
            </div>
          </div>

          {/* buttons */}
          <div className="flex gap-2 mt-1 pb-2">
            <Skeleton className="h-10 flex-1 rounded-xl bg-gray-200/80 dark:bg-white/10" />
            <Skeleton className="h-10 w-12 rounded-xl bg-gray-200/80 dark:bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
