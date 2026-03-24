/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useTranslations } from "next-intl";

type TechnicalSpecsCar = {
  title?: string | null;
  gearbox?: string | null;
  fuel?: string | null;
  person?: number | string | null;
  baggage?: number | string | null;
  year?: number | string | null;
  doors?: number | string | null;
  engine_capacity?: string | number | null;
};

export function TechnicalSpecs({ car }: { car: TechnicalSpecsCar }) {
  const t = useTranslations("technicalSpecs");

  const specs = [
    {
      label: t("fields.carTitle"),
      value: car?.title || null,
    },
    {
      label: t("fields.gearbox"),
      value: car?.gearbox || null,
    },
    {
      label: t("fields.fuel"),
      value: car?.fuel || null,
    },
    {
      label: t("fields.persons"),
      value: car?.person
        ? t("values.persons", { count: String(car.person) })
        : null,
    },
    {
      label: t("fields.baggage"),
      value: car?.baggage
        ? t("values.baggage", { count: String(car.baggage) })
        : null,
    },
    {
      label: t("fields.year"),
      value: car?.year ? String(car.year) : null,
    },
    {
      label: t("fields.doors"),
      value: car?.doors
        ? t("values.doors", { count: String(car.doors) })
        : null,
    },
    {
      label: t("fields.engineCapacity"),
      value: car?.engine_capacity
        ? t("values.engineCapacity", { value: String(car.engine_capacity) })
        : null,
    },
  ].filter((x) => x.value !== null);

  if (specs.length === 0) return null;

  return (
    <div className="rounded-xl p-2">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{t("title")}</h2>

      <div className="border p-2 px-4 rounded-lg">
        {specs.map((spec, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-2.5 border-b border-dashed border-gray-200 last:border-b-0"
          >
            <span className="text-gray-500 text-sm">{spec.label}</span>
            <span className="text-gray-900 text-sm font-medium">
              {spec.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}