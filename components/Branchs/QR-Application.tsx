"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "../ui/button";
import { Link } from "@/i18n/navigation";
import useDIR from "@/hooks/use-rtl";

const QRApplication = () => {
  const t = useTranslations("QRApplication");
  const { direction } = useDIR();

  const ArrowIcon = direction ? ChevronLeft : ChevronRight;
  // const ArrowIcon = direction ? ChevronRight : ChevronLeft  ;

  return (
    <div className="">
      <div className="bg-white dark:bg-gray-900 rounded-2xl md:px-0 border shadow-sm dark:shadow-none">
        <div className="flex justify-between items-center px-2 md:px-12">
          <div className="flex items-center justify-between gap-3 p-2 md:p-4 md:px-12 w-full">
            {/* QR فقط دسکتاپ */}
            <div className="hidden md:flex border dark:border-gray-800 flex-col p-2 gap-4 items-center rounded-2xl bg-white dark:bg-gray-900">
              <Image
                width={130}
                height={130}
                alt={t("qrAlt")}
                src="/images/barcode.png"
              />
              <p className="font-bold text-xs text-gray-900 dark:text-gray-100">
                {t("scanText")}
              </p>
            </div>

            {/* متن‌ها */}
            <div className="flex items-start justify-between py-1 md:py-2 gap-3 md:gap-4 flex-col flex-1">
              <div className="flex flex-col">
                <p className="font-bold text-base md:text-lg text-gray-900 dark:text-gray-100">
                  {t("title")}
                </p>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                  {t("subtitle")}
                </p>
              </div>

              {/* Mobile */}
              <Link href="/app">
                <Button
                  variant="default"
                  type="button"
                  className="rounded-full md:hidden"
                >
                  {t("downloadLinks")}
                </Button>
              </Link>

              {/* Desktop */}
              <Link href="/app">
                <Button
                  variant="link"
                  className="p-0 m-0 hidden md:inline-flex dark:text-blue-400"
                >
                  {t("downloadLinks")} <ArrowIcon />
                </Button>
              </Link>

              <div className="flex gap-2 items-end">
                <Image
                  alt={t("androidAlt")}
                  src="/images/android-logo.png"
                  width={22}
                  height={22}
                />
                <Image
                  alt={t("iosAlt")}
                  src="/images/ios-logo.png"
                  width={22}
                  height={22}
                />
                <span className="text-[10px] text-muted-foreground dark:text-gray-400">
                  {t("platforms")}
                </span>
              </div>
            </div>

            {/* عکس اپلیکیشن */}
            <div className="relative shrink-0 w-28 h-40 sm:w-32 sm:h-44 md:w-60 md:h-72">
              <Image
                alt={t("appImageAlt")}
                src="/images/app.webp"
                fill
                className="w-full h-full object-contain"
                sizes="(max-width: 640px) 112px, (max-width: 768px) 128px, 240px"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRApplication;