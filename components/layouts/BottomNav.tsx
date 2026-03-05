/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Home, Inbox, SquaresExclude, UserCircle2 } from "lucide-react"

// ✅ از next-intl navigation خودت استفاده کن
import { Link, usePathname } from "@/i18n/navigation"

type MatchMode = "exact" | "prefix"

const LOCALES = ["en", "ar", "fa", "tr"] as const

function stripLocale(pathname: string) {
  // remove query/hash (just in case)
  const p = pathname.split("?")[0].split("#")[0]

  // normalize trailing slash (except root)
  const clean = (x: string) => (x !== "/" ? x.replace(/\/+$/, "") : "/")
  const pp = clean(p)

  // if begins with /en or /fa ...
  const parts = pp.split("/")
  // parts[0] = "" , parts[1] = possible locale
  const maybeLocale = parts[1]

  if (maybeLocale && (LOCALES as readonly string[]).includes(maybeLocale)) {
    const rest = "/" + parts.slice(2).join("/")
    return clean(rest === "/" ? "/" : rest)
  }

  return pp
}

function isActivePath(cleanPathname: string, href: string, mode: MatchMode) {
  const clean = (x: string) => (x !== "/" ? x.replace(/\/+$/, "") : "/")
  const p = clean(cleanPathname)
  const h = clean(href)

  if (mode === "exact") return p === h
  return p === h || p.startsWith(h + "/")
}

const items: Array<{
  href: string
  label: string
  icon: any
  iconSolid: any
  match?: MatchMode
}> = [
  // ✅ روی موبایل معمولاً بهتره home دقیق باشه
  { href: "/", label: "جستجو", icon: Home, iconSolid: Home, match: "exact" },

  { href: "/cars-rent", label: "اجاره خودرو", icon: SquaresExclude, iconSolid: SquaresExclude, match: "prefix" },

  // ✅ رزروهای من
  { href: "/profile/myReserve", label: "رزروهای من", icon: Inbox, iconSolid: Inbox, match: "prefix" },

  // ✅ پروفایل فقط دقیقاً /profile
  { href: "/profile", label: "پروفایل", icon: UserCircle2, iconSolid: UserCircle2, match: "exact" },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [tapped, setTapped] = useState<string | null>(null)

  function handleTap(href: string) {
    setTapped(href)
    setTimeout(() => setTapped(null), 250)
  }

  const cleanPathname = useMemo(() => stripLocale(pathname), [pathname])

  const activeHref = useMemo(() => {
    // ✅ فقط یکی active بشه: اولویت با مسیر طولانی‌تر
    const sorted = [...items].sort((a, b) => b.href.length - a.href.length)
    const found = sorted.find((it) => isActivePath(cleanPathname, it.href, it.match ?? "prefix"))
    return found?.href ?? null
  }, [cleanPathname])

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40",
        "bg-white/90 dark:bg-gray-950/90",
        "backdrop-blur-md",
        "border-t border-gray-100 dark:border-gray-800",
        "sm:hidden"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto max-w-md px-2">
        <div className="flex items-center justify-between py-1 gap-1">
          {items.map((it) => {
            const active = activeHref === it.href
            const isTapped = tapped === it.href

            const IconOutline = it.icon
            const IconSolid = it.iconSolid

            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => handleTap(it.href)}
                className="relative flex flex-col items-center justify-center flex-1 py-1 select-none outline-none"
                aria-label={it.label}
                aria-current={active ? "page" : undefined}
              >
                {/* icon */}
                <span
                  className={cn(
                    "relative z-10 flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200",
                    active ? "text-blue-600 dark:text-blue-400 scale-110" : "text-gray-400 dark:text-gray-500",
                    isTapped && "scale-90"
                  )}
                >
                  {active ? (
                    <IconSolid className="size-5.5" />
                  ) : (
                    <IconOutline className="size-5.5 stroke-[1.8]" />
                  )}
                </span>

                {/* label */}
                <span
                  className={cn(
                    "relative z-10 text-[10px] leading-none font-medium transition-all duration-200",
                    active ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
                  )}
                >
                  {it.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}