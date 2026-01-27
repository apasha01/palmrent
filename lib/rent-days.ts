// ✅ rent-days.ts
// محاسبه تعداد روز اجاره با "مهلت تنفس" (grace) بر حسب دقیقه
// مثال: 5 روز + 1 ساعت و 31 دقیقه => 6 روز (چون 91 دقیقه > 90)

export type JalaliToDateFn = (jy: number, jmZeroBased: number, jd: number) => Date

export function toEnglishDigits(input: string) {
  const fa = "۰۱۲۳۴۵۶۷۸۹"
  const ar = "٠١٢٣٤٥٦٧٨٩"
  const en = "0123456789"

  return String(input)
    .split("")
    .map((ch) => {
      const iFa = fa.indexOf(ch)
      if (iFa !== -1) return en[iFa]
      const iAr = ar.indexOf(ch)
      if (iAr !== -1) return en[iAr]
      return ch
    })
    .join("")
}

export function normalizeJalaliString(s?: string | null) {
  return toEnglishDigits(String(s ?? "")).replace(/-/g, "/").trim()
}

/**
 * ✅ normalizeTime
 * ورودی‌های مثل "1:3" => "01:03"
 * اگر null/بدفرم => "10:00"
 */
export function normalizeTime(t?: string | null, fallback = "10:00") {
  const raw = toEnglishDigits(String(t ?? "")).trim()
  if (!raw) return fallback

  const m = raw.match(/^(\d{1,2}):(\d{1,2})$/)
  if (!m) return fallback

  const hh = Math.min(23, Math.max(0, Number(m[1])))
  const mm = Math.min(59, Math.max(0, Number(m[2])))

  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return fallback
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
}

function parseJalaliToDate(jalali?: string | null, jalaliToDate?: JalaliToDateFn) {
  if (!jalali || !jalaliToDate) return null
  const clean = normalizeJalaliString(jalali)
  const [y, m, d] = clean.split("/").map((x) => parseInt(x, 10))
  if (!y || !m || !d) return null
  return jalaliToDate(y, m - 1, d)
}

/**
 * ✅ calcRentDaysWithGrace
 * - اختلاف دقیقه‌ای بین (fromDate+deliveryTime) و (toDate+returnTime)
 * - fullDays = floor(totalMinutes/1440)
 * - remainder = totalMinutes % 1440
 * - اگر remainder > graceMinutes => یک روز اضافه
 *
 * نکته: شرط دقیق شما "اگر یک دقیقه بیشتر شد، یک روز اضافه"
 * یعنی remainderMinutes > graceMinutes
 */
export function calcRentDaysWithGrace(args: {
  fromDateJalali: string | null
  toDateJalali: string | null
  deliveryTime?: string | null
  returnTime?: string | null
  graceMinutes?: number
  jalaliToDate: JalaliToDateFn
}) {
  const grace = typeof args.graceMinutes === "number" ? args.graceMinutes : 90

  const fromDate = parseJalaliToDate(args.fromDateJalali, args.jalaliToDate)
  const toDate = parseJalaliToDate(args.toDateJalali, args.jalaliToDate)
  if (!fromDate || !toDate) return 1

  const dt = normalizeTime(args.deliveryTime, "10:00")
  const rt = normalizeTime(args.returnTime, "10:00")

  const [dh, dm] = dt.split(":").map((x) => parseInt(x, 10))
  const [rh, rm] = rt.split(":").map((x) => parseInt(x, 10))

  const from = new Date(fromDate)
  from.setHours(dh || 0, dm || 0, 0, 0)

  const to = new Date(toDate)
  to.setHours(rh || 0, rm || 0, 0, 0)

  let totalMinutes = Math.floor((to.getTime() - from.getTime()) / 60000)
  if (!Number.isFinite(totalMinutes) || totalMinutes < 0) totalMinutes = 0

  const fullDays = Math.floor(totalMinutes / 1440)
  const remainderMinutes = totalMinutes % 1440

  let days = fullDays
  if (remainderMinutes > grace) days += 1
  if (days < 1) days = 1

  return days
}
