"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from "next/image"
import Link from "next/link"
import { Car, Fuel, Users, Briefcase, Info } from "lucide-react"
import { STORAGE_URL } from "@/lib/apiClient"

type Props = {
  items: any[]
  currency?: string
}

export function SimilarCars({ items = [], currency = "درهم" }: Props) {
  const safeItems = Array.isArray(items) ? items : []
  if (safeItems.length === 0) return null

  // ✅ تبدیل اعداد فارسی/عربی به لاتین + حذف RTL/LTR marks
  const normalizeDigits = (input: string) => {
    const fa = "۰۱۲۳۴۵۶۷۸۹"
    const ar = "٠١٢٣٤٥٦٧٨٩"
    let s = input

    for (let i = 0; i < 10; i++) {
      s = s.replaceAll(fa[i], String(i)).replaceAll(ar[i], String(i))
    }

    return s
      .replace(/[\u200E\u200F\u202A-\u202E]/g, "")
      .replace(/\s+/g, "")
      .trim()
  }

  const toNum = (v: any): number | null => {
    if (v === null || v === undefined || v === "") return null
    if (typeof v === "number") return Number.isFinite(v) ? v : null
    const raw = normalizeDigits(String(v).replaceAll(",", ""))
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  }

  const formatNumFa = (n: number | null) => {
    if (n === null) return null
    return new Intl.NumberFormat("fa-IR").format(Math.round(n))
  }

  // ✅ فقط گروه اول: نمایش "(۱ تا ۶ روز)" یا اگر بک range داد همونو
  const firstRangeLabel = (prices: any): string => {
    if (Array.isArray(prices) && prices.length > 0) {
      const p0 = prices[0]
      if (typeof p0?.range === "string" && p0.range.trim()) return p0.range.trim()
      if (String(p0?.type) === "price_1") return "۱ تا ۶ روز"
    }
    return "۱ تا ۶ روز"
  }

  const mapped = safeItems.map((c: any) => {
    const seats = toNum(c?.person) ?? toNum(c?.passengers) ?? toNum(c?.seats) ?? 0
    const luggage = toNum(c?.baggage) ?? toNum(c?.luggage) ?? toNum(c?.suitcase) ?? 0

    const finalPrice =
      toNum(c?.final_price) ??
      toNum(c?.price_off) ??
      toNum(c?.price) ??
      null

    const originalPrice =
      toNum(c?.rent_price) ??
      toNum(c?.base_price) ??
      toNum(c?.originalPrice) ??
      null

    const imgPath =
      Array.isArray(c?.photo) && c.photo.length > 0
        ? c.photo[0]
        : typeof c?.image === "string"
          ? c.image
          : null

    const image = imgPath ? STORAGE_URL + imgPath : "/images/placeholder.png"

    const features: string[] = []
    if (String(c?.deposit) === "no") features.push("بدون ودیعه")
    if (String(c?.free_delivery) === "yes") features.push("تحویل رایگان")
    if (String(c?.km) === "yes") features.push("کیلومتر نامحدود")
    if (String(c?.insurance) === "yes") features.push("بیمه")

    const range = firstRangeLabel(c?.prices)

    return {
      id: c?.id,
      name: c?.title ?? "—",
      image,
      transmission: c?.gearbox ?? c?.transmission ?? "—",
      fuel: c?.fuel ?? "—",
      seats,
      luggage,
      features,
      price: finalPrice,
      originalPrice,
      off: toNum(c?.off) ?? 0,
      period: `شروع قیمت از: (${range})`,
    }
  })

  return (
    <div className="rounded-xl p-2">
      <h2 className="text-lg font-bold text-gray-900 mb-4">خودروهای مشابه</h2>

      {/* ✅ اسکرول افقی، ولی اسکرول‌بار مخفی */}
      <div
        className="
          flex gap-4 overflow-x-auto pb-2
          [scrollbar-width:none]
          [-ms-overflow-style:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        {mapped.map((car, index) => {
          const href = car?.id ? `/cars/${car.id}` : "#"

          return (
            <Link
              key={car.id ?? index}
              href={href}
              aria-disabled={!car?.id}
              className="
                border rounded-xl overflow-hidden hover:shadow-md transition-shadow
                shrink-0
                w-full
                md:w-[calc((100%-1rem)/2)]
                block
              "
              // اگر id نبود، کلیک نشه
              onClick={(e) => {
                if (!car?.id) e.preventDefault()
              }}
            >
              <div className="relative h-48">
                <Image src={car.image} alt={car.name} fill className="object-cover" />
              </div>

              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{car.name}</h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Car className="w-3.5 h-3.5" />
                    <span>{car.transmission}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Fuel className="w-3.5 h-3.5" />
                    <span>{car.fuel}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{formatNumFa(car.seats) ?? "۰"} نفر</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{formatNumFa(car.luggage) ?? "۰"} چمدان</span>
                  </div>
                </div>

                {car.features.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {car.features.map((feature: string, i: number) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full"
                      >
                        {feature}
                        <Info className="w-3 h-3" />
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-xs text-gray-500">{car.period}</span>

                  <div className="flex items-center gap-2">
                    {car.originalPrice !== null &&
                      car.price !== null &&
                      car.originalPrice > car.price && (
                        <span className="text-gray-400 line-through text-sm">
                          {formatNumFa(car.originalPrice)}
                        </span>
                      )}

                    {car.price !== null ? (
                      <span className="text-blue-600 font-bold">
                        {formatNumFa(car.price)} {currency}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-bold">تماس بگیرید</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
