import { Star, MessageCircle, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const reviews = [
  {
    name: 'پیمان',
    avatar: 'پ',
    rating: 4.8,
    label: 'فوق‌العاده',
    color: 'bg-amber-500',
    comment: 'همه چیز مالی',
  },
  {
    name: 'سمیه',
    avatar: 'س',
    rating: 4.2,
    label: 'عالی',
    color: 'bg-teal-500',
    comment: 'پذیرش عالی پرسنل عالی\nنحوه تحویل عالی\nنحوه دستگاه اسپری‌مسوار\nتصحیحانه بی کیفیت',
  },
  {
    name: 'باشک',
    avatar: 'ب',
    rating: 5,
    label: 'فوق‌العاده',
    color: 'bg-blue-500',
    comment: 'اگر تمام و دیدمی و نظافت واسمون مهمه\nآقای بیزینس‌بارد هتل اسینشنساک، درجه\n۵۵ستاره...',
  },
]

const overallRating = {
  score: 5,
  label: 'فوق‌العاده',
  totalReviews: 91,
}

export function ReviewsSection() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-4">آخرین نظرات این خودرو ({overallRating.totalReviews} نظر)</h2>
      
      {/* Overall Rating */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b">
        <div className="flex items-center gap-2">
          <div className="bg-blue-500 text-white px-3 py-1 rounded-lg flex items-center gap-1">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-bold">{overallRating.score}</span>
          </div>
          <span className="text-gray-700 font-medium">{overallRating.label}</span>
        </div>
        
        {/* Rating Categories */}
        <div className="flex items-center gap-4 text-sm">
          {[
            { label: 'جیپاک علیشبا', color: 'bg-amber-400' },
            { label: 'جیپاک علیشبا', color: 'bg-teal-400' },
            { label: 'جیپاک علیشبا', color: 'bg-blue-400' },
          ].map((cat, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${cat.color}`}></div>
              <span className="text-gray-600">{cat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reviews.map((review, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 ${review.color} text-white rounded-full flex items-center justify-center text-sm font-medium`}>
                  {review.avatar}
                </div>
                <span className="text-gray-900 font-medium text-sm">{review.name}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Star className="w-4 h-4 text-amber-400 fill-current" />
                <span className="text-gray-700">{review.rating}</span>
                <span className="text-gray-500 text-xs">{review.label}</span>
              </div>
            </div>
            <p className="text-gray-600 text-sm whitespace-pre-line line-clamp-3">{review.comment}</p>
            <button className="text-teal-600 text-sm mt-2 flex items-center gap-1 hover:underline">
              <span>بیشتر</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        {/* More Reviews Card */}
        <div className="border rounded-lg p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <MessageCircle className="w-6 h-6 text-gray-400" />
            </div>
            <button className="text-teal-600 text-sm flex items-center gap-1 hover:underline">
              <span>بیشتر</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* View All Button */}
      <div className="mt-6 text-center">
        <Button variant="outline" className="border-teal-500 text-teal-600 hover:bg-teal-50 bg-transparent">
          مشاهده همه نظرات
        </Button>
      </div>
    </div>
  )
}
