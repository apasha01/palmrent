/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Download, Camera, X } from "lucide-react";
import Lottie from "lottie-react";
import SuccessPayment from "@/public/lottie/PaymentSuccess.json";
import Image from "next/image";
import { toast } from "react-toastify";

import SummaryRow from "../search/extra/SummarySection";

function toFaNumber(n: number | string) {
  const num = typeof n === "string" ? Number(n) : n;
  if (Number.isNaN(num)) return String(n);
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(num);
}

function formatMoneyFa(amount?: number | string, currency = "") {
  if (amount === null || typeof amount === "undefined") return "—";
  const num = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(num)) return String(amount);
  const txt = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(num);
  return currency ? `${txt} ${currency}` : txt;
}

function formatMoneyOrFree(amount: any, currency = "") {
  const n = typeof amount === "number" ? amount : Number(amount ?? 0);
  if (!Number.isFinite(n)) return "—";
  if (n <= 0) return "رایگان";
  return currency ? `${toFaNumber(n)} ${currency}` : `${toFaNumber(n)}`;
}

function formatDateTimeFa(input?: string) {
  if (!input) return "—";
  const iso = input.replace(" ", "T");
  const d = new Date(iso);
  if (isNaN(d.getTime())) return input.replace(" 00:00:00", "");
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

type UploadKey =
  | "id_card"
  | "dl_front"
  | "dl_back"
  | "intl_dl_front"
  | "intl_dl_back"
  | "visa";

type FilesState = Partial<Record<UploadKey, File | null>>;
type ErrorState = Partial<Record<UploadKey, boolean>>;

function logFormData(fd: FormData) {
  console.group("SUBMIT: FORMDATA");
  for (const [key, value] of fd.entries()) {
    if (value instanceof File) {
      console.log(key, { name: value.name, type: value.type, size: value.size });
    } else {
      console.log(key, value);
    }
  }
  console.groupEnd();
}

function UploadTile({
  label,
  file,
  onPick,
  onRemove,
  hasError,
  gridOneSlot,
}: {
  label: string;
  file?: File | null;
  onPick: () => void;
  onRemove?: () => void;
  hasError?: boolean;
  gridOneSlot?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className={gridOneSlot ? "col-span-1" : "w-full"}>
      <div className="relative">
        <button
          type="button"
          onClick={onPick}
          className={[
            "w-full rounded-2xl border relative overflow-hidden",
            hasError ? "border-red-500" : "border-gray-200 dark:border-gray-800",
            "bg-gray-100/70 dark:bg-gray-800/60",
            "hover:bg-gray-100 dark:hover:bg-gray-800",
            "transition",
            "h-[108px] sm:h-[120px]",
            "flex items-center justify-center",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/40",
          ].join(" ")}
        >
          {preview ? (
            <Image
              src={preview}
              alt={label}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 240px"
            />
          ) : null}

          <div className={["absolute inset-0", preview ? "bg-black/10" : "bg-transparent"].join(" ")} />

          <div className="relative z-10 flex flex-col items-center justify-center gap-2">
            <div className="h-11 w-11 flex items-center justify-center rounded-2xl">
              <Camera className="h-6 w-6 text-gray-800" />
            </div>
          </div>
        </button>

        {file && onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 left-2 z-20 h-8 w-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow"
            aria-label="remove"
          >
            <X className="h-4 w-4 text-gray-700" />
          </button>
        ) : null}
      </div>

      <div className="mt-2 text-center text-xs text-gray-700 dark:text-gray-200">{label}</div>

      {hasError ? <div className="mt-1 text-center text-[11px] text-red-600">این مورد الزامی است</div> : null}
    </div>
  );
}

