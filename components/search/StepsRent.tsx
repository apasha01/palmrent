"use client";

import * as React from "react";
import {
  CheckCircle,
  CarFront,
  Clipboard,
  Ticket,
  ChevronLeft,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export default function StepRent({
  step,
  onStepClick,
  step1Done = false,
  step2Done = false,
}: {
  step: number; // ✅ 1..4
  onStepClick?: (targetStep: number) => void; // ✅ 1..4
  step1Done?: boolean;
  step2Done?: boolean;
}) {
  const t = useTranslations();

  const stepSafe = Number.isFinite(step) ? Math.min(4, Math.max(1, step)) : 1;

  const roadMapList = [
    { title: "roadMap1", icon: CheckCircle },
    { title: "roadMap2", icon: CarFront },
    { title: "roadMap3", icon: Clipboard },
    { title: "roadMap4", icon: Ticket },
  ];

  // ✅ فقط مراحل قبلی قابل کلیک باشند (هم متن/هم آیکون)
  const canClick = (targetStep: number) =>
    Boolean(onStepClick) && targetStep < stepSafe;

  const handleClick = (targetStep: number) => {
    if (!onStepClick) return;
    if (!canClick(targetStep)) return;

    // ✅ وقتی روی "انتخاب خودرو" (استپ ۲) می‌زنی باید برگرده به step1
    // ✅ روی "انتخاب تاریخ" هم طبیعتاً step1 هست
    const realTarget = targetStep === 2 ? 1 : targetStep;

    onStepClick(realTarget);
  };

  const handleKeyDown = (e: React.KeyboardEvent, targetStep: number) => {
    if (!canClick(targetStep)) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick(targetStep);
    }
  };

  const getState = (targetStep: number) => {
    const doneByDate = targetStep === 1 && step1Done;
    const doneByCar = targetStep === 2 && step2Done;

    const isDone = targetStep < stepSafe || doneByDate || doneByCar;
    const isActive = targetStep === stepSafe;

    // ✅ فقط خود آیتم (done/active) رنگی بشه
    const isPassed = isActive || isDone;

    return { isDone, isActive, isPassed };
  };

  // ✅ رنگ خط بین stepIndex و stepIndex+1
  const isLinePassed = (lineIndex: number) => {
    const leftStep = lineIndex + 1; // 1..3
    const rightStep = lineIndex + 2; // 2..4

    // فقط خط قبل از استپ فعال
    if (rightStep === stepSafe) return true;

    // done های خاص فقط خط مربوط به خودشون
    if (leftStep === 1 && rightStep === 2 && step1Done) return true;
    if (leftStep === 2 && rightStep === 3 && step2Done) return true;

    return false;
  };

  return (
    <div className="w-full my-2">
      {/* ===================== DESKTOP ===================== */}
      <div className="hidden md:block">
        <div className="mx-auto w-full max-w-[980px] px-2">
          <div className="flex items-center justify-center">
            {roadMapList.map((item, index) => {
              const Icon = item.icon;

              const targetStep = index + 1;
              const { isDone, isActive, isPassed } = getState(targetStep);

              return (
                <div
                  key={item.title}
                  onClick={() => handleClick(targetStep)}
                  onKeyDown={(e) => handleKeyDown(e, targetStep)}
                  role={canClick(targetStep) ? "button" : undefined}
                  tabIndex={canClick(targetStep) ? 0 : -1}
                  aria-disabled={!canClick(targetStep)}
                  className={cn(
                    canClick(targetStep) && "cursor-pointer select-none",
                  )}
                >
                  <div className="flex items-center">
                    <div className="flex flex-col items-center shrink-0 min-w-[90px]">
                      <div
                        className={cn(
                          "p-1.5 transition-colors",
                          isPassed
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-[#BEC6CC] dark:text-muted-foreground",
                        )}
                      >
                        {isDone ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>

                      <span
                        className={cn(
                          "mt-1 text-xs text-nowrap transition-colors",
                          isActive &&
                            "font-bold text-emerald-600 dark:text-emerald-400",
                          !isActive &&
                            isDone &&
                            "text-emerald-600 dark:text-emerald-400",
                          !isActive &&
                            !isDone &&
                            "text-[#BEC6CC] dark:text-muted-foreground",
                        )}
                      >
                        {t(item.title)}
                      </span>
                    </div>

                    {index !== roadMapList.length - 1 && (
                      <div
                        className={cn(
                          "h-px w-[110px] lg:w-[160px] xl:w-[220px] transition-colors",
                          isLinePassed(index)
                            ? "bg-emerald-500 dark:bg-emerald-400"
                            : "bg-[#BEC6CC] dark:bg-border",
                        )}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===================== MOBILE ===================== */}
      <div className="block md:hidden px-3">
        <div className="flex items-center justify-start gap-1.5 flex-wrap">
          {roadMapList.map((item, index) => {
            const Icon = item.icon;

            const targetStep = index + 1;
            const { isDone, isActive, isPassed } = getState(targetStep);

            return (
              <div
                key={item.title}
                onClick={() => handleClick(targetStep)}
                onKeyDown={(e) => handleKeyDown(e, targetStep)}
                role={canClick(targetStep) ? "button" : undefined}
                tabIndex={canClick(targetStep) ? 0 : -1}
                aria-disabled={!canClick(targetStep)}
                className={cn(canClick(targetStep) && "cursor-pointer select-none")}
              >
                <div className="flex items-center gap-0.5">
                  <div className="flex items-center gap-1">
                    {isDone ? (
                      <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : isActive ? (
                      <div className="w-2.5 h-2.5 shrink-0 rounded-full bg-emerald-500" />
                    ) : (
                      <Icon
                        className={cn(
                          "w-3.5 h-3.5 shrink-0",
                          isPassed
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-[#BEC6CC] dark:text-muted-foreground",
                        )}
                      />
                    )}

                    <span
                      className={cn(
                        "text-[11px] whitespace-nowrap transition-colors",
                        isActive &&
                          "font-semibold text-emerald-600 dark:text-emerald-400",
                        !isActive &&
                          isDone &&
                          "text-emerald-600 dark:text-emerald-400",
                        !isActive &&
                          !isDone &&
                          "text-[#BEC6CC] dark:text-muted-foreground",
                      )}
                    >
                      {t(item.title)}
                    </span>
                  </div>

                  {index !== roadMapList.length - 1 && (
                    <ChevronLeft
                      className={cn(
                        "w-3.5 h-3.5 shrink-0",
                        isLinePassed(index)
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-[#BEC6CC] dark:text-muted-foreground",
                      )}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
