/* eslint-disable react-hooks/refs */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";

// ===========================
// ✅ SINGLE SOURCE OF TRUTH: Styles
// ===========================
const UI = {
  content: "max-h-[85vh]",
  wrap: "mx-auto w-full max-w-lg md:max-w-2xl lg:max-w-3xl",
  header: "px-5 pt-4 pb-2",
  title: "truncate text-right text-base font-extrabold text-gray-900",
  iconWrap:
    "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600",
  body: "px-5 pb-4",
  bodyText: "whitespace-pre-line text-right text-sm leading-7 text-gray-700",
  hint: "text-xs text-gray-500 leading-6",

  priceCard: "rounded-2xl border border-gray-200 bg-white p-3 shadow-sm",
  priceTitle: "text-sm font-extrabold text-gray-900",
  priceSub: "mt-1 text-xs text-gray-500",
  priceFinal: "text-sm font-extrabold text-gray-900",
  priceUnit: "text-xs font-normal text-gray-500",
  priceOld: "mt-1 text-xs text-gray-400 line-through",
} as const;

// ===========================
// ✅ SINGLE SOURCE OF TRUTH: Copies
// ===========================
const COPY = {
  prices: {
    title: "گروه‌های قیمتی",
    desc: "قیمت‌ها به‌ازای هر روز محاسبه شده‌اند و با توجه به تعداد روزهای اجاره تغییر می‌کنند.",
    empty: "قیمت‌ها موجود نیست.",
    subOff: "قیمت پایه و قیمت بعد از تخفیف",
    subNormal: "قیمت روزانه",
  },

  noDeposit: {
    title: "بدون ودیعه",
    desc:
      `برای این خودرو در اطلاعات فعلی، ودیعه ضمانت/ودیعه خلافی دریافت نمی‌شود.\n\n` +
      `• در زمان تحویل خودرو مبلغی بابت ودیعه از شما دریافت نخواهد شد.\n` +
      `• با این حال، جریمه‌ها، خسارت‌ها یا هزینه‌های خارج از قرارداد همچنان طبق قوانین مجموعه برعهده اجاره‌کننده است.\n` +
      `• برای جزئیات دقیق شرایط قرارداد، پیش از نهایی‌کردن رزرو می‌توانید با پشتیبانی هماهنگ کنید.`,
  },

  deposit: (args: { amountText: string; currency: string }) => ({
    title: "ودیعه خلافی",
    desc:
      `ودیعه خلافی مبلغی است که برای پوشش جریمه‌ها/خلافی‌های احتمالی در زمان اجاره دریافت می‌شود.\n\n` +
      `• مبلغ: ${args.amountText} ${args.currency}\n` +
      `• معمولاً پس از تسویه خلافی‌ها و بررسی وضعیت، برگشت داده می‌شود.\n` +
      `• زمان برگشت و نحوه تسویه بسته به قوانین مجموعه/شعبه ممکن است متفاوت باشد.`,
  }),

  delivery: (free: boolean) => ({
    title: "تحویل خودرو",
    desc: free
      ? `تحویل برای این خودرو رایگان است.\n\n• تحویل و عودت طبق هماهنگی با شعبه انجام می‌شود.\n• در برخی لوکیشن‌های خاص یا ساعات غیرمعمول ممکن است هماهنگی جداگانه لازم باشد.\n• پیش از ثبت نهایی رزرو، جزئیات دقیق محل و زمان تحویل را می‌توانید از پشتیبانی بگیرید.`
      : `تحویل برای این خودرو رایگان نیست.\n\n• هزینه تحویل و عودت بسته به محل، زمان و شرایط شعبه ممکن است متفاوت باشد.\n• قبل از نهایی‌کردن رزرو، می‌توانید مبلغ دقیق تحویل را از پشتیبانی استعلام بگیرید.`,
  }),

  insurance: (has: boolean) => ({
    title: "بیمه خودرو",
    desc: has
      ? `برای این خودرو بیمه پایه رایگان در نظر گرفته شده است.\n\n• بیمه پایه حداقل پوشش‌های معمول را شامل می‌شود.\n• در برخی شرایط، پوشش‌های تکمیلی با هزینه جداگانه قابل ارائه هستند.\n• برای اطلاع از سقف تعهدات و استثناهای بیمه، بهتر است قبل از رزرو جزئیات را بررسی کنید.`
      : `برای این خودرو در اطلاعات فعلی بیمه رایگان ثبت نشده است.\n\n• ممکن است بیمه پایه یا بیمه تکمیلی به‌صورت جداگانه ارائه شود.\n• برای اطلاع از شرایط دقیق بیمه، قبل از رزرو با پشتیبانی هماهنگ کنید.`,
  }),

  km: (unlimited: boolean) => ({
    title: "شرایط کیلومتر",
    desc: unlimited
      ? `این خودرو کیلومتر نامحدود دارد.\n\n• محدودیت روزانه کیلومتر برای این خودرو اعمال نمی‌شود.\n• استفاده متعارف و طبق قوانین مجموعه همچنان لازم است.\n• در صورت وجود شرایط خاص برای برخی مسیرها یا کاربری‌ها، جزئیات هنگام رزرو اعلام می‌شود.`
      : `این خودرو کیلومتر محدود دارد.\n\n• معمولاً سقف کیلومتر روزانه یا کل دوره برای آن در نظر گرفته می‌شود.\n• مبلغ اضافه‌کیلومتر طبق قوانین مجموعه محاسبه خواهد شد.\n• برای اطلاع از سقف دقیق کیلومتر، از پشتیبانی استعلام بگیرید.`,
  }),

  optionById: {
    2: `صندلی کودک
• مناسب کودکان خردسال
• نصب و تحویل هنگام دریافت خودرو انجام می‌شود
• مسئولیت انتخاب سایز و مدل مناسب کودک با مشتری است
• در صورت نیاز، قبل از رزرو با پشتیبانی هماهنگ کنید`,

    10: `راننده اضافی
• این گزینه اجازه می‌دهد فرد دیگری هم به‌عنوان راننده خودرو ثبت شود
• برای راننده اضافی ارائه مدارک شناسایی و گواهینامه معتبر لازم است
• مسئولیت استفاده از خودرو طبق قوانین قرارداد خواهد بود`,
  } as Record<number, string>,

  extraOption: {
    titleFallback: "جزئیات آپشن",
    descFallback:
      "برای این آپشن توضیحی ثبت نشده است. برای اطلاعات بیشتر می‌توانید قبل از رزرو با پشتیبانی هماهنگ کنید.",
  },

  insuranceComplete: {
    title: "بسته جامع خسارت",
    desc: "با انتخاب این گزینه، پوشش کامل‌تری برای خسارت‌ها و ریسک‌های احتمالی در طول اجاره فعال می‌شود.",
  },
} as const;

