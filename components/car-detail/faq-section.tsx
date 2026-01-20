'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { HelpCircle } from 'lucide-react'

const faqs = [
  {
    question: 'کیا سلتوس ۲۰۲۵ در دبی با چه مدارکی اجاره داده می‌شود؟',
    answer: 'برای اجاره کیا سلتوس در دبی نیاز به پاسپورت معتبر، گواهینامه بین‌المللی یا گواهینامه امارات و ویزای معتبر دارید.',
  },
  {
    question: 'آیا برای اجاره کیا سلتوس ۲۰۲۵ در دبی ودیعه لازم است؟',
    answer: 'بله، ودیعه قابل برگشت ۵۰۰ درهم مورد نیاز است که در پایان اجاره به شما بازگردانده می‌شود.',
  },
  {
    question: 'هزینه اجاره روزانه کیا سلتوس ۲۰۲۵ در دبی چقدر است و چه چیزهایی روی قیمت اثر دارد؟',
    answer: 'هزینه اجاره روزانه از ۴۰ تا ۶۰ درهم متغیر است و بستگی به مدت اجاره، فصل و تقاضا دارد.',
  },
  {
    question: 'تحویل و عودت کیا سلتوس ۲۰۲۵ در دبی چگونه انجام می‌شود؟ (هتل/فرودگاه/دفتر)',
    answer: 'تحویل رایگان در هتل، فرودگاه یا دفتر ما انجام می‌شود. همچنین امکان عودت در همین مکان‌ها وجود دارد.',
  },
  {
    question: 'قوانین کنسلی یا تغییر تاریخ رزرو کیا سلتوس ۲۰۲۵ در دبی چگونه است؟',
    answer: 'کنسلی تا ۲۴ ساعت قبل از تحویل رایگان است. برای تغییر تاریخ با پشتیبانی تماس بگیرید.',
  },
]

export function FAQSection() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-4">پرسش‌های پر تکرار</h2>
      
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-100">
            <AccordionTrigger className="text-right text-gray-700 hover:no-underline py-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-teal-500 shrink-0" />
                <span className="text-sm">{faq.question}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 text-sm pr-7">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
