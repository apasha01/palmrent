import * as React from "react";
import { useTranslations } from "next-intl";

/* ================= SummaryRow ================= */
export default function SummaryRow({
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

  // ✅ Free detection: try to detect based on i18n keyword + legacy string
  const freeWord = t("common.free");
  const isFree = String(value).includes(freeWord) || String(value).includes("رایگان");

  // ✅ Normalize delivery/return labels for ALL languages:
  // We avoid `startsWith("محل تحویل")` and instead normalize by prefixes defined in i18n.
  const deliveryPrefix = t("prefix.delivery"); // e.g. "محل تحویل:"
  const returnPrefix = t("prefix.return"); // e.g. "محل عودت:"

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
        <div className="flex-1">
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

        <div className="">
          <div className="flex items-center gap-2 whitespace-nowrap">
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
              <div className="mt-1 h-3 w-16 rounded bg-gray-200 animate-pulse ml-auto" />
            ) : (
              <div className="mt-1 text-[10px] text-blue-600 text-left">
                {valueHint}
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}