// ===========================
// types
// ===========================
type PriceRow = {
  days: string;
  originalPrice: any;
  finalPrice: any;
  hasOffPrice: boolean;
};

export type AppDrawerKind =
  | "prices"
  | "deposit"
  | "no_deposit"
  | "delivery"
  | "insurance"
  | "km"
  | "extra_option"
  | "insurance_complete";

export type AppDrawerData = {
  prices?: PriceRow[];
  currency?: string;
  pricesSubtitle?: string;

  deposit?: any;

  free_delivery?: any;
  insurance?: any;
  km?: any;

  optionId?: number;
  optionTitle?: string;
  optionDescriptionFromApi?: string;
};

// ===========================
// utils
// ===========================
function isYes(v: any) {
  const s = String(v ?? "").toLowerCase();
  return s === "yes" || s === "true" || s === "1";
}

function toEnDigits(input: string) {
  if (!input) return "";
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  let s = String(input);
  for (let i = 0; i < 10; i++) {
    s = s.replaceAll(fa[i], String(i)).replaceAll(ar[i], String(i));
  }
  return s.replace(/[\u200E\u200F\u202A-\u202E]/g, "").trim();
}

function toFaDigits(input: string) {
  const map: Record<string, string> = {
    "0": "۰",
    "1": "۱",
    "2": "۲",
    "3": "۳",
    "4": "۴",
    "5": "۵",
    "6": "۶",
    "7": "۷",
    "8": "۸",
    "9": "۹",
    ".": "٫",
    ",": "٬",
  };

  return String(input)
    .split("")
    .map((c) => (map[c] ? map[c] : c))
    .join("");
}

function moneyFa(value: any) {
  if (value === null || value === undefined) return "—";
  const str = String(value);
  const num = Number(toEnDigits(str));

  if (Number.isFinite(num)) {
    const fixed = num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
    return toFaDigits(fixed);
  }

  return toFaDigits(str);
}

