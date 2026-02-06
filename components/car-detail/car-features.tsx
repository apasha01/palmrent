/* eslint-disable @typescript-eslint/no-explicit-any */
import { Check } from "lucide-react";

type ApiFeature = {
  id: number;
  title: string;
  value_type?: "boolean" | "text" | "number";
  unit?: string | null;
  icon?: string | null;
  sort?: number;
  value?: string | number | null;
};

export function CarFeatures({ car }: { car: any }) {
  const apiFeatures: ApiFeature[] = Array.isArray(car?.features) ? car.features : [];

  const items = apiFeatures
    .filter((f) => String(f?.title ?? "").trim().length > 0)
    .sort((a, b) => Number(a?.sort ?? 9999) - Number(b?.sort ?? 9999));

  // ✅ اگر فیچر نداشت: کل کامپوننت هیچ چیزی نشون نده
  if (items.length === 0) return null;

  const renderLabel = (f: ApiFeature) => {
    const title = String(f.title ?? "").trim();
    if (f.value !== null && f.value !== undefined && String(f.value).trim() !== "") {
      const unit = f.unit ? ` ${f.unit}` : "";
      return `${title}: ${f.value}${unit}`;
    }
    return title;
  };

  return (
    <div className="rounded-xl p-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">امکانات و ویژگی‌ها</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 border p-4 rounded-lg">
        {items.map((feature) => (
          <div key={feature.id} className="flex items-center gap-2 text-sm text-gray-700">
            <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center">
              <Check className="w-3 h-3 text-blue-600" />
            </div>
            <span>{renderLabel(feature)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
