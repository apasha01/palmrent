/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react"
import { HelpCircle } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion"

const FAQcardetail = (carId:any) => {
  return (
    <div>
      <p className="font-bold px-4 md:px-2 lg:px-0 text-gray-900 dark:text-gray-100">
        پرسش‌های شما
      </p>

      <div className="w-full mt-4 px-4 md:px-0">
        <Accordion type="single" collapsible className="w-full ">
          {/* Item 1 */}
          <AccordionItem
            value="item-1"
            className="
              w-full
               dark:bg-gray-900
              rounded-xl
              border border-gray-200 dark:border-gray-800
              shadow-sm dark:shadow-none
              px-3
            "
          >
            <AccordionTrigger className="w-full text-gray-900 dark:text-gray-100">
              <div className="flex items-center gap-2 text-right">
                <HelpCircle className="w-5 h-5 text-blue-500 shrink-0" />
                <span>چگونه می‌توانم خودرو رزرو کنم؟</span>
              </div>
            </AccordionTrigger>

            <AccordionContent className="text-right text-sm leading-6 text-gray-600 dark:text-gray-300">
              کافیست خودرو مورد نظر را انتخاب کنید، تاریخ و ساعت تحویل را مشخص
              کنید و اطلاعات تماس را وارد کنید. پس از ثبت رزرو، تیم پشتیبانی
              برای نهایی کردن هماهنگی‌ها با شما تماس می‌گیرد.
            </AccordionContent>
          </AccordionItem>

          {/* Item 2 */}
          <AccordionItem
            value="item-2"
            className="
              w-full
               dark:bg-gray-900
              rounded-xl
              border border-gray-200 dark:border-gray-800
              shadow-sm dark:shadow-none
              px-3
            "
          >
            <AccordionTrigger className="w-full text-gray-900 dark:text-gray-100">
              <div className="flex items-center gap-2 text-right">
                <HelpCircle className="w-5 h-5 text-blue-500 shrink-0" />
                <span>آیا برای اجاره خودرو دپوزیت لازم است؟</span>
              </div>
            </AccordionTrigger>

            <AccordionContent className="text-right text-sm leading-6 text-gray-600 dark:text-gray-300">
              در بسیاری از خودروها امکان اجاره بدون دپوزیت وجود دارد. شرایط هر
              خودرو در صفحه همان خودرو نوشته شده است.
            </AccordionContent>
          </AccordionItem>

          {/* Item 3 */}
          <AccordionItem
            value="item-3"
            className="
              w-full
               dark:bg-gray-900
              rounded-xl
              border border-gray-200 dark:border-gray-800
              shadow-sm dark:shadow-none
              px-3
            "
          >
            <AccordionTrigger className="w-full text-gray-900 dark:text-gray-100">
              <div className="flex items-center gap-2 text-right">
                <HelpCircle className="w-5 h-5 text-blue-500 shrink-0" />
                <span>پرداخت چگونه انجام می‌شود؟</span>
              </div>
            </AccordionTrigger>

            <AccordionContent className="text-right text-sm leading-6 text-gray-600 dark:text-gray-300">
              پرداخت می‌تواند به صورت آنلاین از درگاه امن یا هنگام تحویل خودرو
              انجام شود (بسته به شرایط رزرو).
            </AccordionContent>
          </AccordionItem>

          {/* Item 4 */}
          <AccordionItem
            value="item-4"
            className="
              w-full
               dark:bg-gray-900
              rounded-xl
              border border-gray-200 dark:border-gray-800
              shadow-sm dark:shadow-none
              px-3
            "
          >
            <AccordionTrigger className="w-full text-gray-900 dark:text-gray-100">
              <div className="flex items-center gap-2 text-right">
                <HelpCircle className="w-5 h-5 text-blue-500 shrink-0" />
                <span>اگر مشکلی در زمان تحویل خودرو پیش بیاید چه کار کنم؟</span>
              </div>
            </AccordionTrigger>

            <AccordionContent className="text-right text-sm leading-6 text-gray-600 dark:text-gray-300">
              پشتیبانی ما در تمام مراحل کنار شماست. کافیست با شماره پشتیبانی
              تماس بگیرید تا سریع پیگیری شود.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}

export default FAQcardetail
