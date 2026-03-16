/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useCallback, useMemo, useRef, useState } from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check, Info } from "lucide-react"

import { cn } from "@/lib/utils"
import { ApiOption } from "@/types/rent-information"

import { AppDrawer } from "@/components/common/AppDrawer"
import { useTranslations } from "next-intl"

// ------------------------------------
// helpers
// ------------------------------------
export function formatNum(n: number) {
  try {
    return n.toLocaleString()
  } catch {
    return String(n)
  }
}

/**
 * ✅ i18n-safe money formatter (supports "free")
 */
export function formatMoneyOrFree(n: number, tCommon: (key: string, values?: any) => string, currencyLabel?: string) {
  const v = Number(n || 0)
  if (!Number.isFinite(v) || v <= 0) return tCommon("free")
  return currencyLabel ? `${formatNum(v)} ${currencyLabel}` : `${formatNum(v)}`
}

// ------------------------------------
// SummaryRow (supports skeleton)
// ------------------------------------
function SkeletonLine({ w = "w-24" }: { w?: string }) {
  return <div className={cn("h-3 rounded bg-gray-200 animate-pulse", w)} />
}

/**
 * ✅ kind: avoids language-dependent parsing like startsWith("محل تحویل")
 * - "delivery" -> delivery fee row
 * - "return"   -> return fee row
 * - undefined  -> normal row
 */
export function SummaryRow({
  label,
  value,
  subLabel,
  valueHint,
  loading,
  kind,
}: {
  label: string
  value: string
  subLabel?: any
  valueHint?: any
  loading?: boolean
  kind?: "delivery" | "return"
}) {
  const t = useTranslations("RentCommon") // ✅ add translations here

  const normalizedLabel =
    kind === "delivery" ? t("summary.deliveryFee") : kind === "return" ? t("summary.returnFee") : label

  const normalizedSub = subLabel || ""

  const isFree = !loading && value.includes(t("free")) // ✅ matches current locale word

  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 text-right">
          <div className="text-sm font-bold text-gray-800 leading-5">
            {loading ? <SkeletonLine w="w-28" /> : normalizedLabel}
          </div>

          {normalizedSub ? (
            <div className="text-xs text-gray-500 mt-1 leading-4">{loading ? <SkeletonLine w="w-40" /> : normalizedSub}</div>
          ) : null}
        </div>

        <div
          className={cn(
            "text-sm text-left font-bold leading-5 whitespace-nowrap",
            loading ? "text-gray-400" : isFree ? "text-gray-500" : "text-gray-800",
          )}
        >
          {loading ? <SkeletonLine w="w-20" /> : value}

          {valueHint ? <div className="text-[10px] font-medium text-blue-600 mt-0.5">{valueHint}</div> : null}
        </div>
      </div>
    </div>
  )
}

