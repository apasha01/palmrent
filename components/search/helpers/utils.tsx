/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useMemo, useRef, useState } from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check, Info } from "lucide-react"

import { cn } from "@/lib/utils"
import { ApiOption } from "@/types/rent-information"

import { IconBag, IconGas, IconGearBox, IconPerson } from "@/components/Icons"
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
  const t = useTranslations("RentCommon") // ✅ common texts (free/daily/moreInfo/insurance...)
  const tCommon = (key: string, values?: any) => t(key, values)

  const safeOptions = useMemo(() => {
    return (Array.isArray(options) ? options : []).filter(
      (x): x is ApiOption => Boolean(x) && typeof (x as any).id !== "undefined",
    )
  }, [options])

  const INS_ID = -999

  // ✅ drawer state + cooldown after close
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const blockUntilRef = useRef<number>(0)
  const closeTimerRef = useRef<any>(null)

  const handleDrawerOpenChange = (open: boolean) => {
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
  }

  const canToggleNow = () => {
    if (isDrawerOpen) return false
    // eslint-disable-next-line react-hooks/purity
    if (Date.now() < blockUntilRef.current) return false
    return true
  }

  function toggleOption(id: number) {
    if (!canToggleNow()) return
    if (!Number.isFinite(id as any)) return

    onSelectionVisualChange?.(id)

    if (selected.includes(id)) setSelected(selected.filter((i) => i !== id))
    else setSelected([...selected, id])
  }

  function toggleInsurance() {
    if (!canToggleNow()) return

    onSelectionVisualChange?.(INS_ID)
    setInsuranceComplete(!insuranceComplete)
  }

  return (
    <div>
      {safeOptions.map((item) => {
        const checked = selected.includes(item.id)
        const rawDaily = Number((item as any)?.price ?? 0) || 0

        const apiDesc =
          (item as any)?.description ??
          (item as any)?.desc ??
          (item as any)?.text ??
          (item as any)?.details ??
          (item as any)?.content ??
          (item as any)?.info ??
          (item as any)?.note ??
          (item as any)?.tooltip ??
          ""

        return (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            className={cn("flex items-center justify-between gap-3 px-4 py-2", "cursor-pointer hover:bg-gray-50 active:bg-gray-100")}
            onClick={() => toggleOption(item.id)}
            onKeyDown={(e) => {
              if (!canToggleNow()) return
              if (e.key === "Enter" || e.key === " ") toggleOption(item.id)
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <RadixCheckbox checked={checked} onCheckedChange={() => toggleOption(item.id)} className="cursor-pointer" />

              <div className="flex items-center gap-2 min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">{item.title}</div>

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
                      className="text-gray-500 hover:text-gray-700"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation()
                        open()
                      }}
                      aria-label={tCommon("a11y.moreInfo")}
                      title={tCommon("a11y.moreInfo")}
                    >
                      <Info size={18} />
                    </button>
                  )}
                />
              </div>
            </div>

            <div className="text-left">{renderPriceLeft({ price: rawDaily, currencyLabel: currencyLabel || "", tCommon })}</div>
          </div>
        )
      })}

      {insuranceCompleteEnabled ? (
        <div
          role="button"
          tabIndex={0}
          className={cn("flex items-center justify-between gap-3 px-4 py-2", "cursor-pointer hover:bg-gray-50 active:bg-gray-100")}
          onClick={toggleInsurance}
          onKeyDown={(e) => {
            if (!canToggleNow()) return
            if (e.key === "Enter" || e.key === " ") toggleInsurance()
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <RadixCheckbox checked={insuranceComplete} onCheckedChange={toggleInsurance} className="cursor-pointer" />

            <div className="flex items-center gap-2 min-w-0">
              <div className="text-sm font-semibold text-gray-800 truncate">{tCommon("extras.insuranceCompleteTitle")}</div>

              <AppDrawer
                kind="insurance_complete"
                onOpenChange={handleDrawerOpenChange}
                trigger={({ open }) => (
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      open()
                    }}
                    aria-label={tCommon("a11y.moreInfo")}
                    title={tCommon("a11y.moreInfo")}
                  >
                    <Info size={18} />
                  </button>
                )}
              />
            </div>
          </div>

          <div className="text-left">
            {renderPriceLeft({
              price: Number(insuranceCompleteDailyPrice || 0),
              currencyLabel: currencyLabel || "",
              tCommon,
            })}
          </div>
        </div>
      ) : null}
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
    <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[11px] text-gray-500">
      <span className="inline-flex items-center gap-0.5">
        <span className="w-4 h-4 flex items-center justify-center">
          <IconGas />
        </span>
        <span className="text-gray-600">{safeFuel}</span>
      </span>

      <span className="inline-flex items-center gap-0.5">
        <span className="w-4 h-4 flex items-center justify-center">
          <IconGearBox />
        </span>
        <span className="text-gray-600">{safeGearbox}</span>
      </span>

      <span className="inline-flex items-center gap-0.5">
        <span className="w-4 h-4 flex items-center justify-center">
          <IconBag />
        </span>
        <span className="text-gray-600">
          {safeBaggage} {t("car.baggageUnit")}
        </span>
      </span>

      <span className="inline-flex items-center gap-0.5">
        <span className="w-4 h-4 flex items-center justify-center">
          <IconPerson />
        </span>
        <span className="text-gray-600">
          {safePassengers} {t("car.passengersUnit")}
        </span>
      </span>
    </div>
  )
}