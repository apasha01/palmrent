import Image from "next/image";
import React from "react";

const WhyUs = () => {
  return (
    <div className="px-2 md:px-0">
      <div className="flex flex-col">
        <p className="font-lg px-2 font-bold">چرا اجاره خودرو در دبی با پالم رنت ؟</p>
        <p className="px-2">
          پالم رنت تجربه اجاره خودرو در دبی را قابل اعتماد, شفاف و بدون پیچیدگی
          ارایه میکند . از مرحله رزرو تا تحویل همه چیز طوری طراحی شده که بدون
          دردسر و بدون هزینه پنهان انجام شود
        </p>

        {/* ✅ Responsive grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 px-2">
          {/* Item 1 */}
          <div className="flex flex-row md:flex-col gap-3 md:gap-2 items-start">
            <Image
              alt="why-us"
              width={48}
              height={48}
              src="/images/brands/benzz.png"
              className="shrink-0 md:mx-auto"
            />

            <div className="flex flex-col gap-2 text-right">
              <p className="font-bold">بدون دپوزیت بدون کارت اعتباری پرداخت امن</p>
              <p className="text-xs text-muted-foreground">
                اجاره در خودرو در دبی بدون بلوکه شدن پول انجام میشود و پرداخت در
                هنگام تحویل است پالم رند دارای اینماد جواب کسب و درگاه امن زرین
                پال است . یعنی رزرو شما در بستری امن و مطمن انجام میشود .
              </p>
            </div>
          </div>

          {/* Item 2 */}
          <div className="flex flex-row md:flex-col gap-3 md:gap-2 items-start">
            <Image
              alt="why-us"
              width={48}
              height={48}
              src="/images/brands/benzz.png"
              className="shrink-0 md:mx-auto"
            />

            <div className="flex flex-col gap-2 text-right">
              <p className="font-bold">بدون دپوزیت بدون کارت اعتباری پرداخت امن</p>
              <p className="text-xs text-muted-foreground">
                اجاره در خودرو در دبی بدون بلوکه شدن پول انجام میشود و پرداخت در
                هنگام تحویل است پالم رند دارای اینماد جواب کسب و درگاه امن زرین
                پال است . یعنی رزرو شما در بستری امن و مطمن انجام میشود .
              </p>
            </div>
          </div>

          {/* Item 3 */}
          <div className="flex flex-row md:flex-col gap-3 md:gap-2 items-start">
            <Image
              alt="why-us"
              width={48}
              height={48}
              src="/images/brands/benzz.png"
              className="shrink-0 md:mx-auto"
            />

            <div className="flex flex-col gap-2 text-right">
              <p className="font-bold">بدون دپوزیت بدون کارت اعتباری پرداخت امن</p>
              <p className="text-xs text-muted-foreground">
                اجاره در خودرو در دبی بدون بلوکه شدن پول انجام میشود و پرداخت در
                هنگام تحویل است پالم رند دارای اینماد جواب کسب و درگاه امن زرین
                پال است . یعنی رزرو شما در بستری امن و مطمن انجام میشود .
              </p>
            </div>
          </div>
        </div>
        {/* /grid */}
      </div>
    </div>
  );
};

export default WhyUs;
