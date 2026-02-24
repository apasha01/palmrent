/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { formatNum } from "@/components/search/helpers/utils";
import { Info } from "lucide-react";

type Props = {
  showButton: boolean;
  apiData: any;
  totals: any;
  currencyLabel: string;
  baseRentAfter: number;
  offPercent: number;
  dailyBefore: number;
  dailyAfter: number;
  pendingSummaryIds: Record<number, boolean>;
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
  pendingSummaryIds,
  onOpenCoupon,
  onSubmit,
  isSubmitting,
}: Props) {
  const t = useTranslations("InformationStep");
  const tRow = useTranslations("SummaryRow"); // ✅ اینجا free وجود دارد

  // ✅ FIX: formatter (no TS error) + correct i18n key for "free"
  const formatMoneyOrFreeFixed = React.useCallback(
    (n: number) => {
      const v = Number(n || 0);
      if (!Number.isFinite(v) || v <= 0) return tRow("common.free"); // ✅ درست
      return currencyLabel
        ? `${formatNum(v)} ${currencyLabel}`
        : `${formatNum(v)}`;
    },
    [currencyLabel, tRow]
  );

  return (
    <Card className="border border-gray-200 p-0 pt-2 pb-1 rounded-xl shadow-sm gap-0 overflow-hidden bg-white">
      <CardHeader className="px-4">
        <CardTitle className="text-md font-bold text-gray-700 p-0 m-0 text-start">
          {t("summary.title")}
        </CardTitle>
      </CardHeader>

      <Separator />

      <CardContent className="pt-2 px-4">
        <div>
          <SummaryRow
            label={t("summary.rentPriceLabel", { days: totals.rentDays })}
            value={formatMoneyOrFreeFixed(baseRentAfter)}
            valueHint={
              <button
                type="button"
                onClick={onOpenCoupon}
                className="text-[10px] font-medium text-blue-600 mt-0.5"
              >
                {t("summary.haveCoupon")}
              </button>
            }
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
                  <span>{t("summary.discountInline", { percent: offPercent })}</span>
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

          {totals.extraItems.slice(0, 12).map((x: any, i: number) => {
            const optId = Number(x?.optionId);
            const shouldSkeleton =
              Number.isFinite(optId) && Boolean(pendingSummaryIds[optId]);

            return (
              <SummaryRow
                key={i}
                label={x.title}
                value={formatMoneyOrFreeFixed(Number(x.price))}
                subLabel={x.subLabel}
                loading={shouldSkeleton}
              />
            );
          })}

          {totals.tax > 0 && (
            <SummaryRow
              label={t("summary.tax")}
              subLabel={t("summary.taxPercent", {
                percent: (apiData.item as any).tax_percent || "0",
              })}
              value={formatMoneyOrFreeFixed(Number(totals.tax))}
            />
          )}
        </div>

        <div className="mt-4 pt-4 border-gray-200">
          <div className="flex items-end justify-between">
            <div className="text-start">
              <div className="text-lg text-gray-800">
                {t("summary.finalCostForDays", { days: totals.rentDays })}
              </div>
            </div>

            <div className="text-lg text-blue-600 whitespace-nowrap text-end">
              {formatNum(totals.total)} {currencyLabel}
            </div>
          </div>
        </div>

        <div className="mt-4 py-4 pb-6 border-t border-gray-200 text-xs text-gray-500 flex items-center gap-2">
          <Info size={16} className="text-gray-400" />
          <span>{t("summary.acceptRulesHint")}</span>
        </div>

        {showButton && (
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full h-14 mb-4 rounded-xl text-base bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? t("common.submitting") : t("common.finalSubmit")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/* ================= SummaryRow ================= */
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

  const freeWord = t("common.free");
  const isFree =
    String(value).includes(freeWord) || String(value).includes("رایگان");

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
      : subLabel ?? null;

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
                  <span className="text-xs text-gray-400 line-through">
                    {valueBefore}
                  </span>
                ) : null}

                <span
                  className={`text-sm ${isFree ? "text-gray-500" : "text-gray-800"}`}
                >
                  {value}
                </span>
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