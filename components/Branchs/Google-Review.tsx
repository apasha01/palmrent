import React from "react";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "علی رضایی",
    meta: "Local Guide · 12 نظر",
    date: "۳ هفته پیش",
    rating: 5,
    text: "همه چیز عالی بود. تحویل خودرو دقیقاً سر وقت انجام شد و پشتیبانی خیلی پاسخگو بود. بدون دپوزیت و بدون دردسر.",
  },
  {
    name: "مریم احمدی",
    meta: "8 نظر",
    date: "۱ ماه پیش",
    rating: 5,
    text: "برای اولین بار از پالم رنت اجاره کردم و واقعاً راضی بودم. قیمت شفاف، خودرو تمیز و رفتار پرسنل عالی.",
  },
  {
    name: "حسین کریمی",
    meta: "Local Guide · 21 نظر",
    date: "۲ ماه پیش",
    rating: 4,
    text: "تجربه خوبی بود. روند رزرو ساده بود و پرداخت موقع تحویل انجام شد. قطعاً دوباره استفاده می‌کنم.",
  },
];

const ReviewCard = ({ review }: { review: (typeof reviews)[number] }) => {
  return (
    <div className="rounded-lg border bg-white p-4 shadow flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
            {review.name[0]}
          </div>

          <div className="flex flex-col">
            <p className="text-sm font-semibold">{review.name}</p>
            <p className="text-xs text-muted-foreground">{review.meta}</p>
          </div>
        </div>

        <span className="text-xs text-muted-foreground">{review.date}</span>
      </div>

      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className="h-4 w-4 text-yellow-500"
            fill={i < review.rating ? "currentColor" : "none"}
          />
        ))}
      </div>

      <p className="text-sm leading-6 text-foreground">{review.text}</p>
    </div>
  );
};

const GoogleReview = () => {
  return (
    <div className="w-full">
      <div className="flex flex-col gap-4">
        <p className="font-bold text-sm px-4 md:px-0">نظر برخی از مشتریان پالم رنت در گوگل</p>

        {/* MOBILE */}
        <div className="md:hidden bg-white rounded-2xl p-4">
          <div className="flex gap-4 overflow-x-auto">
            {reviews.map((review, index) => (
              <div key={index} className="shrink-0 w-75">
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        </div>

        {/* DESKTOP */}
        <div className="hidden md:grid grid-cols-3 gap-4">
          {reviews.map((review, index) => (
            <ReviewCard key={index} review={review} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GoogleReview;
