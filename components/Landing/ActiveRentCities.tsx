"use client";

import React from "react";
import { Button } from "../ui/button";
import { ArrowUpLeftIcon } from "lucide-react";

type City = {
  id: number | string;
  title: string;
};

type ActiveRentCitiesProps = {
  cities?: City[];
};

const ActiveRentCities = ({ cities }: ActiveRentCitiesProps) => {
  const visibleCities = (cities ?? []).slice(0, 3);

  return (
    <div className="w-full px-2 md:px-0">
      <div className="flex flex-col">
        <p className="font-bold md:text-2xl text-xl">
          شهرهای فعال پالم رنت برای اجاره خودرو
        </p>
        <p className="text-xs mt-2 text-gray-600">
          شهر را انتخاب کنید تا خودروهای موجود و شرایط رزرو در همان شهر نمایش
          داده شود.
        </p>
      </div>

      <div className="mt-6 w-full flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        {/* ✅ شهرها: موبایل ستونی | تبلت/دسکتاپ ردیفی و کشسان */}
        <div className="w-full flex flex-col md:flex-row gap-3 md:flex-1">
          {visibleCities.map((city) => (
            <Button
              key={city.id}
              type="button"
              variant="outline"
              size="lg"
              className="
                w-full
                md:flex-1
                h-12 md:h-14
                flex items-center justify-between
                text-sm md:text-base
              "
            >
              <span>{city.title}</span>
              <ArrowUpLeftIcon className="size-5" />
            </Button>
          ))}
        </div>

        {/* ✅ مشاهده همه: دسکتاپ/تبلت کنار شهرها */}
        <Button
          size="lg"
          type="button"
          variant="outline-primary"
          className="hidden md:inline-flex h-14 px-6 shrink-0"
        >
          مشاهده همه شهرهای اجاره خودرو
          <ArrowUpLeftIcon className="size-5" />
        </Button>

        {/* ✅ مشاهده همه: موبایل تمام‌عرض */}
        <Button
          type="button"
          size="lg"
          variant="outline-primary"
          className="md:hidden w-full h-14 mt-2"
        >
          مشاهده همه شهرهای اجاره خودرو
          <ArrowUpLeftIcon className="size-5" />
        </Button>
      </div>
    </div>
  );
};

export default ActiveRentCities;
