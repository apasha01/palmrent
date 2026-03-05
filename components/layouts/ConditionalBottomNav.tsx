"use client"

import { usePathname } from "next/navigation"
import BottomNav from "./BottomNav"

// زبان‌های پروژه
const LOCALES = ["en", "fa", "ar", "tr"]

// مسیرهایی که bottom nav باید نمایش داده شود
const ALLOW = ["/", "/cars-rent", "/profile", "/profile/myReserve", "/search", "/favorites", "/rent"]

function removeLocalePrefix(pathname: string) {
  const parts = pathname.split("/")

  // مثال: /en/profile
  if (parts.length > 1 && LOCALES.includes(parts[1])) {
    const newPath = "/" + parts.slice(2).join("/")
    return newPath === "/" ? "/" : newPath.replace(/\/$/, "")
  }

  return pathname === "/" ? "/" : pathname.replace(/\/$/, "")
}

export default function ConditionalBottomNav() {
  const pathname = usePathname()

  // حذف زبان
  const cleanPath = removeLocalePrefix(pathname)

  const ok = ALLOW.some((p) => cleanPath === p || cleanPath.startsWith(p + "/"))

  if (!ok) return null

  return <BottomNav />
}