/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Label } from "../ui/label";
import { CalendarRange, Clock, Search } from "lucide-react";
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
import { useLocale } from "next-intl";
import { formatJalaliDate } from "@/lib/date-utils";
import { Spinner } from "../ui/spinner";

function toPersianDigits(input: string) {
  const en = "0123456789";
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  return input.replace(/[0-9]/g, (d) => fa[en.indexOf(d)]);
}

function toEnglishDigits(input: string) {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  const en = "0123456789";

  return input.replace(/[۰-۹٠-٩]/g, (d) => {
    const iFa = fa.indexOf(d);
    if (iFa !== -1) return en[iFa];
    const iAr = ar.indexOf(d);
    if (iAr !== -1) return en[iAr];
    return d;
  });
}

function formatJalaliShort(date: Date | null) {
  if (!date) return "---";

  const jalaliStr = toEnglishDigits(formatJalaliDate(date));
  const parts = jalaliStr.split("/");
  if (parts.length !== 3) return "---";

  const [, mStr, dStr] = parts;
  const m = Number(mStr);
  const d = Number(dStr);

  if (!Number.isFinite(m) || !Number.isFinite(d) || m < 1 || m > 12)
    return "---";

  const monthNames = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
  ];

  return `${toPersianDigits(String(d))} ${monthNames[m - 1]}`;
}