// ------------------------------------
// Checkbox
// ------------------------------------
function RadixCheckbox({
  checked,
  onCheckedChange,
  className,
}: {
  checked: boolean
  onCheckedChange: (next: boolean) => void
  className?: string
}) {
  return (
    <CheckboxPrimitive.Root
      checked={checked}
      onCheckedChange={(v) => onCheckedChange(v === true)}
      className={cn(
        "peer h-5 w-5 shrink-0 rounded-md border border-gray-300 bg-white",
        "transition-colors",
        "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <CheckboxPrimitive.Indicator
        className={cn(
          "flex items-center justify-center text-white",
          "data-[state=checked]:animate-in data-[state=checked]:zoom-in-95",
        )}
      >
        <Check className="h-4 w-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

function renderPriceLeft({
  price,
  currencyLabel,
  tCommon,
}: {
  price: number
  currencyLabel: string
  tCommon: (key: string, values?: any) => string
}) {
  const n = Number(price || 0)

  if (!Number.isFinite(n) || n <= 0) {
    return <span className="text-sm text-gray-600 whitespace-nowrap">{tCommon("free")}</span>
  }

  return (
    <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
      {formatNum(n)} <span className="font-medium">{currencyLabel}</span>{" "}
      <span className="text-gray-500 font-medium">{tCommon("daily")}</span>
    </span>
  )
}

// ------------------------------------
// ExtrasList
// ------------------------------------
export function ExtrasList({
  options,
  selected,
  setSelected,
  insuranceComplete,
  setInsuranceComplete,
  insuranceCompleteEnabled,
  insuranceCompleteDailyPrice,
  currencyLabel = "",
  onSelectionVisualChange,
}: {
  options: ApiOption[]
  selected: number[]
  setSelected: (v: number[]) => void
  insuranceComplete: boolean
  setInsuranceComplete: (v: boolean) => void
  insuranceCompleteEnabled: boolean
  insuranceCompleteDailyPrice?: number
  currencyLabel?: string
  onSelectionVisualChange?: (changedOptionId: number) => void
}) {
  const t = useTranslations("RentCommon")
  const tCommon = (key: string, values?: any) => t(key, values)

  const safeOptions = useMemo(() => {
    return (Array.isArray(options) ? options : []).filter(
      (x): x is ApiOption => Boolean(x) && typeof (x as any).id !== "undefined",
    )
  }, [options])

  const INS_ID = -999

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const blockUntilRef = useRef<number>(0)
  const closeTimerRef = useRef<any>(null)

  const handleDrawerOpenChange = useCallback((open: boolean) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    if (open) {
      setIsDrawerOpen(true)
      return
    }
    blockUntilRef.current = Date.now() + 450
    closeTimerRef.current = setTimeout(() => {
      setIsDrawerOpen(false)
      closeTimerRef.current = null
    }, 300)
  }, [])

  const canToggleNow = useCallback(() => {
    if (isDrawerOpen) return false
    if (Date.now() < blockUntilRef.current) return false
    return true
  }, [isDrawerOpen])

  const toggleOption = useCallback(
    (id: number) => {
      if (!canToggleNow()) return
      if (!Number.isFinite(id)) return
      onSelectionVisualChange?.(id)
      setSelected(selected.includes(id) ? selected.filter((i) => i !== id) : [...selected, id])
    },
    [canToggleNow, onSelectionVisualChange, selected, setSelected],
  )

  const toggleInsurance = useCallback(() => {
    if (!canToggleNow()) return
    onSelectionVisualChange?.(INS_ID)
    setInsuranceComplete(!insuranceComplete)
  }, [canToggleNow, insuranceComplete, onSelectionVisualChange, setInsuranceComplete])

  // ✅ تقسیم عنوان به: بقیه کلمات + کلمه آخر
  const splitTitle = (title: string) => {
    const words = title.trim().split(" ")
    if (words.length === 1) return { rest: "", lastWord: words[0] }
    return {
      rest: words.slice(0, -1).join(" "),
      lastWord: words[words.length - 1],
    }
  }

  return (
    <div>
      {safeOptions.map((item) => {
        const checked = selected.includes(item.id)
        const rawDaily = Number((item as any)?.price ?? 0) || 0
        const apiDesc =
          (item as any)?.description ?? (item as any)?.desc ?? (item as any)?.text ??
          (item as any)?.details ?? (item as any)?.content ?? (item as any)?.info ??
          (item as any)?.note ?? (item as any)?.tooltip ?? ""

        const { rest, lastWord } = splitTitle(item.title)

        return (
          <div
            key={item.id}
            className={cn("flex items-center justify-between gap-3 px-4 py-2")}
          >
            {/* ✅ چک‌باکس → toggle */}
            <span
              className="cursor-pointer shrink-0"
              onClick={(e) => { e.stopPropagation(); toggleOption(item.id) }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); toggleOption(item.id) } }}
            >
              <RadixCheckbox
                checked={checked}
                onCheckedChange={() => toggleOption(item.id)}
                className="cursor-pointer"
              />
            </span>

            {/* ✅ ناحیه متن */}
            <div className="flex items-center gap-1 min-w-0 flex-1">
              {/* ✅ بقیه کلمات (همه به جز آخری) → toggle */}
              {rest && (
                <span
                  role="button"
                  tabIndex={0}
                  className="text-sm font-semibold text-gray-800 cursor-pointer hover:text-gray-600 truncate"
                  onClick={() => toggleOption(item.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleOption(item.id) }}
                >
                  {rest}
                </span>
              )}

              {/* ✅ کلمه آخر + آیکون Info → drawer */}
              <AppDrawer
                kind="extra_option"
                data={{
                  optionId: Number(item.id),
                  optionTitle: item.title,
                  optionDescriptionFromApi: String(apiDesc ?? ""),
                }}
                onOpenChange={handleDrawerOpenChange}
                trigger={({ open }) => (
                  <button
                    type="button"
                    className="flex items-center gap-1 text-gray-800 hover:text-gray-600 shrink-0"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); open() }}
                  >
                    <span className="text-sm font-semibold">{lastWord}</span>
                    <Info size={18} className="text-gray-500 hover:text-gray-700" />
                  </button>
                )}
              />
            </div>

            <div className="text-left shrink-0">
              {renderPriceLeft({ price: rawDaily, currencyLabel: currencyLabel || "", tCommon })}
            </div>
          </div>
        )
      })}

      {insuranceCompleteEnabled ? (() => {
        const insTitle = tCommon("extras.insuranceCompleteTitle")
        const { rest: insRest, lastWord: insLastWord } = splitTitle(insTitle)

        return (
          <div
            className={cn("flex items-center justify-between gap-3 px-4 py-2")}
          >
            {/* ✅ چک‌باکس → toggle */}
            <span
              className="cursor-pointer shrink-0"
              onClick={(e) => { e.stopPropagation(); toggleInsurance() }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); toggleInsurance() } }}
            >
              <RadixCheckbox
                checked={insuranceComplete}
                onCheckedChange={toggleInsurance}
                className="cursor-pointer"
              />
            </span>

            {/* ✅ ناحیه متن */}
            <div className="flex items-center gap-1 min-w-0 flex-1">
              {/* ✅ بقیه کلمات → toggle */}
              {insRest && (
                <span
                  role="button"
                  tabIndex={0}
                  className="text-sm font-semibold text-gray-800 cursor-pointer hover:text-gray-600 truncate"
                  onClick={toggleInsurance}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleInsurance() }}
                >
                  {insRest}
                </span>
              )}

              {/* ✅ کلمه آخر + آیکون Info → drawer */}
              <AppDrawer
                kind="insurance_complete"
                onOpenChange={handleDrawerOpenChange}
                trigger={({ open }) => (
                  <button
                    type="button"
                    className="flex items-center gap-1 text-gray-800 hover:text-gray-600 shrink-0"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); open() }}
                  >
                    <span className="text-sm font-semibold">{insLastWord}</span>
                    <Info size={18} className="text-gray-500 hover:text-gray-700" />
                  </button>
                )}
              />
            </div>

            <div className="text-left shrink-0">
              {renderPriceLeft({
                price: Number(insuranceCompleteDailyPrice || 0),
                currencyLabel: currencyLabel || "",
                tCommon,
              })}
            </div>
          </div>
        )
      })() : null}
    </div>
  )
}

