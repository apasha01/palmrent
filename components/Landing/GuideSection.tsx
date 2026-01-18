"use client";

import Image from "next/image";

export default function GuidesSection() {
  return (
    <>
      <h1 className="text-2xl font-bold text-foreground mb-4">
        راهنماها و مقالات
      </h1>

      {/* ✅ Desktop همون گرید | ✅ موبایل اسکرول افقی بدون تغییر استایل کارت‌ها */}
      <div
        className="
          flex gap-6 overflow-x-auto pb-2
          [scrollbar-width:none] [-ms-overflow-style:none]
          [&::-webkit-scrollbar]:hidden
          md:grid md:grid-cols-2 lg:grid-cols-3
          md:overflow-visible
        "
      >
        {/* Card 1 */}
        <article className="flex flex-col cursor-pointer group border rounded-lg shrink-0 w-[320px] md:w-auto">
          <div className="rounded-lg overflow-hidden">
            <Image
              src="/images/dubai-skyline.jpg"
              alt="برای سفر به دبی چقدر پول ببریم؟"
              width={400}
              height={240}
              className="w-full h-48 object-cover"
            />
          </div>
          <div className="pt-4 p-2">
            <h3 className="text-foreground font-bold text-base mb-3 leading-relaxed">
              برای سفر به دبی چقدر پول ببریم؟
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4">
              اگر قصد دارید در سال ۲۰۲۵ به دبی سفر کنید، اولین پرسشی که ذهن بیشتر
              مسافران را درگیر میکند این است که برای این سفر چقدر بودجه لازم
              داریم؟ پاسخ کوتاه و صادقانه این است که میزان هزینه سفر شما به س
            </p>
          </div>
        </article>

        {/* Card 2 */}
        <article className="flex flex-col cursor-pointer group border rounded-lg shrink-0 w-[320px] md:w-auto">
          <div className="rounded-lg overflow-hidden">
            <Image
              src="/images/travel-app.jpg"
              alt="بهترین اپلیکیشن تورهای مسافرتی"
              width={400}
              height={240}
              className="w-full h-48 object-cover"
            />
          </div>
          <div className="pt-4 p-2">
            <h3 className="text-foreground font-bold text-base mb-3 leading-relaxed">
              بهترین اپلیکیشن تورهای مسافرتی برای سفرهای آسان و به صرفه
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4">
              استفاده از اپلیکیشنهای تور مسافرتی به یکی از ضروریترین ابزارها برای
              برنامه‌ریزی سفرهای مدرن تبدیل شده است. این همد نیست. این اپلیکیشنها مزایای زیادی نسبت به روشهای سنتی رزرو تور ارائه م
            </p>
          </div>
        </article>

        {/* Card 3 */}
        <article className="flex flex-col cursor-pointer group border rounded-lg shrink-0 w-[320px] md:w-auto">
          <div className="rounded-lg overflow-hidden">
            <Image
              src="/images/dubai-mosque.jpg"
              alt="بهترین تفریحات دبی چیست؟"
              width={400}
              height={240}
              className="w-full h-48 object-cover"
            />
          </div>
          <div className="pt-4 p-2">
            <h3 className="text-foreground font-bold text-base mb-3 leading-relaxed">
              بهترین تفریحات دبی چیست؟
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4">
              دبی، یکی از محبوبترین مقاصد گردشگری جهان، هر ساله میلیونها مسافر را
              با ترکیبی از تجمل، ماجراجویی و فرهنگ به خود جذب میکند. این شهر مدرن
              در قلب خلیج فارس، با آسمانخراش
            </p>
          </div>
        </article>
      </div>
    </>
  );
}
