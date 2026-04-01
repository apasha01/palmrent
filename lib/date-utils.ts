import jalaali from "jalaali-js";

export type CalendarType = "jalali" | "gregorian";

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
];

export const weekDaysJalali = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
export const weekDaysGregorian = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** همه تاریخ‌ها روی ظهر قفل میشن تا مشکل timezone / DST نداشته باشیم */
export const atNoon = (d: Date) => {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
};

export const getDaysInMonth = (year: number, month: number, type: CalendarType) => {
  if (type === "gregorian") {
    return new Date(year, month + 1, 0).getDate();
  }

  if (month < 6) return 31;
  if (month < 11) return 30;
  return jalaali.isLeapJalaaliYear(year) ? 30 : 29;
};

export const jalaliToDate = (jy: number, jm: number, jd: number) => {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm + 1, jd);
  return atNoon(new Date(gy, gm - 1, gd));
};

export const getJalaliParts = (date: Date) => {
  const safe = atNoon(date);
  const { jy, jm, jd } = jalaali.toJalaali(safe);

  return {
    year: jy,
    month: jm - 1,
    day: jd,
  };
};

export const formatJalaliDate = (date: Date) => {
  const safe = atNoon(date);
  const { jy, jm, jd } = jalaali.toJalaali(safe);

  const year = String(jy);
  const month = String(jm).padStart(2, "0");
  const day = String(jd).padStart(2, "0");

  return `${year}/${month}/${day}`;
};

export const formatGregorianDate = (date: Date) => {
  const safe = atNoon(date);

  const year = String(safe.getFullYear());
  const month = String(safe.getMonth() + 1).padStart(2, "0");
  const day = String(safe.getDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
};

export const isSameDay = (a?: Date | null, b?: Date | null) => {
  if (!a || !b) return false;

  const A = atNoon(a);
  const B = atNoon(b);

  return (
    A.getFullYear() === B.getFullYear() &&
    A.getMonth() === B.getMonth() &&
    A.getDate() === B.getDate()
  );
};

export const isTodayDate = (date: Date) => {
  return isSameDay(date, new Date());
};

export const isPastDay = (date: Date) => {
  const d = atNoon(date).getTime();
  const today = atNoon(new Date()).getTime();

  return d < today;
};

export const isFutureDay = (date: Date) => {
  const d = atNoon(date).getTime();
  const today = atNoon(new Date()).getTime();

  return d > today;
};

export const isBeforeDay = (a: Date, b: Date) => {
  return atNoon(a).getTime() < atNoon(b).getTime();
};

export const isAfterDay = (a: Date, b: Date) => {
  return atNoon(a).getTime() > atNoon(b).getTime();
};

export const isGteDay = (a: Date, b: Date) => {
  return atNoon(a).getTime() >= atNoon(b).getTime();
};

export const isLteDay = (a: Date, b: Date) => {
  return atNoon(a).getTime() <= atNoon(b).getTime();
};

export const getRangeDaysCount = (start: Date, end: Date) => {
  const s = atNoon(start).getTime();
  const e = atNoon(end).getTime();

  if (e < s) return 0;

  // inclusive
  return Math.floor((e - s) / 86400000) + 1;
};

export const clampTimeString = (value?: string | null, fallback = "10:00") => {
  const s = String(value ?? "").trim();
  if (!s) return fallback;

  const m = s.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return fallback;

  const hh = String(Math.min(23, Math.max(0, Number(m[1])))).padStart(2, "0");
  const mm = String(Math.min(59, Math.max(0, Number(m[2])))).padStart(2, "0");

  return `${hh}:${mm}`;
};