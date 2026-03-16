/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import { changeIsHeaderClose } from "@/redux/slices/globalSlice";
import { useTranslations, useLocale } from "next-intl";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBranches } from "@/services/branches/branches.queries";
import LoginDialog from "../auth/login-dialog";
import LanguageSwitcher from "../LanguagesSwitcher";
import { Spinner } from "../ui/spinner";

import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";

import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { Link } from "@/i18n/navigation";

export const SITE_HEADER_HEIGHT = 64;

export default function Header({ shadowLess = false }: { shadowLess?: boolean }) {
  const locale = useLocale();
  const pathname = usePathname();

  const [menuToggle, setMenuToggle] = useState(false);
  const [disableTransition, setDisableTransition] = useState(false);

  const dispatch = useDispatch();

  const isHeaderClose = useSelector((state: any) => state.global.isHeaderClose);
  const isAnySheetOpen = useSearchPageStore((s) => s.isAnySheetOpen);

  const setIsHeaderClose = (st: boolean) => dispatch(changeIsHeaderClose(st));

  // وقتی Sheet یا منو بازه، auto-hide خاموش
  const disableAutoHide = isAnySheetOpen || menuToggle;

  // Smooth auto-hide logic — STALE STATE SAFE
  const lastYRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const downAccRef = useRef(0);
  const upAccRef = useRef(0);

  const MIN_Y_BEFORE_HIDE = 100;
  const HIDE_AFTER_DOWN_PX = 12;
  const SHOW_AFTER_UP_PX = 8;
  const DEADZONE = 1;

  // refs برای جلوگیری از stale closure
  const isHeaderCloseRef = useRef(isHeaderClose);
  const disableAutoHideRef = useRef(disableAutoHide);

  useEffect(() => {
    isHeaderCloseRef.current = isHeaderClose;
  }, [isHeaderClose]);

  useEffect(() => {
    disableAutoHideRef.current = disableAutoHide;
  }, [disableAutoHide]);

  // هنگام تغییر صفحه:
  // 1) هدر حتما باز شود
  // 2) بدون انیمیشن باز شود
  // 3) بعد از mount دوباره transition فعال شود
  useEffect(() => {
    if (typeof window === "undefined") return;

    setDisableTransition(true);

    setIsHeaderClose(false);
    isHeaderCloseRef.current = false;

    downAccRef.current = 0;
    upAccRef.current = 0;
    lastYRef.current = window.scrollY || 0;

    setMenuToggle(false);

    let id2: number | null = null;

    const id = window.requestAnimationFrame(() => {
      id2 = window.requestAnimationFrame(() => {
        setDisableTransition(false);
      });
    });

    return () => {
      window.cancelAnimationFrame(id);
      if (id2 != null) window.cancelAnimationFrame(id2);
    };
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    lastYRef.current = window.scrollY || 0;
    downAccRef.current = 0;
    upAccRef.current = 0;

    const setHeader = (next: boolean) => {
      if (isHeaderCloseRef.current === next) return;
      isHeaderCloseRef.current = next;
      setIsHeaderClose(next);
    };

    const update = () => {
      rafRef.current = null;

      // اگر Sheet یا منو بازه، هدر همیشه باز
      if (disableAutoHideRef.current) {
        setHeader(false);
        downAccRef.current = 0;
        upAccRef.current = 0;
        lastYRef.current = window.scrollY || 0;
        return;
      }

      const y = window.scrollY || 0;
      const dy = y - lastYRef.current;

      // لرزش خیلی ریز
      if (Math.abs(dy) <= DEADZONE) {
        lastYRef.current = y;
        return;
      }

      // تا قبل 100px اصلا مخفی نکن
      if (y < MIN_Y_BEFORE_HIDE) {
        setHeader(false);
        downAccRef.current = 0;
        upAccRef.current = 0;
        lastYRef.current = y;
        return;
      }

      // رو به پایین
      if (dy > 0) {
        downAccRef.current += dy;
        upAccRef.current = 0;

        if (!isHeaderCloseRef.current && downAccRef.current >= HIDE_AFTER_DOWN_PX) {
          setHeader(true);
          downAccRef.current = 0;
        }
      }
      // رو به بالا
      else {
        upAccRef.current += Math.abs(dy);
        downAccRef.current = 0;

        if (isHeaderCloseRef.current && upAccRef.current >= SHOW_AFTER_UP_PX) {
          setHeader(false);
          upAccRef.current = 0;
        }
      }

      lastYRef.current = y;
    };

    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isHidden = !disableAutoHide && isHeaderClose;
  const headerOffsetClass = isHidden ? "-translate-y-16" : "translate-y-0";

  return (
    <header style={{ height: SITE_HEADER_HEIGHT }}>
      <div
        id="site-fixed-header"
        className={cn(
          "fixed z-50 right-0 top-0 w-full bg-white dark:bg-background",
          shadowLess ? "" : "border-b shadow-sm",
          "transform-gpu will-change-transform",
          disableTransition ? "" : "transition-transform duration-500 ease-in-out",
          headerOffsetClass
        )}
        style={{ height: SITE_HEADER_HEIGHT }}
      >
        <div className="p-4 px-3 2xl:px-6 text-xs text-muted-foreground">
          <div className="lg:w-[90vw] md:w-[90vw] max-w-300 m-auto flex justify-between">
            <div className="flex items-center gap-4">
              <Link
                className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 sm:block lg:static lg:translate-x-0 lg:translate-y-0"
                href="/"
                onClick={() => {
                  setIsHeaderClose(false);
                  isHeaderCloseRef.current = false;
                  setMenuToggle(false);
                }}
              >
                <Image
                  className="filter-[invert(1)] dark:filter-none"
                  src="/images/logo.png"
                  width={85}
                  height={38}
                  alt="palmrent logo"
                />
              </Link>

              <Sheet open={menuToggle} onOpenChange={setMenuToggle}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="z-50 h-6 w-6 p-0 hover:bg-transparent"
                  >
                    <div className="relative flex w-6 flex-col">
                      <div className="mt-1 h-1 w-full origin-center scale-y-50 bg-foreground transition-all" />
                      <div className="mt-1 h-1 w-full scale-y-50 bg-foreground transition-all" />
                      <div className="mt-1 h-1 w-full origin-center scale-y-50 bg-foreground transition-all" />
                    </div>
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>

                <SheetContent
                  side="right"
                  showCloseButton={false}
                  className="z-[999] w-75 overflow-y-auto p-0 sm:w-100"
                >
                  <SheetHeader className="sr-only">
                    <SheetTitle>Navigation Menu</SheetTitle>
                  </SheetHeader>

                  <HeaderMenu
                    locale={locale}
                    closeMenu={() => {
                      setMenuToggle(false);
                      setIsHeaderClose(false);
                      isHeaderCloseRef.current = false;
                    }}
                  />
                </SheetContent>
              </Sheet>

              <div className="w-fit sm:hidden">
                <Link
                  href="/"
                  onClick={() => {
                    setIsHeaderClose(false);
                    isHeaderCloseRef.current = false;
                    setMenuToggle(false);
                  }}
                >
                  <Image
                    src="/images/logo.png"
                    width={100}
                    height={60}
                    alt="palmrent logo"
                    className="filter-[invert(1)] dark:filter-none"
                  />
                </Link>
              </div>

              <div className="hidden lg:block">
                <HeaderMenu
                  locale={locale}
                  closeMenu={() => {
                    setIsHeaderClose(false);
                    isHeaderCloseRef.current = false;
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-3">
              <LanguageSwitcher />
              <LoginDialog />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

type HeaderMenuProps = {
  closeMenu: () => void;
  locale: string;
};

export function HeaderMenu({ closeMenu, locale }: HeaderMenuProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const [dropMenuToggle, setDropMenuToggle] = useState([false, false, false, false]);

  function toggleMenu(targetIndex: number) {
    setDropMenuToggle((prev) =>
      prev.map((item, index) => (index !== targetIndex ? false : !item))
    );
  }

  const isUnderLg = useMediaQuery("(max-width: 1023.9px)");
  const { data: branches, isLoading, isError } = useBranches(locale);

  const sortedBranches = useMemo(() => {
    if (!branches) return [];
    return [...branches].sort((a, b) => a.title.localeCompare(b.title));
  }, [branches]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDropMenuToggle([false, false, false, false]);
  }, [pathname]);

  return (
    <ul
      className={cn(
        "flex flex-col overflow-auto bg-white p-0 pt-8 dark:bg-background lg:static lg:h-auto lg:flex-row lg:overflow-visible lg:p-0 lg:pt-0",
        isUnderLg && "w-full"
      )}
    >
      <li className="flex cursor-pointer items-center underline decoration-transparent decoration-o underline-offset-8 transition-colors lg:border-l lg:border-border lg:p-1 lg:px-2 lg:hover:decoration-foreground 2xl:px-3">
        <Link
          className="h-full w-full border-b border-border p-4 text-foreground transition-colors hover:text-foreground/80 lg:border-0 lg:p-0"
          href="/"
          onClick={closeMenu}
        >
          {t("home")}
        </Link>
      </li>

      <li className="group relative flex cursor-pointer flex-wrap items-center underline decoration-transparent decoration-o underline-offset-8 lg:gap-2 lg:border-l lg:border-border lg:p-1 lg:px-2 2xl:px-3">
        <button
          type="button"
          onClick={() => toggleMenu(0)}
          className="flex w-full items-center justify-between border-b border-border p-4 text-foreground transition-colors hover:text-foreground/80 lg:gap-2 lg:border-0 lg:p-0"
        >
          {t("branches")}
          <ChevronDown className="h-4 w-4" />
        </button>

        <DropDown isActive={dropMenuToggle[0]}>
          {isLoading && (
            <li className="px-4 py-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-center">
                <Spinner />
              </div>
            </li>
          )}

          {!isLoading && isError && (
            <li className="px-4 py-2 text-sm text-destructive">Failed to load</li>
          )}

          {!isLoading && !isError && sortedBranches.length === 0 && (
            <li className="px-4 py-2 text-sm text-muted-foreground">No branches</li>
          )}

          {!isLoading &&
            !isError &&
            sortedBranches.map((b: any) => (
              <DropDownItem
                key={b.id}
                text={b.title}
                href={`/cars-rent/${b.slug}`}
                closeMenu={closeMenu}
              />
            ))}
        </DropDown>
      </li>

      <li className="flex cursor-pointer items-center underline decoration-transparent decoration-o underline-offset-8 transition-colors lg:border-l lg:border-border lg:p-1 lg:px-2 lg:hover:decoration-foreground 2xl:px-3">
        <Link
          className="h-full w-full border-b border-border p-4 text-foreground transition-colors hover:text-foreground/80 lg:border-0 lg:p-0"
          href="/documents"
          onClick={closeMenu}
        >
          {t("documents")}
        </Link>
      </li>

      <li className="group relative flex cursor-pointer flex-wrap items-center gap-2 underline decoration-transparent decoration-o underline-offset-8 lg:border-l lg:border-border lg:p-1 lg:px-2 2xl:px-3">
        <button
          type="button"
          onClick={() => toggleMenu(2)}
          className="flex w-full items-center justify-between border-b border-border p-4 text-foreground transition-colors hover:text-foreground/80 lg:gap-2 lg:border-0 lg:p-0"
        >
          {t("contactUs")}
          <ChevronDown className="h-4 w-4" />
        </button>

        <DropDown isActive={dropMenuToggle[2]}>
          <DropDownItem text={t("aboutUs")} href="/about-us" closeMenu={closeMenu} />
          <DropDownItem text={t("contactUs")} href="/contact-us" closeMenu={closeMenu} />
        </DropDown>
      </li>

      <li className="group relative flex cursor-pointer flex-wrap items-center gap-2 underline decoration-transparent decoration-o underline-offset-8 lg:p-1 lg:px-2 2xl:px-3">
        <button
          type="button"
          onClick={() => toggleMenu(3)}
          className="flex w-full items-center justify-between border-b border-border p-4 text-foreground transition-colors hover:text-foreground/80 lg:gap-2 lg:border-0 lg:p-0"
        >
          {t("more")}
          <ChevronDown className="h-4 w-4" />
        </button>

        <DropDown isActive={dropMenuToggle[3]}>
          <DropDownItem text={t("blog")} href="/blogs" closeMenu={closeMenu} />
          <DropDownItem text={t("gallery")} href="/gallery" closeMenu={closeMenu} />
          <DropDownItem text={t("commonQ")} href="/faq" closeMenu={closeMenu} />
          <DropDownItem text={t("rules")} href="/rules" closeMenu={closeMenu} />
        </DropDown>
      </li>

      {isUnderLg && <ThemeSwitchSheetItem />}
    </ul>
  );
}

function ThemeSwitchSheetItem() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = mounted ? (resolvedTheme ?? theme) === "dark" : false;

  return (
    <li className="px-2 pb-2">
      <div className="flex h-11 items-center justify-between rounded-lg px-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground/90">
            {isDark ? "حالت شب" : "حالت روز"}
          </span>
        </div>
        <Switch
          dir="ltr"
          checked={!!isDark}
          onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          disabled={!mounted}
        />
      </div>
    </li>
  );
}

export function DropDown({
  children,
  isActive,
}: {
  children: React.ReactNode;
  isActive: boolean;
}) {
  const isUnderLg = useMediaQuery("(max-width: 1023.9px)");

  return (
    <div className="bottom-0 left-1/2 w-full min-w-32 animate-fade-in lg:absolute lg:hidden lg:w-auto lg:-translate-x-1/2 lg:translate-y-full lg:pt-2 lg:group-hover:flex">
      <ul
        className={cn(
          "flex min-w-32 flex-col overflow-hidden rounded-lg bg-popover transition-all lg:border lg:border-border lg:shadow-lg",
          isUnderLg ? (isActive ? "max-h-125 py-2" : "max-h-0") : "py-2"
        )}
      >
        {children}
      </ul>
    </div>
  );
}

export function DropDownItem({
  text,
  href,
  closeMenu,
}: {
  text: string;
  href: string;
  closeMenu: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={closeMenu}
      className="border-b p-3 px-4 text-nowrap text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground last:border-b-0 lg:rounded-lg lg:border-b-0"
    >
      {text}
    </Link>
  );
}