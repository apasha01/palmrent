/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { formatNum } from "@/components/search/helpers/utils";
import { Percent } from "lucide-react";

type Props = {
  showButton: boolean;
  apiData: any;
  totals: any;
  currencyLabel: string;
  baseRentAfter: number;
  offPercent: number;
  dailyBefore: number;
  dailyAfter: number;
  totalBefore: number;
  pendingSummaryIds: Record<number, boolean>;
  isSummaryPending: boolean;
  onOpenCoupon: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
};

export default function SummaryCard({
  showButton,
  apiData,
  totals,
  currencyLabel,
  baseRentAfter,
  offPercent,
  dailyBefore,
  dailyAfter,
  totalBefore,
  pendingSummaryIds,
  isSummaryPending,
  onOpenCoupon,
  onSubmit,
  isSubmitting,
}: Props) {
  const t = useTranslations("InformationStep");
  const tRow = useTranslations("SummaryRow");

  const formatMoneyOrFreeFixed = React.useCallback(
    (n: number) => {
      const v = Number(n || 0);
      if (!Number.isFinite(v) || v <= 0) return tRow("common.free");
      return currencyLabel
        ? `${formatNum(v)} ${currencyLabel}`
        : `${formatNum(v)}`;
    },
    [currencyLabel, tRow],
  );

  const showDiscount =
    offPercent > 0 && totalBefore > 0 && totalBefore > totals.total;

  const baseRentBefore =
    showDiscount && dailyBefore > 0 ? dailyBefore * totals.rentDays : undefined;

  const extraItems: any[] = totals.extraItems?.slice(0, 12) ?? [];

  const hasTax = totals.tax > 0;

  return (
    <Card className="border border-gray-200 p-0 pt-3 pb-1 rounded-xl shadow-sm gap-0 overflow-hidden bg-white">
      <CardHeader className="px-4 pb-2 flex justify-between items-center">
        <CardTitle className="text-md font-bold text-gray-700 p-0 m-0 text-start">
          {t("summary.title")}
        </CardTitle>
        <button
          type="button"
          onClick={onOpenCoupon}
          className="text-[12px] font-bold text-blue-500"
        >
          <div className="flex gap-1">
            <Percent size={14} />
            {t("summary.haveCoupon")}
          </div>
        </button>
      </CardHeader>

      <Separator />

      <CardContent className="px-4!">
        <div className="relative bg-green-100 my-2 mb-2">
          {/* بوردر موجی بالا */}
          <div
            className="absolute top-0 left-0 right-0 h-3"
            style={{
              background: "white",
              maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12'%3E%3Cpolygon points='0,0 6,12 12,0' fill='black'/%3E%3C/svg%3E")`,
              maskSize: "11.5px 6px",
              maskRepeat: "repeat-x",
              WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12'%3E%3Cpolygon points='0,0 6,12 12,0' fill='black'/%3E%3C/svg%3E")`,
              WebkitMaskSize: "11.5px 6px",
              WebkitMaskRepeat: "repeat-x",
            }}
          />

          {/* محتوا */}
          <div className="px-4 pt-5 pb-2">
            {/* ردیف اجاره پایه */}
            <div className="border-b border-green-300/70 pb-0.5 mb-0.5">
              <SummaryRow
                label={t("summary.rentPriceLabel", { days: totals.rentDays })}
                value={formatMoneyOrFreeFixed(baseRentAfter)}
                valueBefore={
                  baseRentBefore ? `${formatNum(baseRentBefore)}` : undefined
                }
                loading={isSummaryPending}
                subLabel={
                  offPercent > 0 ? (
                    <span className="inline-flex items-center gap-1 flex-wrap justify-end">
                      <span className="line-through text-gray-400">
                        {formatNum(dailyBefore)}
                      </span>
                      <span>
                        {formatNum(dailyAfter)} {currencyLabel}
                      </span>
                      <span className="text-gray-500">{t("common.daily")}</span>
                      <span>(</span>
                      <span>
                        {t("summary.discountInline", { percent: offPercent })}
                      </span>
                      <span>)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 flex-wrap justify-end">
                      <span>
                        {formatNum(dailyAfter)} {currencyLabel}
                      </span>
                      <span className="text-gray-500">{t("common.daily")}</span>
                    </span>
                  )
                }
              />
            </div>

            {/* ردیف‌های اکسترا */}
            {extraItems.map((x: any, i: number) => {
              const isLastExtra = i === extraItems.length - 1;
              const needsBorder = !isLastExtra || hasTax;
              return (
                <div
                  key={i}
                  className={needsBorder ? "border-b border-green-300/70 pb-0.5 mb-0.5" : ""}
                >
                  <SummaryRow
                    label={x.title}
                    value={formatMoneyOrFreeFixed(Number(x.price))}
                    subLabel={x.subLabel}
                    loading={isSummaryPending}
                  />
                </div>
              );
            })}

            {/* مالیات */}
            {hasTax && (
              <div>
                <SummaryRow
                  label={t("summary.tax")}
                  subLabel={t("summary.taxPercent", {
                    percent: (apiData.item as any).tax_percent || "0",
                  })}
                  value={formatMoneyOrFreeFixed(Number(totals.tax))}
                  loading={isSummaryPending}
                />
              </div>
            )}

            {/* جمع کل */}
            <div className="mt-2 pt-2 pb-4">
              <div className="flex items-center justify-between">
                <div className="text-start">
                  <div className="text-sm text-gray-800">
                    {t("summary.finalCostForDays", { days: totals.rentDays })}
                  </div>
                </div>

                <div className="text-end">
                  {isSummaryPending ? (
                    <div className="h-6 w-32 rounded bg-gray-200 animate-pulse" />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {showDiscount && (
                        <div className="text-sm text-gray-400 line-through">
                          {formatNum(totalBefore)}
                        </div>
                      )}
                      <div className="text-sm font-bold text-blue-600">
                        {formatNum(totals.total)} {currencyLabel}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* بوردر موجی پایین */}
          <div
            className="absolute bottom-0 left-0 right-0 h-3"
            style={{
              background: "white",
              maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12'%3E%3Cpolygon points='0,12 6,0 12,12' fill='black'/%3E%3C/svg%3E")`,
              maskSize: "11.5px 6px",
              maskRepeat: "repeat-x",
              maskPosition: "bottom",
              WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12'%3E%3Cpolygon points='0,12 6,0 12,12' fill='black'/%3E%3C/svg%3E")`,
              WebkitMaskSize: "11.5px 6px",
              WebkitMaskRepeat: "repeat-x",
              WebkitMaskPosition: "bottom",
            }}
          />
        </div>

        {showButton && (
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || isSummaryPending}
            className="w-full h-13 mb-4 rounded-lg text-base bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? t("common.submitting") : t("common.finalSubmit")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  valueBefore,
  subLabel,
  dailyPriceLabel,
  valueHint,
  loading,
}: {
  label: string;
  value: string;
  valueBefore?: string;
  subLabel?: React.ReactNode;
  dailyPriceLabel?: React.ReactNode;
  valueHint?: React.ReactNode;
  loading?: boolean;
}) {
  const t = useTranslations("SummaryRow");

  const deliveryPrefix = t("prefix.delivery");
  const returnPrefix = t("prefix.return");

  const isDelivery = String(label).startsWith(deliveryPrefix);
  const isReturn = String(label).startsWith(returnPrefix);

  const normalizedLabel = isDelivery
    ? t("normalized.deliveryFee")
    : isReturn
      ? t("normalized.returnFee")
      : label;

  const normalizedSub: React.ReactNode = isDelivery
    ? String(label).replace(deliveryPrefix, "").trim()
    : isReturn
      ? String(label).replace(returnPrefix, "").trim()
      : (subLabel ?? null);

  const hasSub = Boolean(normalizedSub);
  const hasDaily = Boolean(dailyPriceLabel);

  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 text-start">
          <div className="text-sm text-gray-800 leading-5">
            {loading ? (
              <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
            ) : (
              normalizedLabel
            )}
          </div>

          {hasDaily ? (
            loading ? (
              <div className="mt-1 h-3 w-40 rounded bg-gray-200 animate-pulse" />
            ) : (
              <div className="text-[11px] text-gray-500 mt-1 leading-4 whitespace-pre-line break-words">
                {dailyPriceLabel}
              </div>
            )
          ) : null}

          {hasSub ? (
            loading ? (
              <div className="mt-1 h-3 w-48 rounded bg-gray-200 animate-pulse" />
            ) : (
              <div className="text-xs text-gray-500 mt-1 leading-4 whitespace-pre-line break-words">
                {normalizedSub}
              </div>
            )
          ) : null}
        </div>

        <div className="text-end">
          <div className="flex items-center gap-2 whitespace-nowrap justify-end">
            {loading ? (
              <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
            ) : (
              <>
                {valueBefore ? (
                  <span className="text-sm text-gray-400 line-through">
                    {valueBefore}
                  </span>
                ) : null}
                <span className="text-sm text-gray-800">{value}</span>
              </>
            )}
          </div>

          {valueHint ? (
            loading ? (
              <div className="mt-1 h-3 w-16 rounded bg-gray-200 animate-pulse ms-auto" />
            ) : (
              <div className="mt-1 text-[10px] font-medium text-blue-600 text-end">
                {valueHint}
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}