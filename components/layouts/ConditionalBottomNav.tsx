"use client"

import { usePathname } from "next/navigation"
import BottomNav from "./BottomNav"

const LOCALES = ["en", "fa", "ar", "tr"]
const ALLOW = ["/", "/cars-rent", "/profile", "/profile/myReserve"]

function removeLocalePrefix(pathname: string) {
  const parts = pathname.split("/")

  if (parts.length > 1 && LOCALES.includes(parts[1])) {
    const newPath = "/" + parts.slice(2).join("/")
    return newPath === "/" ? "/" : newPath.replace(/\/$/, "")
  }

  return pathname === "/" ? "/" : pathname.replace(/\/$/, "")
}

export default function ConditionalBottomNav() {
  const pathname = usePathname()
  const cleanPath = removeLocalePrefix(pathname)

  const ok = ALLOW.includes(cleanPath)

  if (!ok) return null

  return <BottomNav />
}