export function PaymentSuccessCard({ rentData, trace, onDownloadVoucher, onSubmitUpload }: any) {
  const payment = rentData?.payment || {};
  const car = rentData?.car || {};
  const info = rentData?.rent_info || {};
  const summary = rentData?.summary || {};
  const details = rentData?.details || {};

  const currency = details?.currency || summary?.currency || "";

  const carTitle = useMemo(
    () => [car?.brand, car?.model, car?.year].filter(Boolean).join(" "),
    [car?.brand, car?.model, car?.year]
  );

  const fromText = formatDateTimeFa(info?.from_date);
  const toText = formatDateTimeFa(info?.to_date);
  const days = Number(info?.day_rent ?? summary?.days ?? 0) || 0;

  const remainAtDelivery =
    details?.totals?.remain_to_pay ??
    payment?.remain_to_pay ??
    payment?.remaining ??
    payment?.remain ??
    rentData?.remain_to_pay;

  const prePay =
    details?.totals?.pre_pay ??
    payment?.pre_pay ??
    payment?.prepay ??
    rentData?.pre_pay;

  const sumAll =
    details?.totals?.sum_all ??
    summary?.total ??
    details?.sum_all ??
    rentData?.sum_all;

  const [openInfo, setOpenInfo] = useState(true);

  // ===== files
  const [files, setFiles] = useState<FilesState>({});
  const [noIntl, setNoIntl] = useState<boolean>(false);
  const [noVisa, setNoVisa] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [downloadingVoucher, setDownloadingVoucher] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ErrorState>({});

  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const pick = (k: UploadKey) => inputs.current[k]?.click();

  const onFile = (k: UploadKey, f: File | null) => {
    setFiles((p) => ({ ...p, [k]: f }));
    setFieldErrors((p) => ({ ...p, [k]: false }));
  };

  const removeFile = (k: UploadKey) => setFiles((p) => ({ ...p, [k]: null }));

  const validate = () => {
    const next: ErrorState = {};

    if (!files.id_card) next.id_card = true;
    if (!files.dl_front) next.dl_front = true;
    if (!files.dl_back) next.dl_back = true;

    if (!noIntl) {
      if (!files.intl_dl_front) next.intl_dl_front = true;
      if (!files.intl_dl_back) next.intl_dl_back = true;
    }

    if (!noVisa) {
      if (!files.visa) next.visa = true;
    }

    setFieldErrors(next);

    const hasAny = Object.values(next).some(Boolean);
    if (hasAny) {
      toast.warning("لطفاً مدارک الزامی را تکمیل کنید");
      return false;
    }
    return true;
  };

  const submit = async () => {
    try {
      setErr(null);
      if (!validate()) return;

      setLoading(true);

      const fd = new FormData();
      fd.append("id_card", files.id_card as File);
      fd.append("dl_front", files.dl_front as File);
      fd.append("dl_back", files.dl_back as File);

      if (!noIntl) {
        fd.append("intl_dl_front", files.intl_dl_front as File);
        fd.append("intl_dl_back", files.intl_dl_back as File);
      } else {
        fd.append("no_intl", "1");
      }

      if (!noVisa) {
        fd.append("visa", files.visa as File);
      } else {
        fd.append("no_visa", "1");
      }

      const rentCode = rentData?.rent_code ?? "";
      const traceCode = trace ?? rentData?.tracing_code ?? "";
      if (rentCode) fd.append("rent_code", String(rentCode));
      if (traceCode) fd.append("trace_code", String(traceCode));

      logFormData(fd);

      if (typeof onSubmitUpload === "function") {
        await onSubmitUpload(fd);
      }

      toast.success("آپلود انجام شد");
    } catch (e: any) {
      setErr(e?.message || "خطا در آپلود مدارک");
      toast.warn(e?.message || "آپلود انجام نشد");
    } finally {
      setLoading(false);
    }
  };

  // ✅ دانلود وچر
  const handleDownloadVoucher = async () => {
    const rentId = rentData?.rent_id ?? rentData?.rentId ?? rentData?.id;
    if (!rentId) {
      toast.error("rent_id پیدا نشد");
      return;
    }

    if (typeof onDownloadVoucher === "function") {
      onDownloadVoucher();
      return;
    }

    try {
      setDownloadingVoucher(true);
      toast.info("در حال آماده‌سازی وچر...");

      const res = await fetch(`/api/voucher-pdf?rent_id=${rentId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `PDF API failed: ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `voucher-${rentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
      toast.success("وچر دانلود شد");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "دانلود وچر ناموفق بود");
    } finally {
      setDownloadingVoucher(false);
    }
  };

  // =========================
  // ✅ ریزفاکتور دقیق مثل "جزئیات حساب"
  // =========================
  const invoiceRows = useMemo(() => {
    const rows: { label: string; value: string; subLabel?: React.ReactNode; valueHint?: React.ReactNode }[] = [];

    const base = details?.base_rent || {};

    const baseAfter =
      Number(base?.rent_total_after_discount ?? base?.price ?? 0) || 0;

    const baseBefore =
      Number(base?.rent_total_before_discount ?? 0) || 0;

    const offPercent = Number(base?.off_percent ?? 0) || 0;

    const dailyAfter =
      Number(base?.rent_price_day_after_discount ?? 0) ||
      (days > 0 ? baseAfter / days : 0);

    const dailyBefore =
      Number(base?.rent_price_day_before_discount ?? 0) ||
      (days > 0 ? baseBefore / days : dailyAfter);

    // ✅ ردیف اجاره + subLabel تخفیف دقیقاً مثل همون صفحه
    rows.push({
      label: `قیمت اجاره ${toFaNumber(days || summary?.days || 0)} روز`,
      value: formatMoneyOrFree(baseAfter, currency),
      subLabel:
        offPercent > 0 ? (
          <span className="inline-flex items-center gap-1 flex-wrap justify-end">
            <span className="line-through text-gray-400">
              {toFaNumber(Math.round(dailyBefore))}
            </span>
            <span>
              {toFaNumber(Math.round(dailyAfter))} {currency}
            </span>
            <span className="text-gray-500">روزانه</span>
            <span>(</span>
            <span>{toFaNumber(offPercent)}% تخفیف</span>
            <span>)</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 flex-wrap justify-end">
            <span>
              {toFaNumber(Math.round(dailyAfter))} {currency}
            </span>
            <span className="text-gray-500">روزانه</span>
          </span>
        ),
    });

    // ✅ services (هزینه تحویل/عودت/ودیعه/...) - بیمه رایگان حذف میشه چون بک حذفش کرده
    const services = Array.isArray(details?.services) ? details.services : [];
    for (const s of services) {
      const priceNum = Number(s?.price ?? 0) || 0;

      // ✅ اگر هر چیزی رایگان بود، ننویس (طبق حرفت)
      // (به جز جاهایی که خودت بخوای؛ اینجا همه خدمات رایگان حذف)
      if (priceNum <= 0) continue;

      rows.push({
        label: s?.title || "—",
        value: formatMoneyOrFree(priceNum, currency),
      });
    }
// ✅ options items + daily detail
const optItems = Array.isArray(details?.options?.items) ? details.options.items : [];
const safeDays = Math.max(1, Number(days || summary?.days || 1) || 1);

for (const o of optItems) {
  const num = Math.max(1, Number(o?.num ?? 1) || 1);
  const title = String(o?.title ?? "آپشن");
  const sumPrice = Number(o?.sum_price ?? 0) || 0;
  if (sumPrice <= 0) continue;

  const unitPrice = Number(o?.unit_price ?? 0) || 0;

  // اگر unit_price واقعا روزانه بود از خودش استفاده کن
  // شرط: unit * days * num تقریبا برابر sum باشه
  const expected = unitPrice * safeDays * num;
  const isUnitDaily =
    unitPrice > 0 && expected > 0 && Math.abs(expected - sumPrice) <= Math.max(1, sumPrice * 0.02);

  const dailyPerOne = isUnitDaily
    ? unitPrice
    : sumPrice / safeDays / num; // روزانه برای ۱ عدد

  const dailyAll = dailyPerOne * num; // روزانه برای کل تعداد

  rows.push({
    label: `${title} × ${toFaNumber(num)}`,
    value: formatMoneyOrFree(sumPrice, currency),
    subLabel: (
      <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-200 flex-wrap justify-end">
        <span className="">قیمت روزانه:</span>
        <span className=" dark:text-gray-200">
          {formatMoneyFa(dailyAll, currency)}
        </span>

        {/* اگر تعداد > 1، ریز هم بده */}
        {num > 1 ? (
          <span className="text-gray-500">
            (هر عدد {formatMoneyFa(dailyPerOne, currency)})
          </span>
        ) : null}
      </span>
    ),
  });
}

    // ✅ جمع آپشن‌ها (اگر >0)
    const optSum = Number(details?.options?.sum ?? 0) || 0;
    if (optSum > 0) {
      rows.push({
        label: "جمع آپشن‌ها",
        value: formatMoneyOrFree(optSum, currency),
      });
    }

    // ✅ tax (اگر >0)
    const taxPercent = Number(details?.tax?.percent ?? 0) || 0;
    const taxPrice = Number(details?.tax?.price ?? 0) || 0;
    if (taxPrice > 0) {
      rows.push({
        label: `مالیات (${toFaNumber(taxPercent)}٪)`,
        value: formatMoneyOrFree(taxPrice, currency),
      });
    }

    // ✅ پیش پرداخت (پرداخت شده) - همیشه نمایش
    if (typeof prePay !== "undefined" && prePay !== null) {
      rows.push({
        label: "پیش پرداخت",
        value: `${formatMoneyFa(prePay, currency)} (پرداخت شده)`,
      });
    }

    // ✅ مانده حساب (مثل همون صفحه)
    if (typeof remainAtDelivery !== "undefined" && remainAtDelivery !== null) {
      rows.push({
        label: "مانده حساب",
        value: formatMoneyFa(remainAtDelivery, currency),
      });
    }

    // ✅ (اختیاری) هزینه نهایی برای X روز - اگر خواستی داخل ریزفاکتور هم بیاد
    // اگر نمیخوای، این بخش رو کامنت کن
    if (typeof sumAll !== "undefined" && sumAll !== null) {
      rows.push({
        label: `هزینه نهایی برای ${toFaNumber(days || summary?.days || 0)} روز`,
        value: formatMoneyFa(sumAll, currency),
      });
    }

    return rows;
  }, [details, currency, days, summary?.days, remainAtDelivery, prePay, sumAll]);

  return (
    <div className="w-full bg-white dark:bg-gray-900">
      <div className="mx-auto w-full px-4 max-w-5xl pb-24">
        <div className="flex flex-col items-center text-center">
          <Lottie animationData={SuccessPayment} style={{ height: "148px" }} loop={false} />
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">پرداخت با موفقیت انجام شد</h1>
          <p className="text-xs leading-7 text-gray-600 dark:text-gray-300 max-w-[430px]">
            رزرو شما قطعی شد. وچر و مدارک از همین صفحه قابل مدیریت است.
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="font-black text-gray-900 dark:text-white">اطلاعات رزرو</div>

          <button
            type="button"
            onClick={handleDownloadVoucher}
            disabled={downloadingVoucher}
            className={[
              "inline-flex items-center gap-2 text-blue-600 font-black",
              downloadingVoucher ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
          >
            <Download className="h-4 w-4" />
            {downloadingVoucher ? "در حال دانلود..." : "دانلود وچر"}
          </button>
        </div>

        {/* ✅ کارت اصلی (خلاصه + ریزفاکتور) */}
        <Card className="mt-2 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-none">
          <CardContent className="p-0">
            <button
              type="button"
              onClick={() => setOpenInfo((p) => !p)}
              className="w-full flex items-center justify-between p-3"
              aria-label="toggle info"
            >
              <div className="text-right">
                <div className="font-black text-gray-900 dark:text-white">
                  {carTitle || summary?.car_name || "—"}{" "}
                  {days ? <span className="text-gray-500 font-bold">({toFaNumber(days)} روز)</span> : null}
                </div>

                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  از {fromText} تا {toText}
                </div>

                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  مانده هنگام تحویل :
                  <span className="font-black text-gray-900 dark:text-white mr-2">
                    {typeof remainAtDelivery !== "undefined" ? formatMoneyFa(remainAtDelivery, currency) : "—"}
                  </span>
                </div>
              </div>

              <ChevronDown
                className={[
                  "h-5 w-5 text-gray-500 transition-transform",
                  openInfo ? "rotate-180" : "rotate-0",
                ].join(" ")}
              />
            </button>

            {/* ✅ ریزفاکتور - دقیقا با SummaryRow */}
            {openInfo ? (
              <div className="px-4 pb-4">
                <div className="mt-2 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/40 text-xs font-black text-gray-700 dark:text-gray-200">
                    ریز فاکتور رزرو
                  </div>

                  <div className="px-3 divide-y divide-gray-100 dark:divide-gray-800">
                    {invoiceRows.map((row, idx) => (
                      <SummaryRow
                        key={idx}
                        label={row.label}
                        value={row.value}
                        subLabel={row.subLabel}
                        valueHint={row.valueHint}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* ===== Upload docs header ===== */}
        <div className="mt-6 text-xs md:text-sm text-gray-900 dark:text-white">
          برای صرفه‌جویی در زمان تحویل، عکس‌های مدارک خود را آپلود کنید
        </div>

        {/* ===== Passport/ID ===== */}
        <div className="mt-5">
          <div className="text-lg font-black text-gray-900 dark:text-white">گذرنامه/کارت شناسایی</div>

          <div className="mt-3 grid grid-cols-2 gap-4">
            <UploadTile
              label="عکس"
              file={files.id_card}
              onPick={() => pick("id_card")}
              onRemove={() => removeFile("id_card")}
              hasError={fieldErrors.id_card}
              gridOneSlot
            />
            <div className="hidden" />
          </div>

          <Input
            ref={(el) => {
              inputs.current["id_card"] = el as unknown as HTMLInputElement;
            }}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile("id_card", (e.target as HTMLInputElement).files?.[0] ?? null)}
          />
        </div>

        {/* ===== Driving license ===== */}
        <div className="mt-6">
          <div className="text-lg font-black text-gray-900 dark:text-white">گواهینامه رانندگی</div>

          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <UploadTile
                label="سمت عقب"
                file={files.dl_back}
                onPick={() => pick("dl_back")}
                onRemove={() => removeFile("dl_back")}
                hasError={fieldErrors.dl_back}
              />
              <Input
                ref={(el) => {
                  inputs.current["dl_back"] = el as unknown as HTMLInputElement;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFile("dl_back", (e.target as HTMLInputElement).files?.[0] ?? null)}
              />
            </div>

            <div>
              <UploadTile
                label="جبهه"
                file={files.dl_front}
                onPick={() => pick("dl_front")}
                onRemove={() => removeFile("dl_front")}
                hasError={fieldErrors.dl_front}
              />
              <Input
                ref={(el) => {
                  inputs.current["dl_front"] = el as unknown as HTMLInputElement;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFile("dl_front", (e.target as HTMLInputElement).files?.[0] ?? null)}
              />
            </div>
          </div>
        </div>

        {/* ===== International DL ===== */}
        <div className="mt-6">
          <div className="text-lg font-black text-gray-900 dark:text-white border-b">
            گواهینامه رانندگی بین المللی
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">گواهینامه رانندگی بین المللی ندارم</div>

            <Checkbox
              checked={noIntl}
              onCheckedChange={(checked) => {
                const v = checked === true;
                setNoIntl(v);
                if (v) {
                  setFieldErrors((p) => ({
                    ...p,
                    intl_dl_front: false,
                    intl_dl_back: false,
                  }));
                }
              }}
              className="h-5 w-5"
            />
          </div>

          {!noIntl ? (
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <UploadTile
                  label="سمت عقب"
                  file={files.intl_dl_back}
                  onPick={() => pick("intl_dl_back")}
                  onRemove={() => removeFile("intl_dl_back")}
                  hasError={fieldErrors.intl_dl_back}
                />
                <Input
                  ref={(el) => {
                    inputs.current["intl_dl_back"] = el as unknown as HTMLInputElement;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onFile("intl_dl_back", (e.target as HTMLInputElement).files?.[0] ?? null)}
                />
              </div>

              <div>
                <UploadTile
                  label="جبهه"
                  file={files.intl_dl_front}
                  onPick={() => pick("intl_dl_front")}
                  onRemove={() => removeFile("intl_dl_front")}
                  hasError={fieldErrors.intl_dl_front}
                />
                <Input
                  ref={(el) => {
                    inputs.current["intl_dl_front"] = el as unknown as HTMLInputElement;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onFile("intl_dl_front", (e.target as HTMLInputElement).files?.[0] ?? null)}
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* ===== Visa ===== */}
        <div className="mt-6">
          <div className="text-lg font-black text-gray-900 dark:text-white border-b">ویزا</div>

          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">من ویزا ندارم</div>

            <Checkbox
              checked={noVisa}
              onCheckedChange={(checked) => {
                const v = checked === true;
                setNoVisa(v);
                if (v) setFieldErrors((p) => ({ ...p, visa: false }));
              }}
              className="h-5 w-5"
            />
          </div>

          {!noVisa ? (
            <>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <UploadTile
                  label="عکس"
                  file={files.visa}
                  onPick={() => pick("visa")}
                  onRemove={() => removeFile("visa")}
                  hasError={fieldErrors.visa}
                  gridOneSlot
                />
                <div className="hidden" />
              </div>

              <Input
                ref={(el) => {
                  inputs.current["visa"] = el as unknown as HTMLInputElement;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFile("visa", (e.target as HTMLInputElement).files?.[0] ?? null)}
              />
            </>
          ) : null}

          {err ? <div className="mt-4 text-xs text-red-600">{err}</div> : null}
        </div>
      </div>

      <div className="fixed z-20 bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="mx-auto w-full max-w-[560px] px-4 py-3">
          <Button
            onClick={submit}
            disabled={loading}
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black disabled:opacity-50"
          >
            {loading ? "در حال آپلود..." : "آپلود مدارک"}
          </Button>
        </div>
      </div>
    </div>
  );
}
