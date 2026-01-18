"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import Image from "next/image";
import React, { useMemo } from "react";

type CategoryFromApi = {
  id: number;
  title: string;
};

type FakeCategory = {
  image: string; // فقط عکس
};

export default function CarCategory({
  categories,
  loading,
}: {
  categories?: CategoryFromApi[];
  loading?: boolean;
}) {
  // ✅ JSON فیک لوکال (فقط عکس‌ها)
  const fakeJson = useMemo<FakeCategory[]>(
    () => [
      { image: "/images/cat/bizz1.png" },
      { image: "/images/cat/bizz2.png" },
      { image: "/images/cat/cheap.png" },
      { image: "/images/cat/sport.png" },
      { image: "/images/cat/sedan.png" },
      { image: "/images/cat/family.png" },
      { image: "/images/cat/crock.png" },
      { image: "/images/cat/cheap.png" },
      { image: "/images/cat/sport.png" },
      { image: "/images/cat/sedan.png" },
    ],
    []
  );

  // ✅ فقط title از API — هیچ دستکاری‌ای روی title انجام نمیشه
  // ✅ عکس‌ها فقط از fakeJson و بر اساس index
  const listToRender = useMemo(() => {
    const apiList = categories ?? [];

    return apiList.map((cat, index) => ({
      ...cat, // همون دیتای API
      image: fakeJson[index % fakeJson.length].image, // فقط عکس از فیک
    }));
  }, [categories, fakeJson]);

  return (
    <div>
      <p className="px-4 font-bold">انتخاب خودرو بر اساس دسته بندی</p>

      <div
        className="
          flex gap-4
          overflow-x-auto overflow-y-hidden
          [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
        "
      >
        {/* LOADING */}
        {loading &&
          Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 items-center mt-4 shrink-0 animate-pulse"
            >
              <div className="w-28 h-28 bg-gray-200 rounded-xl" />
              <div className="w-24 h-4 bg-gray-200 rounded" />
            </div>
          ))}

        {/* EMPTY */}
        {!loading && listToRender.length === 0 && (
          <div className="px-4 mt-6 text-sm text-gray-500">
            دسته‌بندی‌ای یافت نشد
          </div>
        )}

        {/* DATA */}
        {!loading &&
          listToRender.map((cat) => (
            <div
              key={cat.id}
              className="flex flex-col gap-2 items-center mt-2 shrink-0"
            >
              <div className="w-32 h-32 relative rounded-xl overflow-hidden">
                <Image
                  alt={cat.title}
                  src={cat.image}
                  fill
                  className="object-contain p-2"
                />
              </div>
              <div className="text-sm whitespace-nowrap">{cat.title}</div>
            </div>
          ))}
      </div>
    </div>
  );
}
