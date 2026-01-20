'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Calendar, ChevronDown } from 'lucide-react'

const pricingOptions = [
  { days: '۱ تا ۲ روز', price: '۶۰', originalPrice: '۸۰', perDay: 'روز' },
  { days: '۳ تا ۶ روز', price: '۵۵', originalPrice: '۷۰', perDay: 'روز' },
  { days: '۷ تا ۱۴ روز', price: '۵۰', originalPrice: '۶۵', perDay: 'روز' },
  { days: '۱۵ تا ۲۹ روز', price: '۴۵', originalPrice: '۵۸', perDay: 'روز' },
  { days: '+۳۰ روز', price: '۴۰', originalPrice: '۵۰', perDay: 'روز' },
]

const features = [
  { label: 'بدون ودیعه', active: true },
  { label: 'تحویل رایگان', active: true },
  { label: 'کیلومتر نامحدود', active: true },
]

export function PricingCard() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
      {/* Discount Badge */}
      <div className="flex items-center justify-between mb-4">
        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
          ۱۰٪ تخفیف
        </span>
        <span className="text-gray-600 text-sm">قیمت اجاره کیا سلتوس ۲۰۲۳ در دبی</span>
      </div>

      {/* Pricing Table */}
      <div className="space-y-2 mb-6">
        {pricingOptions.map((option, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <span className="text-gray-700 text-sm">{option.days}</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 line-through text-sm">از {option.originalPrice} درهم</span>
              <span className="text-teal-600 font-semibold">از {option.price} درهم</span>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Price */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4 flex items-center justify-between">
        <span className="text-gray-600 text-sm">هزینه ماهانه:</span>
        <span className="text-teal-600 font-bold">۵۰۰ درهم</span>
      </div>

      {/* Features */}
      <div className="flex flex-wrap gap-2 mb-6">
        {features.map((feature, index) => (
          <span key={index} className="flex items-center gap-1 bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full text-sm">
            <Check className="w-3.5 h-3.5" />
            {feature.label}
          </span>
        ))}
      </div>

      {/* Additional Info */}
      <div className="space-y-2 mb-6 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Check className="w-4 h-4 text-green-500" />
          <span>ودیعه قابل:</span>
          <span className="text-gray-900 font-medium">۵۰۰ درهم</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Check className="w-4 h-4 text-green-500" />
          <span>تحویل رایگان و بدون هزینه</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Check className="w-4 h-4 text-green-500" />
          <span>هزینه تحویل:</span>
          <span className="text-gray-900 font-medium">رایگان</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Check className="w-4 h-4 text-green-500" />
          <span>نرخ پایه:</span>
          <span className="text-gray-900 font-medium">یک روزه</span>
        </div>
      </div>

      {/* Date Selection */}
      <div className="space-y-3 mb-6">
        <span className="text-sm text-gray-600">برای اجاره کیا سلتوس ۲۰۲۳ تاریخ‌ها را مشخص کنید:</span>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="۱۴۰۳/۰۴/۱۵"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:border-teal-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="۱۴۰۳/۰۴/۱۷"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:border-teal-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Book Button */}
      <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white py-6 text-base font-medium rounded-lg">
        رزرو آنلاین
      </Button>

      {/* Book by call button */}
      <button className="w-full text-center text-teal-600 text-sm mt-3 hover:underline">
        رزرو تلفنی
      </button>
    </div>
  )
}
