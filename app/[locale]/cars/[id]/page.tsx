
import { CarDescription } from '@/components/car-detail/car-description'
import { CarFeatures } from '@/components/car-detail/car-features'
import { FAQSection } from '@/components/car-detail/faq-section'
import { ImageGallery } from '@/components/car-detail/image-gallery'
import { PricingCard } from '@/components/car-detail/pricing-card'
import { RequiredDocuments } from '@/components/car-detail/required-documents'
import { ReviewsSection } from '@/components/car-detail/reviews-section'
import { SimilarCars } from '@/components/car-detail/similar-cars'
import { TechnicalSpecs } from '@/components/car-detail/technical-specs'
import { Car, Fuel, Users, Briefcase, Heart, Share2, Play } from 'lucide-react'

export default function CarRentalPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-2 md:p-0 py-6">
        {/* Image Gallery */}
        <ImageGallery />

        {/* Main Content */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Right Side - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Quick Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">اجاره کیا سلتوس ۲۰۲۳ در دبی</h1>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-teal-600">
                    <Share2 className="w-4 h-4" />
                    <span>اشتراک گذاری</span>
                  </button>
                  <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-500">
                    <Heart className="w-4 h-4" />
                    <span>افزودن به علاقه‌مندی‌ها</span>
                  </button>
                </div>
              </div>

              {/* Car Quick Specs */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 border-b pb-4">
                <div className="flex items-center gap-1">
                  <Car className="w-4 h-4" />
                  <span>اتوماتیک</span>
                </div>
                <div className="flex items-center gap-1">
                  <Fuel className="w-4 h-4" />
                  <span>بنزین</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>۵ نفره</span>
                </div>
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  <span>۳ چمدان</span>
                </div>
              </div>

              {/* Required Documents */}
              <RequiredDocuments />
            </div>

            {/* Technical Specifications */}
            <TechnicalSpecs />

            {/* Features */}
            <CarFeatures />

            {/* Reviews */}
            <ReviewsSection />

            {/* FAQ */}
            <FAQSection />

            {/* Similar Cars */}
            <SimilarCars />

            {/* Description */}
            <CarDescription />
          </div>

          {/* Left Side - Pricing */}
          <div className="lg:col-span-1">
            <PricingCard />
          </div>
        </div>
      </main>
    </div>
  )
}
// دیفالت یک روز اینده و  پنج روز اینده اش ساعت ۱۰ صبح . 
// مقالات