// ------------------------------------
// car meta
// ------------------------------------
export function SelectedCarMeta({
  fuel,
  gearbox,
  baggage,
  passengers,
}: {
  fuel?: string | null
  gearbox?: string | null
  baggage?: number | string | null
  passengers?: number | string | null
}) {
  const t = useTranslations("RentCommon")

  const safeFuel = fuel ?? t("car.fuelDefault")

  const g = String(gearbox ?? "")
  const safeGearbox =
    g.toLowerCase().includes("auto") || g.includes("اتوماتیک")
      ? t("car.gearboxAuto")
      : t("car.gearboxManual")

  const safeBaggage = baggage ?? 0
  const safePassengers = passengers ?? 0

  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[12px] text-gray-500">
      <span className="inline-flex items-center gap-0.5">
        <span className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
          <IconGas />
        </span>
        <span className="text-gray-600">{safeFuel}</span>
      </span>

      <span className="inline-flex items-center gap-0.5">
        <span className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
          <IconGearBox />
        </span>
        <span className="text-gray-600">{safeGearbox}</span>
      </span>

      <span className="inline-flex items-center gap-0.5">
        <span className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
          <IconBag />
        </span>
        <span className="text-gray-600">
          {safeBaggage} {t("car.baggageUnit")}
        </span>
      </span>

      <span className="inline-flex items-center gap-0.5">
        <span className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
          <IconPerson />
        </span>
        <span className="text-gray-600">
          {safePassengers} {t("car.passengersUnit")}
        </span>
      </span>
    </div>
  )
}