export function AppDrawer({
  kind,
  data,
  trigger,
  onOpenChange,
}: {
  kind: AppDrawerKind;
  data?: AppDrawerData;
  trigger: (args: { open: () => void }) => React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const [stickyKind, setStickyKind] = React.useState<AppDrawerKind>(kind);
  const [stickyData, setStickyData] = React.useState<AppDrawerData | undefined>(
    data,
  );
  const closeTimerRef = React.useRef<any>(null);

  const openNow = React.useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setStickyKind(kind);
    setStickyData(data);
    setOpen(true);
    onOpenChange?.(true);
  }, [kind, data, onOpenChange]);

  const title = React.useMemo(() => {
    const d = stickyData;

    switch (stickyKind) {
      case "prices":
        return COPY.prices.title;

      case "deposit":
        return COPY.deposit({ amountText: "—", currency: "" }).title;

      case "no_deposit":
        return COPY.noDeposit.title;

      case "delivery":
        return COPY.delivery(true).title;

      case "insurance":
        return COPY.insurance(true).title;

      case "km":
        return COPY.km(true).title;

      case "insurance_complete":
        return COPY.insuranceComplete.title;

      case "extra_option":
        return d?.optionTitle || COPY.extraOption.titleFallback;
    }
  }, [stickyKind, stickyData]);

  const Body = React.useMemo(() => {
    const d = stickyData || {};

    if (stickyKind === "prices") {
      const list = Array.isArray(d.prices) ? d.prices : [];
      const currency = d.currency || "";

      return (
        <div className={UI.body + " text-right"}>
          <div className={UI.hint}>{d.pricesSubtitle || COPY.prices.desc}</div>

          <Separator className="my-3" />

          {list.length === 0 ? (
            <div className="py-6 text-sm text-gray-500">{COPY.prices.empty}</div>
          ) : (
            <div className="space-y-2">
              {list.map((p, idx) => (
                <div key={`${p.days}-${idx}`} className={UI.priceCard}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-right">
                      <div className={UI.priceTitle}>{p.days}</div>
                      <div className={UI.priceSub}>
                        {p.hasOffPrice
                          ? COPY.prices.subOff
                          : COPY.prices.subNormal}
                      </div>
                    </div>

                    <div className="whitespace-nowrap text-left">
                      <div className={UI.priceFinal}>
                        {moneyFa(p.finalPrice)}{" "}
                        <span className={UI.priceUnit}>{currency}</span>
                      </div>

                      {p.hasOffPrice ? (
                        <div className={UI.priceOld}>
                          {moneyFa(p.originalPrice)} {currency}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (stickyKind === "deposit") {
      const currency = d.currency || "";
      const txt = COPY.deposit({
        amountText: moneyFa(d.deposit),
        currency,
      }).desc;

      return (
        <div className={UI.body}>
          <p className={UI.bodyText}>{txt}</p>
        </div>
      );
    }

    if (stickyKind === "no_deposit") {
      return (
        <div className={UI.body}>
          <p className={UI.bodyText}>{COPY.noDeposit.desc}</p>
        </div>
      );
    }

    if (stickyKind === "delivery") {
      const txt = COPY.delivery(isYes(d.free_delivery)).desc;
      return (
        <div className={UI.body}>
          <p className={UI.bodyText}>{txt}</p>
        </div>
      );
    }

    if (stickyKind === "insurance") {
      const txt = COPY.insurance(isYes(d.insurance)).desc;
      return (
        <div className={UI.body}>
          <p className={UI.bodyText}>{txt}</p>
        </div>
      );
    }

    if (stickyKind === "km") {
      const txt = COPY.km(isYes(d.km)).desc;
      return (
        <div className={UI.body}>
          <p className={UI.bodyText}>{txt}</p>
        </div>
      );
    }

    if (stickyKind === "insurance_complete") {
      return (
        <div className={UI.body}>
          <p className={UI.bodyText}>{COPY.insuranceComplete.desc}</p>
        </div>
      );
    }

    const apiDesc = String(d.optionDescriptionFromApi ?? "").trim();
    if (apiDesc) {
      return (
        <div className={UI.body}>
          <p className={UI.bodyText}>{apiDesc}</p>
        </div>
      );
    }

    const id = Number(d.optionId);
    const dict = Number.isFinite(id) ? COPY.optionById[id] : "";
    const desc = String(dict ?? "").trim() || COPY.extraOption.descFallback;

    return (
      <div className={UI.body}>
        <p className={UI.bodyText}>{desc}</p>
      </div>
    );
  }, [stickyKind, stickyData]);

  return (
    <>
      {trigger({ open: openNow })}

      <Drawer
        open={open}
        onOpenChange={(v) => {
          onOpenChange?.(Boolean(v));

          if (v) {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
            setStickyKind(kind);
            setStickyData(data);
            setOpen(true);
            return;
          }

          setOpen(false);

          if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
          closeTimerRef.current = setTimeout(() => {
            closeTimerRef.current = null;
          }, 250);
        }}
      >
        <DrawerContent dir="rtl" className={UI.content}>
          <div className={UI.wrap}>
            <DrawerHeader className={UI.header}>
              <div className="flex min-w-0 items-center gap-2">
                <span className={UI.iconWrap}>
                  <Sparkles className="h-5 w-5" />
                </span>
                <DrawerTitle className={UI.title}>{title}</DrawerTitle>
              </div>
            </DrawerHeader>

            {Body}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}