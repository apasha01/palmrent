"use client"

import { CheckCircle, CarFront, Clipboard, Ticket, ChevronLeft } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

export default function StepRent({ step }: { step: number }) {
  const t = useTranslations()

  const roadMapList = [
    { title: "roadMap1", icon: CheckCircle },
    { title: "roadMap2", icon: CarFront },
    { title: "roadMap3", icon: Clipboard },
    { title: "roadMap4", icon: Ticket },
  ]

  return (
    <div className="w-full my-2">
      <div className="hidden md:block">
        <div className="mx-auto w-full max-w-[980px] px-2">
          <div className="flex items-center justify-center">
            {roadMapList.map((item, index) => {
              const Icon = item.icon
              const isDone = index < step
              const isActive = index === step
              const isPassed = index <= step

              return (
                <div key={item.title} className="flex items-center">
                  <div className="flex flex-col items-center shrink-0 min-w-[90px]">
                    <div
                      className={cn(
                        "p-1.5 transition-colors",
                        isPassed
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-[#BEC6CC] dark:text-muted-foreground",
                      )}
                    >
                      {isDone ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span
                      className={cn(
                        "mt-1 text-xs text-nowrap transition-colors",
                        isActive && "font-bold text-emerald-600 dark:text-emerald-400",
                        !isActive && isDone && "text-emerald-600 dark:text-emerald-400",
                        !isActive && !isDone && "text-[#BEC6CC] dark:text-muted-foreground",
                      )}
                    >
                      {t(item.title)}
                    </span>
                  </div>

                  {index !== roadMapList.length - 1 && (
                    <div
                      className={cn(
                        "h-px w-[110px] lg:w-[160px] xl:w-[220px] transition-colors",
                        index < step ? "bg-emerald-500 dark:bg-emerald-400" : "bg-[#BEC6CC] dark:bg-border",
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="block md:hidden px-3">
<div className="flex items-center justify-start gap-1.5 flex-wrap">
  {roadMapList.map((item, index) => {
    const Icon = item.icon
    const isDone = index < step
    const isActive = index === step

    return (
      <div key={item.title} className="flex items-center gap-0.5">
        <div className="flex items-center gap-1">
          {isDone ? (
            <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : isActive ? (
            <div className="w-2.5 h-2.5 shrink-0 rounded-full bg-emerald-500" />
          ) : (
            <Icon className="w-3.5 h-3.5 shrink-0 text-[#BEC6CC] dark:text-muted-foreground" />
          )}

          <span
            className={cn(
              "text-[11px] whitespace-nowrap transition-colors",
              isActive && "font-semibold text-emerald-600 dark:text-emerald-400",
              !isActive && isDone && "text-emerald-600 dark:text-emerald-400",
              !isActive && !isDone && "text-[#BEC6CC] dark:text-muted-foreground",
            )}
          >
            {t(item.title)}
          </span>
        </div>

        {index !== roadMapList.length - 1 && (
          <ChevronLeft className="w-3.5 h-3.5 shrink-0 text-[#BEC6CC] dark:text-muted-foreground" />
        )}
      </div>
    )
  })}
</div>

      </div>
    </div>
  )
}