/** ✅ Trigger عمومی: اول تاریخ بعد ساعت */
function DateTimeTrigger({
  date,
  time,
  datePlaceholder,
  timePlaceholder,
}: {
  date?: Date | null;
  time?: string;
  datePlaceholder: string;
  timePlaceholder: string;
}) {
  const hasDate = date instanceof Date && !isNaN(date.getTime());

  return (
    <div className="flex items-center border h-10 rounded-md w-full overflow-hidden bg-transparent">
      {/* تاریخ */}
      <div className="flex items-center px-2 gap-1.5 w-1/2">
        <CalendarRange className="text-gray-500 shrink-0" size={18} />
        {hasDate ? (
          <p className="truncate text-sm text-gray-900 dark:text-gray-100 font-medium">
            {formatJalaliShort(date!)}
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

/** ✅ فردا تا ۵ روز بعد (جمعاً ۶ روز بازه) + ساعت ۱۰:۰۰ */
function makeDefaultRange(): Range {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + 1); // فردا

  const end = new Date(start);
  end.setDate(end.getDate() + 5); // ۵ روز بعد

  return { start, end };
}

const NavSection = ({ image, title, subtitle1, subtitle2 }: any) => {
  useDIR();

  const router = useRouter();
  const locale = useLocale();
  const params = useParams() as any;

  const branchSlugFromRoute =
    params?.cityName ?? params?.slug ?? params?.branch ?? params?.city ?? "";
  const routeSlug = normalizeSlugLike(String(branchSlugFromRoute || ""));

  const { data, isLoading, isFetching } = useBranches(locale) as any;

  const [selectedCity, setSelectedCity] = React.useState<string>("");
  const [cityLocked, setCityLocked] = React.useState(false);

  // ✅ دیفالت: فردا تا ۵ روز بعد
  const [selectedRange, setSelectedRange] = React.useState<Range>(() =>
    makeDefaultRange(),
  );

  // ✅ دیفالت ساعت‌ها: ۱۰:۰۰
  const [deliveryTime, setDeliveryTime] = React.useState<string>("10:00");
  const [returnTime, setReturnTime] = React.useState<string>("10:00");

  const handleConfirm = (payload: {
    start: Date;
    end: Date;
    deliveryTime: string;
    returnTime: string;
  }) => {
    setSelectedRange({ start: payload.start, end: payload.end });
    setDeliveryTime(payload.deliveryTime);
    setReturnTime(payload.returnTime);
  };

  const handleClear = () => {
    // ✅ اگر کاربر Clear زد، دوباره دیفالت رو برگردون
    setSelectedRange(makeDefaultRange());
    setDeliveryTime("10:00");
    setReturnTime("10:00");
  };

  const handleSearch = () => {
    const branchId = selectedCity;
    const from = jalaliQueryDate(selectedRange.start);
    const to = jalaliQueryDate(selectedRange.end);

    const qs = new URLSearchParams();
    if (branchId) qs.set("branch_id", branchId);
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);

    router.push(`/search?${qs.toString()}`);
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

  return (
    <section className="w-full">
      <div className="relative w-full h-80 md:h-80 lg:h-96">
        <Image
          alt="headpicture"
          src={image || "/placeholder.svg"}
          fill
          priority
          className="object-cover rounded-b-lg md:rounded-none"
        />

        <div className="absolute inset-0 flex items-start justify-center pt-10 md:pt-0 md:items-center">
          <div className="w-full max-w-6xl px-4 text-center z-10">
            <div className="flex flex-col gap-2">
              <p className="text-xl md:text-2xl text-white font-bold">{title}</p>
              <p className="text-muted-foreground font-light text-sm mt-2">
                {subtitle1}
              </p>
              <p className="text-muted-foreground font-light text-sm">
                {subtitle2}
              </p>
            </div>
          </div>
        </div>

        {/* ✅ موبایل */}
        <div className="absolute inset-x-0 bottom-3 px-4 z-10 md:hidden">
          <div className="grid grid-cols-1 gap-3">
            <div className="relative">
              <MobileFloatLabel text="شهر" />

              <Select
                value={selectedCity}
                onValueChange={(value) => {
                  if (cityLocked) return;
                  setSelectedCity(value);
                }}
                disabled={cityLoading || cityLocked}
              >
                <SelectTrigger className="w-full h-10 bg-white border-6 border-white p-1 dark:bg-gray-900 dark:border-gray-900">
                  <SelectValue
                    placeholder={
                      cityLoading
                        ? "در حال بارگذاری..."
                        : cityLocked
                        ? "شهر انتخاب شده"
                        : ""
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {cityLoading ? (
                    <div className="py-3 px-3 flex items-center justify-center">
                      <Spinner />
                    </div>
                  ) : (
                    data?.map((items: any, key: number) => (
                      <SelectItem
                        key={key}
                        value={String(items.id ?? "1")}
                        disabled={cityLocked}
                      >
                        {items.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full">
              {/* تحویل */}
              <div className="relative w-full">
                <MobileFloatLabel text="تاریخ و زمان تحویل" />
                <DateRangePickerPopover
                  initialRange={selectedRange}
                  initialTimes={{ deliveryTime, returnTime }}
                  onConfirm={handleConfirm}
                  onClear={handleClear}
                  trigger={
                    <div className="bg-white rounded-md w-full dark:bg-gray-900 cursor-pointer">
                      <DateTimeTrigger
                        date={selectedRange.start}
                        time={selectedRange.start ? deliveryTime : undefined}
                        datePlaceholder="تاریخ تحویل"
                        timePlaceholder="ساعت تحویل"
                      />
                    </div>
                  }
                />
              </div>

              {/* عودت */}
              <div className="relative w-full">
                <MobileFloatLabel text="تاریخ و زمان عودت" />
                <DateRangePickerPopover
                  initialRange={selectedRange}
                  initialTimes={{ deliveryTime, returnTime }}
                  onConfirm={handleConfirm}
                  onClear={handleClear}
                  trigger={
                    <div className="bg-white rounded-md w-full dark:bg-gray-900 cursor-pointer">
                      <DateTimeTrigger
                        date={selectedRange.end}
                        time={selectedRange.end ? returnTime : undefined}
                        datePlaceholder="تاریخ عودت"
                        timePlaceholder="ساعت عودت"
                      />
                    </div>
                  }
                />
              </div>
            </div>

            <Button
              className="w-full h-10"
              onClick={handleSearch}
              disabled={cityLoading || !selectedCity}
            >
              <div className="flex items-center justify-center gap-2 px-3">
                <Search className="size-4.5" />
                جستجوی خودروها
              </div>
            </Button>
          </div>
        </div>

        {/* ✅ دسکتاپ */}
        <div className="hidden md:block absolute w-full left-0 -bottom-14 z-10">
          <div className="flex justify-center px-4">
            <div className="bg-white dark:bg-gray-900 shadow rounded-md p-4 max-w-6xl w-full">
              <div className="grid grid-cols-4 gap-3 items-end">
                <div className="space-y-2">
                  <Label>شهر</Label>

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
                            ? "در حال بارگذاری..."
                            : cityLocked
                            ? "شهر انتخاب شده"
                            : "شهر را انتخاب کنید"
                        }
                      />
                    </SelectTrigger>

                    <SelectContent className="w-fit">
                      {cityLoading ? (
                        <div className="py-3 px-3 flex items-center justify-center">
                          <Spinner />
                        </div>
                      ) : (
                        data?.map((items: any, key: number) => (
                          <SelectItem
                            key={key}
                            value={String(items.id ?? "1")}
                            disabled={cityLocked}
                          >
                            {items.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>تاریخ و زمان تحویل</Label>
                  <DateRangePickerPopover
                    initialRange={selectedRange}
                    initialTimes={{ deliveryTime, returnTime }}
                    onConfirm={handleConfirm}
                    onClear={handleClear}
                    trigger={
                      <div className="cursor-pointer">
                        <DateTimeTrigger
                          date={selectedRange.start}
                          time={selectedRange.start ? deliveryTime : undefined}
                          datePlaceholder="تاریخ تحویل"
                          timePlaceholder="ساعت تحویل"
                        />
                      </div>
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>تاریخ و زمان عودت</Label>
                  <DateRangePickerPopover
                    initialRange={selectedRange}
                    initialTimes={{ deliveryTime, returnTime }}
                    onConfirm={handleConfirm}
                    onClear={handleClear}
                    trigger={
                      <div className="cursor-pointer">
                        <DateTimeTrigger
                          date={selectedRange.end}
                          time={selectedRange.end ? returnTime : undefined}
                          datePlaceholder="تاریخ عودت"
                          timePlaceholder="ساعت عودت"
                        />
                      </div>
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="opacity-0 select-none">جستجو</Label>
                  <Button
                    className="w-full h-10"
                    onClick={handleSearch}
                    disabled={cityLoading || !selectedCity}
                  >
                    <div className="flex items-center justify-center gap-2 px-3">
                      <Search className="size-4.5" />
                      جستجوی خودروها
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
