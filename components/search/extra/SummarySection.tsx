import * as React from "react";

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
  const isFree = value.includes("رایگان");

  const isDelivery = label.startsWith("محل تحویل:");
  const isReturn = label.startsWith("محل عودت:");

  const normalizedLabel = isDelivery
    ? "هزینه تحویل"
    : isReturn
      ? "هزینه عودت"
      : label;

  const normalizedSub: React.ReactNode = isDelivery
    ? label.replace("محل تحویل:", "").trim()
    : isReturn
      ? label.replace("محل عودت:", "").trim()
      : subLabel ?? null;

  const hasSub = Boolean(normalizedSub);
  const hasDaily = Boolean(dailyPriceLabel);

  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 text-right">
          {/* ✅ Title skeleton too */}
          <div className="text-sm text-gray-800 leading-5">
            {loading ? (
              <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
            ) : (
              normalizedLabel
            )}
          </div>

          {/* ✅ Daily price line */}
          {hasDaily ? (
            loading ? (
              <div className="mt-1 h-3 w-40 rounded bg-gray-200 animate-pulse" />
            ) : (
              <div className="text-[11px] text-gray-500 mt-1 leading-4 whitespace-pre-line break-words">
                {dailyPriceLabel}
              </div>
            )
          ) : null}

          {/* ✅ Sub label */}
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

        <div className="text-left">
          {/* ✅ ONLY AMOUNT skeleton (mablagh) */}
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
