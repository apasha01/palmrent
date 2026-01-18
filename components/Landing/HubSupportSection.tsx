"use client";

import Image from "next/image";

const HubSupportSection = () => {
  return (
    <div className="w-full px-2 md:px-0 mt-8">
      {/* ✅ Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 items-start">
        {/* Item 1 */}
        <div className="flex flex-row md:flex-row items-center md:items-start gap-4 text-right md:text-right">
          <div className="shrink-0">
            <div className="w-16 h-16 rounded-full border flex items-center justify-center bg-white">
              <Image
                src="/images/dubai-mosque.jpg"
                alt="پرداخت متنوع و انعطاف‌پذیر"
                width={34}
                height={34}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <p className="font-bold">پرداخت متنوع و انعطاف‌پذیر</p>
            <p className="text-sm text-muted-foreground mt-2 leading-6">
              امکان پرداخت ریالی و سایر روش‌های پرداخت،
              <br className="hidden md:block" />
              متناسب با شهر و خودرو.
            </p>
          </div>
        </div>

        {/* Item 2 */}
        <div className="flex flex-row md:flex-row items-center md:items-start gap-4 text-right md:text-right">
          <div className="shrink-0">
            <div className="w-16 h-16 rounded-full border flex items-center justify-center bg-white">
              <Image
                src="/images/dubai-mosque.jpg"
                alt="پشتیبانی ۲۴ ساعته، ۷ روز هفته"
                width={34}
                height={34}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <p className="font-bold">پشتیبانی ۲۴ ساعته، ۷ روز هفته</p>
            <p className="text-sm text-muted-foreground mt-2 leading-6">
              از انتخاب تا تحویل و عودت، پاسخگو هستیم و
              <br className="hidden md:block" />
              مسیر رزرو را همراهی می‌کنیم.
            </p>
          </div>
        </div>

        {/* Item 3 */}
        <div className="flex flex-row md:flex-row items-center md:items-start gap-4 text-right md:text-right">
          <div className="shrink-0">
            <div className="w-16 h-16 rounded-full border flex items-center justify-center bg-white">
              <Image
                src="/images/dubai-mosque.jpg"
                alt="رزرو شفاف و قابل پیگیری"
                width={34}
                height={34}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <p className="font-bold">رزرو شفاف و قابل پیگیری</p>
            <p className="text-sm text-muted-foreground mt-2 leading-6">
              قبل از ثبت نهایی، جزئیات رزرو و شرایط
              <br className="hidden md:block" />
              به‌صورت واضح نمایش داده می‌شود.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default HubSupportSection;
