"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

export default function RulesSheet() {
  const x = useTranslations("InformationStep")

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="text-blue-600 dark:text-blue-500 underline">
          {x("rules.rules2")}
        </button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="w-full h-[90vh] rounded-t-2xl flex flex-col p-0 overflow-hidden"
      >
        {/* HEADER */}
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="text-lg font-bold text-center">
            قوانین اجاره خودرو
          </SheetTitle>
        </SheetHeader>

        {/* SCROLLABLE CONTENT */}
        <ScrollArea className="flex-1 min-h-0 px-6 py-4 text-sm leading-7 text-gray-700 dark:text-gray-300">
          <p className="mb-6">
            با ثبت درخواست رزرو در پالم رنت، شما تمامی قوانین و شرایط زیر را
            مطالعه کرده و می‌پذیرید. هدف از این قوانین ایجاد تجربه‌ای امن،
            شفاف و قابل اعتماد برای اجاره خودرو است.
          </p>

          <h3 className="font-bold text-base mt-6 mb-2">1. شرایط ثبت رزرو</h3>
          <p>
            ثبت رزرو تنها زمانی قطعی می‌شود که اطلاعات درخواست به طور کامل
            ثبت شده و پیش‌پرداخت مربوطه پرداخت گردد. پس از ثبت درخواست،
            ممکن است تیم پشتیبانی جهت تأیید اطلاعات با شما تماس بگیرد.
          </p>

          <h3 className="font-bold text-base mt-6 mb-2">2. پرداخت و پیش‌پرداخت</h3>
          <p>
            جهت قطعی شدن رزرو، مبلغی به عنوان پیش‌پرداخت دریافت می‌شود.
            مابقی مبلغ اجاره در زمان تحویل خودرو تسویه خواهد شد.
            در صورت عدم پرداخت در زمان مقرر، رزرو ممکن است لغو گردد.
          </p>

          <h3 className="font-bold text-base mt-6 mb-2">3. تحویل خودرو</h3>
          <p>
            خودرو در زمان و مکان انتخاب شده توسط مشتری تحویل داده می‌شود.
            هنگام تحویل، وضعیت ظاهری و فنی خودرو توسط طرفین بررسی می‌شود
            و مشتری موظف است خودرو را در همان شرایط اولیه تحویل بگیرد.
          </p>

          <h3 className="font-bold text-base mt-6 mb-2">4. عودت خودرو</h3>
          <p>
            خودرو باید در زمان تعیین شده بازگردانده شود. در صورت تأخیر
            در عودت خودرو، هزینه اضافی مطابق تعرفه شرکت محاسبه خواهد شد.
          </p>

          <h3 className="font-bold text-base mt-6 mb-2">5. بیمه خودرو</h3>
          <p>
            تمامی خودروها دارای بیمه پایه هستند. مشتری می‌تواند هنگام
            رزرو، بیمه کامل را نیز انتخاب کند تا مسئولیت مالی خسارات
            احتمالی کاهش یابد.
          </p>

          <h3 className="font-bold text-base mt-6 mb-2">6. خسارت و مسئولیت‌ها</h3>
          <p>
            در صورت بروز خسارت، مشتری موظف است مطابق قوانین بیمه و
            شرایط قرارداد، مسئولیت مالی مربوطه را بر عهده بگیرد.
            بررسی نهایی خسارت توسط کارشناسان شرکت انجام می‌شود.
          </p>

          <h3 className="font-bold text-base mt-6 mb-2">7. لغو رزرو</h3>
          <p>
            در صورت لغو رزرو، بسته به زمان اعلام لغو ممکن است بخشی از
            مبلغ پیش‌پرداخت به عنوان جریمه کسر شود.
          </p>

          <h3 className="font-bold text-base mt-6 mb-2">8. استفاده مجاز از خودرو</h3>
          <p>
            استفاده از خودرو در فعالیت‌های غیرقانونی، مسابقه، آموزش رانندگی،
            حمل بار سنگین یا انتقال به خارج از محدوده مجاز ممنوع است.
          </p>

          <div className="h-6" />
        </ScrollArea>

        {/* FIXED BUTTON */}
        <div className="border-t p-4 bg-white dark:bg-gray-950">
          <SheetClose asChild>
            <Button className="w-full h-11 rounded-xl font-bold">
              متوجه شدم
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  )
}
