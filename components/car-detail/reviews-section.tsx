/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React from "react"
import Image from "next/image"
import { ChevronLeft, User, MoreHorizontal } from "lucide-react"
import { Button } from "../ui/button"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

interface ReviewCardProps {
  name: string
  date: string
  rating: string
  ratingLabel: string
  reviewText: string
  images?: string[]
}

export function ReviewCard({
  name,
  date,
  rating,
  ratingLabel,
  reviewText,
  images = [],
}: ReviewCardProps) {
  return (
    // ✅ دیگه width اینجا نیست -> w-full
    <div className="rounded-xl border p-5 flex flex-col min-h-80 w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="w-7 h-7 text-gray-400" />
        </div>

        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">{name}</span>
            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
              خریدار علی‌بابا
            </span>
          </div>
          <span className="text-sm text-gray-500 mt-1">{date}</span>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 border-b pb-2">
        <span className="text-gray-700 font-bold">{ratingLabel}</span>
        <span className="text-gray-700 font-bold">{rating}</span>
      </div>

      {/* Review Text */}
      <p className="text-gray-600 text-sm leading-relaxed text-right flex-1 mt-2">
        {reviewText}
      </p>

      {/* Images */}
      {images.length > 0 && (
        <div className="flex items-center gap-2 mt-4">
          {images.slice(0, 2).map((img, index) => (
            <div key={index} className="w-14 h-14 rounded overflow-hidden relative">
              <Image
                src={img || "/placeholder.svg"}
                alt={`Review image ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}

          {images[2] && (
            <div className="w-14 h-14 rounded overflow-hidden relative">
              <Image
                src={images[2]}
                alt="More images"
                fill
                className="object-cover blur-sm"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <MoreHorizontal className="w-6 h-6 text-white" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* More Link */}
      <button className="flex items-center gap-1 text-blue-600 text-sm font-medium mt-4 hover:text-blue-700 transition-colors">
        <span>بیشتر</span>
        <ChevronLeft className="w-6 h-6" />
      </button>
    </div>
  )
}

const reviews = [
  {
    name: "بابک",
    date: "شهریور ۱۴۰۴",
    rating: "۵",
    ratingLabel: "فوق‌العاده",
    reviewText:
      "اگرنظم و زیبایی و تظافت واستون مهمه فقط پیشنهادم هتل اسپیناسه..درجه یکککک...",
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=200&fit=crop",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=200&h=200&fit=crop",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=200&h=200&fit=crop",
    ],
  },
  {
    name: "سهیلا",
    date: "خرداد ۱۴۰۴",
    rating: "۴.۲",
    ratingLabel: "عالی",
    reviewText:
      "پذیرش عالی پرسنل عالی نیود لاندری یگ نیود دستگاه اسپرسوساز صبحانه بی کیفیت",
    images: [],
  },
  {
    name: "پیمان",
    date: "خرداد ۱۴۰۴",
    rating: "۴.۸",
    ratingLabel: "فوق‌العاده",
    reviewText: "همه چیز عالی",
    images: [],
  },
]

export function ReviewsSection(carId:any) {
  return (
    <section className="w-full px-2">
      <p className="font-bold mb-2">مشاهده اخرین نظرات</p>

      <div className="max-w-6xl mx-auto">
        <Carousel
  opts={{
    align: "start",
    containScroll: "trimSnaps",
    direction: "rtl", // ✅ این خط کل مشکل رو حل می‌کنه
  }}
          className="w-full"
        >
          {/* برای اینکه “نصفه کارت بعدی” معلوم باشه */}
          <CarouselContent className="-ml-4">
            {reviews.map((review, index) => (
              <CarouselItem
                key={index}
                // ✅ عرض اصلی اینجاست (نه داخل کارت)
                // موبایل: 85vw (نصفه بعدی معلوم)
                // sm/md/lg: ثابت
                className="pl-4 basis-[85vw] sm:basis-[420px] lg:basis-[380px]"
              >
                <ReviewCard {...review} />
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* ✅ دکمه‌ها فقط md به بالا */}
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>

        <Button variant="outline-primary" className="mt-2">
          مشاهده همه نظرات
        </Button>
      </div>
    </section>
  )
}