export function IconPerson() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 16 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M7.99935 8.00033C9.47268 8.00033 10.666 6.80699 10.666 5.33366C10.666 3.86033 9.47268 2.66699 7.99935 2.66699C6.52602 2.66699 5.33268 3.86033 5.33268 5.33366C5.33268 6.80699 6.52602 8.00033 7.99935 8.00033ZM7.99935 9.33366C6.21935 9.33366 2.66602 10.227 2.66602 12.0003V13.3337H13.3327V12.0003C13.3327 10.227 9.77935 9.33366 7.99935 9.33366Z" />
    </svg>
  )
}

export function IconBag() {
  return (
    <svg
      width="18"
      height="18"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 16 16"
    >
      <path d="M6 .5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V3h1.5A1.5 1.5 0 0 1 13 4.5v9a1.5 1.5 0 0 1-1.004 1.416A1 1 0 1 1 10 15H6a1 1 0 1 1-1.997-.084A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3H6zM9 1H7v2h2zM6 5.5a.5.5 0 0 0-1 0v7a.5.5 0 0 0 1 0zm2.5 0a.5.5 0 0 0-1 0v7a.5.5 0 0 0 1 0zm2.5 0a.5.5 0 0 0-1 0v7a.5.5 0 0 0 1 0z" />
    </svg>
  )
}

export function IconGearBox() {
  return (
    <svg
      width="18"
      height="18"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 16 16"
    >
      <path
        fillRule="evenodd"
        d="M6 3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5v1A1.5 1.5 0 0 1 8.5 6v1H14a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 2 7h5.5V6A1.5 1.5 0 0 1 6 4.5zM8.5 5a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5zM0 11.5A1.5 1.5 0 0 1 1.5 10h1A1.5 1.5 0 0 1 4 11.5v1A1.5 1.5 0 0 1 2.5 14h-1A1.5 1.5 0 0 1 0 12.5zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm4.5.5A1.5 1.5 0 0 1 7.5 10h1a1.5 1.5 0 0 1 1.5 1.5v1A1.5 1.5 0 0 1 8.5 14h-1A1.5 1.5 0 0 1 6 12.5zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm4.5.5a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5z"
      />
    </svg>
  )
}

export function IconGas() {
  return (
    <svg
      width="18"
      height="18"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 16 16"
    >
      <path d="M3 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5z" />
      <path d="M1 2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v8a2 2 0 0 1 2 2v.5a.5.5 0 0 0 1 0V8h-.5a.5.5 0 0 1-.5-.5V4.375a.5.5 0 0 1 .5-.5h1.495c-.011-.476-.053-.894-.201-1.222a.97.97 0 0 0-.394-.458c-.184-.11-.464-.195-.9-.195a.5.5 0 0 1 0-1q.846-.002 1.412.336c.383.228.634.551.794.907.295.655.294 1.465.294 2.081v3.175a.5.5 0 0 1-.5.501H15v4.5a1.5 1.5 0 0 1-3 0V12a1 1 0 0 0-1-1v4h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1zm9 0a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v13h8z" />
    </svg>
  )
}
