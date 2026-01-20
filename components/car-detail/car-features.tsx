import { Check } from 'lucide-react'

const features = [
  'Apple CarPlay / Android Auto',
  'دوربین دنده عقب',
  'کروز کنترل',
  'سیستم ورود بدون کلید (Keyless Entry)',
  'صندلی برقی راننده',
  'سانروف / پانوراما',
  'سیستم صوتی ارتقا یافته',
]

export function CarFeatures() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">امکانات و ویژگی‌ها</h2>
        <button className="text-teal-600 text-sm hover:underline">
          مشاهده همه امکانات
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
            <div className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center">
              <Check className="w-3 h-3 text-teal-600" />
            </div>
            <span>{feature}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
