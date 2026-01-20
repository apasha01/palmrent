import Image from 'next/image'
import { Car, Fuel, Users, Briefcase, Check } from 'lucide-react'
import { STORAGE_URL } from '@/lib/apiClient'

const similarCars = [
  {
    name: 'لامبورگینی هوراکان ۲۰۲۵',
    image: 'uploads/other/branch/1403-04-09/photos/photo-ccefde4c1c89af85249246b7d9c0eb32.webp',
    transmission: 'اتوماتیک',
    fuel: 'باک بنزین',
    seats: '۵ نفره',
    luggage: '۳ چمدان',
    features: ['بدون ودیعه', 'تحویل رایگان'],
    price: '۷۹',
    originalPrice: '۱۴۵۳',
    period: 'شروع قیمت از: ۱-۳ روز',
  },
  {
    name: 'لامبورگینی هوراکان ۲۰۲۵',
    image: 'uploads/other/branch/1403-04-09/photos/photo-ccefde4c1c89af85249246b7d9c0eb32.webp',
    transmission: 'اتوماتیک',
    fuel: 'باک بنزین',
    seats: '۵ نفره',
    luggage: '۳ چمدان',
    features: ['بدون ودیعه', 'تحویل رایگان'],
    price: '۷۹',
    originalPrice: '۱۴۵۳',
    period: 'شروع قیمت از: ۱-۳ روز',
  },
]

export function SimilarCars() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-4">خودروهای مشابه</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {similarCars.map((car, index) => (
          <div key={index} className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative h-48">
              <Image
                src={STORAGE_URL + car.image}
                alt={car.name}
                fill
                className="object-cover"
              />
            </div>
            
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-2">{car.name}</h3>
              
              {/* Car Specs */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <Car className="w-3.5 h-3.5" />
                  <span>{car.transmission}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5" />
                  <span>{car.fuel}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{car.seats}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{car.luggage}</span>
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-2 mb-3">
                {car.features.map((feature, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs text-teal-600 bg-teal-50 px-2 py-1 rounded-full">
                    <Check className="w-3 h-3" />
                    {feature}
                  </span>
                ))}
              </div>

              {/* Price */}
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-xs text-gray-500">{car.period}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 line-through text-sm">{car.originalPrice}</span>
                  <span className="text-teal-600 font-bold">V {car.price} درهم</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
