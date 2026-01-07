import jalaali from "jalaali-js"

export type CalendarType = "jalali" | "gregorian"

export const persianNumbers = (str: string | number) => str.toString().replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d])

export const jalaliMonthNames = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
]

export const weekDaysJalali = ["ش", "ی", "د", "س", "چ", "پ", "ج"]
export const weekDaysGregorian = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export const getDaysInMonth = (year: number, month: number, type: CalendarType) => {
  if (type === "gregorian") {
    return new Date(year, month + 1, 0).getDate()
  }

  if (month < 6) return 31
  if (month < 11) return 30
  return jalaali.isLeapJalaaliYear(year) ? 30 : 29
}

export const jalaliToDate = (jy: number, jm: number, jd: number) => {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm + 1, jd)
  return new Date(gy, gm - 1, gd)
}

export const getJalaliParts = (date: Date) => {
  const { jy, jm, jd } = jalaali.toJalaali(date)
  return { year: jy, month: jm - 1, day: jd }
}

export const formatJalaliDate = (date: Date) => {
  const { jy, jm, jd } = jalaali.toJalaali(date)
  const year = persianNumbers(jy)
  const month = persianNumbers(jm.toString().padStart(2, "0"))
  const day = persianNumbers(jd.toString().padStart(2, "0"))
  return `${year}/${month}/${day}`
}

export const formatGregorianDate = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}/${month}/${day}`
}
