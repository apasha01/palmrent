import Image from "next/image";
import { Button } from "../ui/button";
import { ChevronLeft } from "lucide-react";

const QRApplication = () => {
  return (
    <div className="px-2">
      <div className="bg-white dark:bg-gray-900 rounded-2xl md:px-0 shadow-sm dark:shadow-none">
        {/* ✅ موبایل px-2 | md به بالا مثل قبل */}
        <div className="flex justify-between items-center px-2 md:px-12">
          <div className="flex items-center justify-between gap-3 p-2 md:p-4 md:px-12 w-full">
            {/* ✅ QR فقط دسکتاپ */}
            <div className="hidden md:flex border dark:border-gray-800 flex-col p-2 gap-4 items-center rounded-2xl bg-white dark:bg-gray-900">
              <Image
                width={130}
                height={130}
                alt="QR code picture"
                src="/images/barcode.png"
              />
              <p className="font-bold text-xs text-gray-900 dark:text-gray-100">
                برای دانلود اسکن کنید !
              </p>
            </div>

            {/* متن‌ها */}
            <div className="flex items-start justify-between py-1 md:py-2 gap-3 md:gap-4 flex-col flex-1">
              <div className="flex flex-col">
                <p className="font-bold text-base md:text-lg text-gray-900 dark:text-gray-100">
                  اپلیکیشن پالم رنت
                </p>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                  اجاره خودرو آنلاین سریعتر و مطمن تر
                </p>
              </div>

              {/* ✅ موبایل: primary + rounded-full | md+: لینک بدون تغییر */}
              {/* Mobile: primary */}
              <Button variant="default" className="rounded-full md:hidden">
                مشاهده لینک های دانلود
              </Button>

              {/* Desktop: link */}
              <Button
                variant="link"
                className="p-0 m-0 hidden md:inline-flex dark:text-blue-400"
              >
                مشاهده لینک های دانلود <ChevronLeft />
              </Button>

              <div className="flex gap-2 items-end">
                <Image
                  alt="android"
                  src="/images/android-logo.png"
                  width={26}
                  height={26}
                />
                <Image
                  alt="ios"
                  src="/images/ios-logo.png"
                  width={26}
                  height={26}
                />
                <span className="text-xs text-muted-foreground dark:text-gray-400">
                  قابل نصب روی Android و IOS
                </span>
              </div>
            </div>

            {/* عکس اپلیکیشن */}
            <div className="relative shrink-0 w-28 h-40 sm:w-32 sm:h-44 md:w-60 md:h-72">
              <Image
                alt="application picture"
                src="/images/application-d.png"
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
