/* eslint-disable @typescript-eslint/no-explicit-any */
import Header from "@/components/layouts/Header";
import Footer from "@/components/Footer";

import { CarDescription } from "@/components/car-detail/car-description";
import { CarFeatures } from "@/components/car-detail/car-features";
import FAQcardetail from "@/components/car-detail/Faq-car-detail";
import { ImageGallery } from "@/components/car-detail/image-gallery";
import { PricingCard } from "@/components/car-detail/pricing-card";

import { RequiredDocuments } from "@/components/car-detail/required-documents";
import { SimilarCars } from "@/components/car-detail/similar-cars";
import { TechnicalSpecs } from "@/components/car-detail/technical-specs";

import { getLocale } from "next-intl/server";
import { Car, Fuel, Users, Briefcase, Heart, Share2 } from "lucide-react";
import { getCarDetail } from "@/services/car-detail/car-detail.api";
import { MobilePriceBar } from "@/components/car-detail/mobile-price-bar";

import Script from "next/script";

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

  if (!car) {
    return (
      <div>
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
    <div className="bg-white">
      <Header shadowLess={true} />

      {/* ✅ اسکریپت داخل همین صفحه (بدون کامپوننت جدا) */}
      <Script id="pricing-sticky-top" strategy="afterInteractive">{`
        (function () {
          // حالت‌ها:
          // پایین رفتن = 4px
          // بالا برگشتن (هدر میاد) = 80px
          var DOWN_TOP = 4;
          var UP_TOP = 80;

          // مقدار اولیه
          document.documentElement.style.setProperty('--pricing-top', DOWN_TOP + 'px');

          var lastY = window.scrollY || 0;
          var ticking = false;

          function headerVisible() {
            var el = document.getElementById('site-fixed-header');
            if (!el) return false;
            var r = el.getBoundingClientRect();
            // اگر بخشی از هدر روی صفحه دیده میشه
            return r.bottom > 0;
          }

          function update() {
            ticking = false;
            var y = window.scrollY || 0;
            var goingUp = y < lastY;

            // اگر رو به بالا رفتی یا هدر visible شد => top بزرگ‌تر
            // اگر رو به پایین رفتی و هدر قایم شد => top کوچک
            var nextTop = (goingUp || headerVisible()) ? UP_TOP : DOWN_TOP;

            document.documentElement.style.setProperty('--pricing-top', nextTop + 'px');
            lastY = y;
          }

          function onScroll() {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(update);
          }

          window.addEventListener('scroll', onScroll, { passive: true });
          window.addEventListener('resize', onScroll);

          // یکبار هم اولش sync
          onScroll();
        })();
      `}</Script>

      <main className="max-w-7xl mx-auto px-2 md:p-0 mt-2">
        <ImageGallery media={[car.video, ...(car.photos ?? [])]} />

        <div className="md:mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ================== LEFT / PRICING ================== */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            {/* ✅ Desktop sticky با top داینامیک */}
  <div
  className="hidden lg:block self-start sticky z-10 transition-[top] duration-300 ease-out"
  style={{ top: "var(--pricing-top, 4px)" }}
>

              <PricingCard
                car={car}
                dailyPrice={car.daily_price}
                deposit={car.deposit}
                currency={car.currency}
                offPercent={car.off_percent}
                whatsapp={car.whatsapp}
              />
            </div>

            {/* ✅ Mobile: کارت قیمت داخل جریان */}
            <div id="mobile-pricing-card" className="lg:hidden">
              <PricingCard
                car={car}
                dailyPrice={car.daily_price}
                deposit={car.deposit}
                currency={car.currency}
                offPercent={car.off_percent}
                whatsapp={car.whatsapp}
              />
            </div>
          </div>

          {/* ================== RIGHT / CONTENT ================== */}
          <div className="lg:col-span-2 space-y-2 order-2 lg:order-1">
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

              <RequiredDocuments branch={car.branch} />
            </div>

            <TechnicalSpecs car={car} />
            <CarFeatures car={car} />

            <div className="mt-6">
              <FAQcardetail carId={car.id} />
            </div>

            <SimilarCars items={car.similar_cars} currency={car.currency} />

            <CarDescription
              html={car.text}
              title={`درباره ${car.title} در ${car.branch}`}
            />
          </div>
        </div>
      </main>

      <Footer />

      <MobilePriceBar
        car={car}
        dailyPrice={car.daily_price}
        currency={car.currency}
        offPercent={car.off_percent}
      />
    </div>
  );
}
