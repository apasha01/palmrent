/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";

function toFaDigits(input: string | number | null | undefined) {
  if (input === null || input === undefined) return "—";
  const map: Record<string, string> = {
    "0": "۰",
    "1": "۱",
    "2": "۲",
    "3": "۳",
    "4": "۴",
    "5": "۵",
    "6": "۶",
    "7": "۷",
    "8": "۸",
    "9": "۹",
  };
  return String(input)
    .split("")
    .map((c) => (map[c] ? map[c] : c))
    .join("");
}

type TechnicalSpecsCar = {
  title?: string | null;
  gearbox?: string | null;
  fuel?: string | null;
  person?: number | string | null;
  baggage?: number | string | null;

  // اگر بعداً API اضافه کرد
  year?: number | string | null;
  doors?: number | string | null;
  engine_capacity?: string | number | null;
};

export function TechnicalSpecs({ car }: { car: TechnicalSpecsCar }) {
  const specs = [
    {
      label: "عنوان",
      value: car?.title || "—",
    },
    {
      label: "گیربکس",
      value: car?.gearbox || "—",
    },
    {
      label: "سوخت",
      value: car?.fuel || "—",
    },
    {
      label: "ظرفیت نفرات",
      value: car?.person ? `${toFaDigits(car.person)} نفر` : "—",
    },
    {
      label: "ظرفیت چمدان",
      value: car?.baggage ? `${toFaDigits(car.baggage)} چمدان` : "—",
    },
    {
      label: "سال",
      value: car?.year ? toFaDigits(car.year) : "—",
    },
    {
      label: "تعداد درب",
      value: car?.doors ? `${toFaDigits(car.doors)} درب` : "—",
    },
    {
      label: "حجم موتور",
      value: car?.engine_capacity
        ? `${toFaDigits(car.engine_capacity)} سی‌سی`
        : "—",
    },
  ].filter((x) => x.value !== "—"); // موارد ناموجود رو حذف می‌کنیم

  if (specs.length === 0) return null;

  return (
    <div className="rounded-xl p-2">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        مشخصات فنی
      </h2>

      <div className="border p-2 px-4 rounded-lg">
        {specs.map((spec, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-2.5 border-b border-dashed border-gray-200 last:border-b-0"
          >
            <span className="text-gray-500 text-sm">
              {spec.label}
            </span>
            <span className="text-gray-900 text-sm font-medium">
              {spec.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
