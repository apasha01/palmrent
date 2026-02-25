/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import React from "react";

import { Label } from "../ui/label";
import { CalendarRange, Clock, MapPin, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DateRangePickerPopover,
  Range,
} from "../custom/calender/date-range-picker";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import useDIR from "@/hooks/use-rtl";
import { useBranches } from "@/services/branches/branches.queries";
import { useLocale, useTranslations } from "next-intl";
import { formatJalaliDate } from "@/lib/date-utils";
import { Spinner } from "../ui/spinner";
import { useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";

function toPersianDigits(input: string) {
  const en = "0123456789";
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  return String(input).replace(/[0-9]/g, (d) => fa[en.indexOf(d)]);
}

function toEnglishDigits(input: string) {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  const en = "0123456789";

  return String(input).replace(/[۰-۹٠-٩]/g, (d) => {
    const iFa = fa.indexOf(d);
    if (iFa !== -1) return en[iFa];
    const iAr = ar.indexOf(d);
    if (iAr !== -1) return en[iAr];
    return d;
  });
}

/** ✅ تاریخ جلالی YYYY/MM/DD با اعداد فارسی */
function formatJalaliYMD(date: Date | null) {
  if (!date) return "---";
  return toPersianDigits(toEnglishDigits(formatJalaliDate(date))); // 1404/12/30
}

/** ✅ Trigger: دسکتاپ همون قبلی (تاریخ+ساعت)، موبایل pill فقط تاریخ */
function DateTimeTrigger({
  date,
  time,
  datePlaceholder,
  timePlaceholder,
  monthNames, // برای سازگاری نگه داشتیم
  variant = "default",
}: {
  date?: Date | null;
  time?: string;
  datePlaceholder: string;
  timePlaceholder: string;
  monthNames: string[];
  variant?: "default" | "mobilePill";
}) {
  const hasDate = date instanceof Date && !isNaN(date.getTime());

  // ✅ موبایل: فقط تاریخ YYYY/MM/DD + یک آیکون
  if (variant === "mobilePill") {
    return (
      <div className="flex items-center h-10 w-full overflow-hidden bg-transparent">
        <div className="flex items-center px-3 gap-2 w-full">
          <CalendarRange className="text-gray-500 shrink-0" size={18} />
          {hasDate ? (
            <p className="truncate text-sm text-gray-900 dark:text-gray-100 font-medium">
              {formatJalaliYMD(date!)}
            </p>
          ) : (
            <p className="truncate text-sm text-gray-500">{datePlaceholder}</p>
          )}
        </div>
      </div>
    );
  }

  // ✅ دسکتاپ: دقیقاً همون طراحی فعلی شما (تاریخ + ساعت)
  return (
    <div className="flex items-center border h-10 rounded-md w-full overflow-hidden bg-transparent">
      {/* تاریخ */}
      <div className="flex items-center px-2 gap-1.5 w-1/2">
        <CalendarRange className="text-gray-500 shrink-0" size={18} />
        {hasDate ? (
          <p className="truncate text-sm text-gray-900 dark:text-gray-100 font-medium">
            {/* دسکتاپ رو هم میتونی YMD کنی؛ ولی گفتی کامپیوتر همون بمونه */}
            {formatJalaliYMD(date!)}
          </p>
        ) : (
          <p className="truncate text-sm text-gray-500">{datePlaceholder}</p>
        )}
      </div>

      <Separator orientation="vertical" />

      {/* ساعت */}
      <div className="flex items-center px-2 gap-1 w-1/2">
        <Clock className="text-gray-500 shrink-0" size={18} />
        {hasDate && time ? (
          <p className="truncate text-sm text-gray-900 dark:text-gray-100 font-medium">
            {toPersianDigits(time)}
          </p>
        ) : (
          <p className="truncate text-sm text-gray-500">{timePlaceholder}</p>
        )}
      </div>
    </div>
  );
}

function MobileFloatLabel({ text }: { text: string }) {
  return (
    <span className="pointer-events-none rounded-t-md absolute right-3 top-0 -translate-y-1/2 bg-white px-1 text-xs text-gray-600 dark:bg-gray-900">
      {text}
    </span>
  );
}

/** ✅ نرمال‌سازی برای مقایسه slug/title */
function normalizeSlugLike(s: string) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

/** ✅ خروجی جلالی مناسب query string: 1404/10/15 */
function jalaliQueryDate(date: Date | null) {
  if (!date) return "";
  return toEnglishDigits(formatJalaliDate(date)); // YYYY/MM/DD
}

/** ✅ ساعت امن: همیشه HH:mm */
function safeTime(t?: string | null) {
  const s = String(t || "").trim();
  if (!s) return "10:00";

  const m = s.match(/^(\d{1,2}):(\d{1,2})$/);
  if (m) {
    const hh = String(Math.min(23, Math.max(0, Number(m[1])))).padStart(2, "0");
    const mm = String(Math.min(59, Math.max(0, Number(m[2])))).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  return "10:00";
}

/** ✅ فردا تا ۵ روز بعد + ساعت ۱۰:۰۰ */
function makeDefaultRange(): Range {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + 1);

  const end = new Date(start);
  end.setDate(end.getDate() + 5);

  return { start, end };
}

type NavSectionProps = {
  image?: string;
  title?: React.ReactNode;
  subtitle1?: React.ReactNode;
  subtitle2?: React.ReactNode;
};

const NavSection = ({ image, title, subtitle1, subtitle2 }: NavSectionProps) => {
  useDIR();

  const t = useTranslations("NavSection");
  const router = useRouter();
  const locale = useLocale();
  const params = useParams() as any;

  const monthNames = React.useMemo(
    () => [
      t("months.1"),
      t("months.2"),
      t("months.3"),
      t("months.4"),
      t("months.5"),
      t("months.6"),
      t("months.7"),
      t("months.8"),
      t("months.9"),
      t("months.10"),
      t("months.11"),
      t("months.12"),
    ],
    [t],
  );

  const branchSlugFromRoute =
    params?.cityName ?? params?.slug ?? params?.branch ?? params?.city ?? "";
  const routeSlug = normalizeSlugLike(String(branchSlugFromRoute || ""));

  const { data, isLoading, isFetching } = useBranches(locale) as any;

  const [selectedCity, setSelectedCity] = React.useState<string>("");
  const [cityLocked, setCityLocked] = React.useState(false);

  const [selectedRange, setSelectedRange] = React.useState<Range>(() =>
    makeDefaultRange(),
  );

  const [deliveryTime, setDeliveryTime] = React.useState<string>("10:00");
  const [returnTime, setReturnTime] = React.useState<string>("10:00");

  const handleConfirm = (payload: {
    start: Date;
    end: Date;
    deliveryTime: string;
    returnTime: string;
  }) => {
    const def = makeDefaultRange();

    const start =
      payload?.start instanceof Date && !isNaN(payload.start.getTime())
        ? payload.start
        : def.start;

    const end =
      payload?.end instanceof Date && !isNaN(payload.end.getTime())
        ? payload.end
        : def.end;

    setSelectedRange({ start, end });
    setDeliveryTime(safeTime(payload?.deliveryTime));
    setReturnTime(safeTime(payload?.returnTime));
  };

  const handleClear = () => {
    setSelectedRange(makeDefaultRange());
    setDeliveryTime("10:00");
    setReturnTime("10:00");
  };

  const cityLoading = Boolean(isLoading || isFetching || !data);

  React.useEffect(() => {
    if (!data || !Array.isArray(data)) return;
    if (!routeSlug) return;
    if (cityLocked && selectedCity) return;

    const found = data.find((b: any) => {
      const idStr = String(b?.id ?? "");
      const slug1 = normalizeSlugLike(String(b?.slug ?? ""));
      const slug2 = normalizeSlugLike(String(b?.city_slug ?? ""));
      const slug3 = normalizeSlugLike(String(b?.cityName ?? ""));
      const slug4 = normalizeSlugLike(String(b?.name_en ?? ""));
      const titleLike = normalizeSlugLike(String(b?.title ?? ""));

      return (
        slug1 === routeSlug ||
        slug2 === routeSlug ||
        slug3 === routeSlug ||
        slug4 === routeSlug ||
        titleLike === routeSlug ||
        normalizeSlugLike(idStr) === routeSlug
      );
    });

    if (found?.id != null) {
      setSelectedCity(String(found.id));
      setCityLocked(true);
    }
  }, [data, routeSlug, cityLocked, selectedCity]);

  const handleSearch = () => {
    const branchId = selectedCity;
    const from = jalaliQueryDate(selectedRange.start);
    const to = jalaliQueryDate(selectedRange.end);

    const dt = safeTime(deliveryTime);
    const rt = safeTime(returnTime);

    if (!branchId || !from || !to) return;

    router.push(
      {
        pathname: "/search",
        query: {
          branch_id: branchId,
          from,
          to,
          dt,
          rt,
        },
      },
      { locale },
    );
  };

  const searchDisabled =
    cityLoading ||
    !selectedCity ||
    !selectedRange?.start ||
    !selectedRange?.end ||
    !(selectedRange.start instanceof Date) ||
    !(selectedRange.end instanceof Date);

  return (
    <section className="w-full">
      <div className="relative w-full h-64 md:h-40">
        <div className="absolute inset-0 flex items-start justify-center pt-10 md:bg-amber-800 md:pt-0 md:items-center">
          <div className="w-full max-w-6xl absolute top-4 md:top-8 px-2 md:px-4 text-center z-10">
            <div className="flex flex-col gap-3">
              <p className="text-md md:text-2xl md:text-white font-bold">
                {title ?? t("defaultTitle")}
              </p>

              <p className="text-muted-foreground md:text-white font-light text-sm ">
                {subtitle1 ?? t("defaultSubtitle1")}
              </p>

              {subtitle2 ? (
                <p className="text-muted-foreground md:text-white  text-sm">
                  {subtitle2}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* ✅ MOBILE (فقط این بخش تغییر کرده) */}
        <div className="absolute inset-x-0 bottom-3 px-4 z-10 md:hidden">
          <div className="grid grid-cols-1 gap-3">
            {/* city */}
            <div className="relative">
              <Select
                value={selectedCity}
                onValueChange={(value) => {
                  if (cityLocked) return;
                  setSelectedCity(value);
                }}
                disabled={cityLoading || cityLocked}
              >
                <SelectTrigger
                  className="
                    w-full h-10!
                    border-gray-400 md:border-input
                    relative pr-9
                  "
                >
                  <MapPin
                    className="
                      w-4 h-4 text-muted-foreground
                      absolute right-3 top-1/2 -translate-y-1/2
                      pointer-events-none
                    "
                  />
                  <SelectValue
                    placeholder={
                      cityLoading
                        ? t("loadingCities")
                        : cityLocked
                          ? t("cityLocked")
                          : t("placeholders.city")
                    }
                  />
                </SelectTrigger>

                <SelectContent position="popper" className="z-[9999]">
                  {cityLoading ? (
                    <div className="py-3 px-3 flex items-center justify-center">
                      <Spinner />
                    </div>
                  ) : (
                    data?.map((item: any, key: number) => (
                      <SelectItem
                        key={key}
                        value={String(item?.id ?? "")}
                        disabled={cityLocked}
                      >
                        {String(item?.title ?? "")}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

      {/* ✅ کپسول تاریخ موبایل (Fix label overlap) */}
{/* ✅ MOBILE DATE (labels sit ON border line, not outside) */}
<div className="relative w-full pt-2">
  {/* ✅ labels (exactly on top border) */}
  <span className="pointer-events-none absolute right-4 top-2 -translate-y-1/2 z-20 bg-white dark:bg-gray-900 px-2 text-xs text-gray-500">
    {t("fields.delivery")}
  </span>

  <span className="pointer-events-none absolute left-14 top-2 -translate-y-1/2 z-20 bg-white dark:bg-gray-900 px-2 text-xs text-gray-500">
    {t("fields.return")}
  </span>

  {/* ✅ border container */}
  <div className="w-full rounded-md border border-gray-400 bg-white dark:bg-gray-900">
    {/* ✅ inner clip only */}
    <div className="grid grid-cols-2 w-full overflow-hidden rounded-md">
      {/* delivery */}
      <div className="h-10 flex items-center">
        <DateRangePickerPopover
          initialRange={selectedRange}
          initialTimes={{ deliveryTime, returnTime }}
          onConfirm={handleConfirm}
          onClear={handleClear}
          trigger={
            <div className="cursor-pointer w-full">
              <DateTimeTrigger
                monthNames={monthNames}
                date={selectedRange.start}
                time={selectedRange.start ? deliveryTime : undefined}
                datePlaceholder={t("placeholders.deliveryDate")}
                timePlaceholder={t("placeholders.deliveryTime")}
                variant="mobilePill"
              />
            </div>
          }
        />
      </div>

      {/* return */}
      <div className="h-10 flex items-center border-r border-gray-400">
        <DateRangePickerPopover
          initialRange={selectedRange}
          initialTimes={{ deliveryTime, returnTime }}
          onConfirm={handleConfirm}
          onClear={handleClear}
          trigger={
            <div className="cursor-pointer w-full">
              <DateTimeTrigger
                monthNames={monthNames}
                date={selectedRange.end}
                time={selectedRange.end ? returnTime : undefined}
                datePlaceholder={t("placeholders.returnDate")}
                timePlaceholder={t("placeholders.returnTime")}
                variant="mobilePill"
              />
            </div>
          }
        />
      </div>
    </div>
  </div>
</div>
            <Button
              className="w-full h-10"
              onClick={handleSearch}
              disabled={searchDisabled}
            >
              <div className="flex items-center justify-center gap-2 px-3">
                <Search className="size-4.5" />
                {t("actions.search")}
              </div>
            </Button>
          </div>
        </div>

        {/* ✅ DESKTOP (بدون تغییر) */}
        <div className="hidden md:block absolute w-full left-0 -bottom-14 z-10">
          <div className="flex justify-center px-4">
            <div className="bg-white dark:bg-gray-900 shadow rounded-md p-4 max-w-6xl w-full">
              <div className="grid grid-cols-4 gap-3 items-end">
                <div className="space-y-2">
                  <Label>{t("fields.city")}</Label>

                  <Select
                    value={selectedCity}
                    onValueChange={(value) => {
                      if (cityLocked) return;
                      setSelectedCity(value);
                    }}
                    disabled={cityLoading || cityLocked}
                  >
                    <SelectTrigger className="w-full h-10!">
                      <SelectValue
                        placeholder={
                          cityLoading
                            ? t("loadingCities")
                            : cityLocked
                              ? t("cityLocked")
                              : t("placeholders.city")
                        }
                      />
                    </SelectTrigger>

                    <SelectContent className="w-fit">
                      {cityLoading ? (
                        <div className="py-3 px-3 flex items-center justify-center">
                          <Spinner />
                        </div>
                      ) : (
                        data?.map((item: any, key: number) => (
                          <SelectItem
                            key={key}
                            value={String(item?.id ?? "")}
                            disabled={cityLocked}
                          >
                            {String(item?.title ?? "")}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("fields.delivery")}</Label>
                  <DateRangePickerPopover
                    initialRange={selectedRange}
                    initialTimes={{ deliveryTime, returnTime }}
                    onConfirm={handleConfirm}
                    onClear={handleClear}
                    trigger={
                      <div className="cursor-pointer">
                        <DateTimeTrigger
                          monthNames={monthNames}
                          date={selectedRange.start}
                          time={selectedRange.start ? deliveryTime : undefined}
                          datePlaceholder={t("placeholders.deliveryDate")}
                          timePlaceholder={t("placeholders.deliveryTime")}
                        />
                      </div>
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("fields.return")}</Label>
                  <DateRangePickerPopover
                    initialRange={selectedRange}
                    initialTimes={{ deliveryTime, returnTime }}
                    onConfirm={handleConfirm}
                    onClear={handleClear}
                    trigger={
                      <div className="cursor-pointer">
                        <DateTimeTrigger
                          monthNames={monthNames}
                          date={selectedRange.end}
                          time={selectedRange.end ? returnTime : undefined}
                          datePlaceholder={t("placeholders.returnDate")}
                          timePlaceholder={t("placeholders.returnTime")}
                        />
                      </div>
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="opacity-0 select-none">
                    {t("actions.search")}
                  </Label>
                  <Button
                    className="w-full h-10"
                    onClick={handleSearch}
                    disabled={searchDisabled}
                  >
                    <div className="flex items-center justify-center gap-2 px-3">
                      <Search className="size-4.5" />
                      {t("actions.search")}
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block h-20" />
    </section>
  );
};

export default NavSection;
