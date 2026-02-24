/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"

import { STORAGE_URL } from "@/lib/apiClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PriceGroupsResponsive } from "@/components/search/extra/PriceGroupsResponsive"
import { SelectedCarMeta, formatNum } from "@/components/search/helpers/utils"
import { Info, Coins } from "lucide-react"

type Props = {
  apiData: any
  totals: { rentDays: number }
  currencyLabel: string
  offPercent: number
  dailyBefore: number
  dailyAfter: number

  showUnlimitedKm: boolean
  showFreeDelivery: boolean
  showFreeInsurance: boolean
  showNoDeposit: boolean

  showDeposit: boolean
  depositPrice: number
}

export default function SelectedCarCard({
  apiData,
  totals,
  currencyLabel,
  offPercent,
  dailyBefore,
  dailyAfter,
  showUnlimitedKm,
  showFreeDelivery,
  showFreeInsurance,
  showNoDeposit,
  showDeposit,
  depositPrice,
}: Props) {
  const t = useTranslations("InformationStep")

  const photo0 = Array.isArray((apiData?.item as any)?.photo)
    ? (apiData.item as any).photo?.[0]
    : typeof (apiData?.item as any)?.photo === "string"
      ? (apiData.item as any).photo
      : ""

  return (
    <Card className="border border-gray-200 rounded-none lg:rounded-xl shadow-sm p-0 bg-white dark:bg-gray-900 gap-0 overflow-hidden">
      <div className="hidden md:block">
        <CardHeader className="px-3 pt-4 pb-2 m-0">
          <CardTitle className="text-sm text-gray-700 dark:text-gray-200">{t("selectedCar.title")}</CardTitle>
        </CardHeader>
        <Separator />
      </div>

      <CardContent className="p-2">
        <div className="flex items-start gap-2">
          <div className="relative w-26 h-18 rounded bg-gray-100 shrink-0 overflow-hidden">
            <Image
              src={`${STORAGE_URL}${photo0}` || "/images/placeholder.png"}
              alt={(apiData.item as any).title}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-right font-bold text-gray-800 truncate leading-5">{(apiData.item as any).title}</div>

            <SelectedCarMeta
              fuel={(apiData.item as any).fuel}
              gearbox={(apiData.item as any).gearbox}
              baggage={(apiData.item as any).baggage}
              passengers={(apiData.item as any).person}
            />

            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-600 ">
              <div className="flex items-center gap-0.5 min-w-0">
                <span>{t("selectedCar.dailyPriceFor")}</span>
                <span className="text-gray-700">{t("common.days", { count: totals.rentDays })}</span>

                <PriceGroupsResponsive
                  prices={(apiData as any)?.item?.prices}
                  currencyLabel={currencyLabel}
                  trigger={<Info className="size-4 text-gray-700" />}
                />

                <span>:</span>

                {offPercent > 0 ? <span className="text-gray-400 line-through">{formatNum(dailyBefore)}</span> : null}
                <span className="text-gray-900 font-bold">{formatNum(dailyAfter)}</span>
                <span className="text-gray-500">{currencyLabel}</span>
              </div>

              {offPercent > 0 ? (
                <Badge className="rounded-full bg-amber-100 text-amber-900 dark:bg-amber-600 dark:text-amber-100 px-1 py-0.5 text-[12px]">
                  {t("selectedCar.discountBadge", { percent: formatNum(offPercent) })}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <Separator className="my-3" />

        <div className="flex flex-wrap gap-2">
          {showUnlimitedKm ? (
            <Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-1 text-[11px]">
              {t("badges.unlimitedKm")}
            </Badge>
          ) : null}
          {showFreeDelivery ? (
            <Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-1 text-[11px]">
              {t("badges.freeDelivery")}
            </Badge>
          ) : null}
          {showFreeInsurance ? (
            <Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-1 text-[11px]">
              {t("badges.freeInsurance")}
            </Badge>
          ) : null}
          {showNoDeposit ? (
            <Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-1 text-[11px]">
              {t("badges.noDeposit")}
            </Badge>
          ) : null}
        </div>

        {showDeposit ? (
          <>
            <Separator className="my-4" />
            <div className="text-right">
              <div className="text-md font-bold text-gray-800">{t("deposit.title")}</div>

              <div className="mt-2 flex items-center justify-between">
                <div className="text-right flex items-center gap-2">
                  <Coins size={16} className="text-gray-500" />
                  <span className="text-sm font-semibold text-gray-500">{t("deposit.trafficDepositLabel")}</span>
                </div>

                <div className="text-left text-gray-700 whitespace-nowrap">
                  {formatNum(depositPrice)} {currencyLabel}
                </div>
              </div>

              <div className="text-xs text-gray-500 mt-3 leading-5">{t("deposit.hint21Days")}</div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}