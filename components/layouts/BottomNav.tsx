/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Home, Inbox, SquaresExclude, UserCircle2 } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type MatchMode = "exact" | "prefix";

const LOCALES = ["en", "ar", "fa", "tr"] as const;

function stripLocale(pathname: string) {
  const p = pathname.split("?")[0].split("#")[0];

  const clean = (x: string) => (x !== "/" ? x.replace(/\/+$/, "") : "/");
  const pp = clean(p);

  const parts = pp.split("/");
  const maybeLocale = parts[1];

  if (maybeLocale && (LOCALES as readonly string[]).includes(maybeLocale)) {
    const rest = "/" + parts.slice(2).join("/");
    return clean(rest === "/" ? "/" : rest);
  }

  return pp;
}

function isActivePath(cleanPathname: string, href: string, mode: MatchMode) {
  const clean = (x: string) => (x !== "/" ? x.replace(/\/+$/, "") : "/");
  const p = clean(cleanPathname);
  const h = clean(href);

  if (mode === "exact") return p === h;
  return p === h || p.startsWith(h + "/");
}

export default function BottomNav() {
  const t = useTranslations("BottomNav");
  const pathname = usePathname();
  const [tapped, setTapped] = useState<string | null>(null);

  function handleTap(href: string) {
    setTapped(href);
    setTimeout(() => setTapped(null), 250);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const items: Array<{
    href: string;
    label: string;
    ariaLabel: string;
    icon: any;
    iconSolid: any;
    match?: MatchMode;
  }> = [
    {
      href: "/",
      label: t("search"),
      ariaLabel: t("searchAria"),
      icon: Home,
      iconSolid: Home,
      match: "exact",
    },
    {
      href: "/cars-rent",
      label: t("rentCar"),
      ariaLabel: t("rentCarAria"),
      icon: SquaresExclude,
      iconSolid: SquaresExclude,
      match: "prefix",
    },
    {
      href: "/profile/myReserve",
      label: t("myReserves"),
      ariaLabel: t("myReservesAria"),
      icon: Inbox,
      iconSolid: Inbox,
      match: "prefix",
    },
    {
      href: "/profile",
      label: t("profile"),
      ariaLabel: t("profileAria"),
      icon: UserCircle2,
      iconSolid: UserCircle2,
      match: "exact",
    },
  ];

  const cleanPathname = useMemo(() => stripLocale(pathname), [pathname]);

  const activeHref = useMemo(() => {
    const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
    const found = sorted.find((it) =>
      isActivePath(cleanPathname, it.href, it.match ?? "prefix")
    );
    return found?.href ?? null;
  }, [cleanPathname, items]);

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40",
        "border-t border-gray-100 bg-white/90 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/90",
        "sm:hidden"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label={t("navAria")}
    >
      <div className="mx-auto max-w-md px-2">
        <div className="flex items-center justify-between gap-1 py-1">
          {items.map((it) => {
            const active = activeHref === it.href;
            const isTapped = tapped === it.href;

            const IconOutline = it.icon;
            const IconSolid = it.iconSolid;

            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => handleTap(it.href)}
                className="relative flex flex-1 select-none flex-col items-center justify-center py-1 outline-none"
                aria-label={it.ariaLabel}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "relative z-10 flex h-8 w-10 items-center justify-center rounded-xl transition-all duration-200",
                    active
                      ? "scale-110 text-blue-600 dark:text-blue-400"
                      : "text-gray-400 dark:text-gray-500",
                    isTapped && "scale-90"
                  )}
                >
                  {active ? (
                    <IconSolid className="size-5.5" />
                  ) : (
                    <IconOutline className="size-5.5 stroke-[1.8]" />
                  )}
                </span>

                <span
                  className={cn(
                    "relative z-10 text-[10px] font-medium leading-none transition-all duration-200",
                    active
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-400 dark:text-gray-500"
                  )}
                >
                  {it.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}