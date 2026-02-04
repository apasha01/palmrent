/* eslint-disable @typescript-eslint/no-explicit-any */
import Header from "@/components/layouts/Header";
import Footer from "@/components/Footer";

import { CarDescription } from "@/components/car-detail/car-description";
import { CarFeatures } from "@/components/car-detail/car-features";
import FAQcardetail from "@/components/car-detail/Faq-car-detail";
import { ImageGallery } from "@/components/car-detail/image-gallery";
import { PricingCard } from "@/components/car-detail/pricing-card";
import { RequiredDocuments } from "@/components/car-detail/required-documents";
import { ReviewsSection } from "@/components/car-detail/reviews-section";
import { SimilarCars } from "@/components/car-detail/similar-cars";
import { TechnicalSpecs } from "@/components/car-detail/technical-specs";

import { getLocale } from "next-intl/server";

import { Car, Fuel, Users, Briefcase, Heart, Share2 } from "lucide-react";
import { getCarDetail } from "@/services/car-detail/car-detail.api";

type FeatureChip = { label: string; active: boolean };

function buildFeaturesFromApi(car: any): FeatureChip[] {

  const depositNum = Number(car?.deposit ?? 0);

  return [
    { label: "بدون ودیعه", active: !Number.isNaN(depositNum) && depositNum === 0 },
    { label: "تحویل رایگان", active: String(car?.free_delivery) === "yes" },
    { label: "کیلومتر نامحدود", active: String(car?.km) === "yes" },
    { label: "بیمه", active: String(car?.insurance) === "yes" },
  ];
}

export default async function CarRentalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();

  const car = await getCarDetail(id, locale);

  // اگر از بک چیزی نیومد یا خطا شد
  if (!car) {
    return (
      <div className="">
        <Header />
        <main className="max-w-7xl mx-auto px-2 md:p-0 py-10 mt-4">
          <div className="rounded-xl border p-6 text-center">
            <h1 className="text-xl font-bold text-gray-900">خودرو پیدا نشد</h1>
            <p className="text-sm text-muted-foreground mt-2">
              ممکنه آیدی اشتباه باشه یا خودرو حذف شده باشه.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const features = buildFeaturesFromApi(car).filter((f) => f.active);

  return (
    <div className="">
      <Header />

      <main className="max-w-7xl mx-auto px-2 md:p-0  mt-2">
        {/* Image Gallery */}
<ImageGallery media={[car.video, ...(car.photos ?? [])]} />


        {/* Main Content */}
        <div className="md:mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Pricing (✅ در موبایل میاد بالا) */}
          <div className="lg:col-span-1 order-1 lg:order-2">
<PricingCard
  car={car}
  dailyPrice={car.daily_price}
  deposit={car.deposit}
  currency={car.currency}
  offPercent={car.off_percent}
  whatsapp={car.whatsapp}
/>

          </div>

          {/* Right Side - Main Info (✅ در موبایل میره پایین) */}
          <div className="lg:col-span-2 space-y-2 order-2 lg:order-1">
            {/* Title and Quick Info */}
            <div className="rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-gray-900">{car.title}</h1>

                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors">
                    <Share2 className="w-4 h-4 text-accent-foreground md:text-blue-600" />
                    <span className="hidden md:block">اشتراک‌گذاری</span>
                  </button>

                  <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors">
                    <Heart className="w-4 h-4 text-accent-foreground md:text-blue-600" />
                    <span className="hidden md:block">افزودن به علاقه‌مندی‌ها</span>
                  </button>
                </div>
              </div>

              {/* Car Quick Specs */}
              <div className="flex gap-2 justify-between flex-col md:flex-row">
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 pb-4">
                  <div className="flex items-center gap-1">
                    <Car className="w-4 h-4" />
                    <span>{car.gearbox}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Fuel className="w-4 h-4" />
                    <span>{car.fuel}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{car.person} نفره</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    <span>{car.baggage} چمدان</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {features.map((feature, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm"
                    >
                      {feature.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Required Documents */}
              <RequiredDocuments branch={car.branch} />
            </div>

            {/* Technical Specifications */}
            <TechnicalSpecs car={car} />

            {/* Features */}
            <CarFeatures car={car} />

            {/* Reviews */}
            <ReviewsSection carId={car.id} />

            {/* FAQ */}
            <div className="mt-6">
              <FAQcardetail carId={car.id} />
            </div>

            {/* Similar Cars */}
            <SimilarCars items={car.similar_cars} locale={locale} />

            {/* Description */}
        <CarDescription
  html={car.text}
  title={`درباره ${car.title} در ${car.branch}`}
/>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
