"use client"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, Globe, Phone } from "lucide-react"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { changeIsHeaderClose, changeIsTranslatePopupOpen } from "@/redux/slices/globalSlice"
import LanguageCurrencyPopup from "./LanguageCurrencyPopup"
import { useTranslations } from "next-intl"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import LoginPage from "./auth/login-dialog"
import ThemeSwitcher from "./layouts/ThemeSwitcher"

export default function Header({ shadowLess = false }) {
  const t = useTranslations()
  const [menuToggle, setMenuToggle] = useState(false)
  const dispatch = useDispatch()
  const isHeaderClose = useSelector((state) => state.global.isHeaderClose)
  const isTranslateOpen = useSelector((state) => state.global.isTranslatePopupOpen)
  function setIsHeaderClose(st) {
    dispatch(changeIsHeaderClose(st))
  }

  useEffect(() => {
    let lastScrollTop = 0

    const handleScroll = () => {
      const currentScroll = window.scrollY
      if (currentScroll < 100) {
        setIsHeaderClose(false)
      } else {
        if (currentScroll > lastScrollTop) {
          setIsHeaderClose(true)
        } else if (currentScroll < lastScrollTop) {
          setIsHeaderClose(false)
        }
      }

      lastScrollTop = currentScroll <= 0 ? 0 : currentScroll
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  function openTranslatePopup() {
    dispatch(changeIsTranslatePopupOpen(true))
  }
  return (
    <>
<header className={`min-h-16 flex items-center`}>
  <div
    className={cn(
      "p-4 px-3 2xl:px-6 text-xs text-muted-foreground duration-500 fixed z-50 transition-all right-0 w-full bg-white dark:bg-background",
      shadowLess ? "" : "border-b shadow-sm",
      isHeaderClose ? "-top-16" : "top-0",
    )}
  >

  
          <div className="lg:w-[90vw] md:w-[90vw] max-w-300 m-auto flex justify-between">
            <div className="flex items-center gap-4">
              <Link
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:translate-x-0 lg:translate-y-0 lg:static hidden sm:block"
                href="/"
              >
                <Image className="" src={"/images/logo.png"} width={85} height={38} alt="palmrent logo" />
              </Link>

              <Sheet open={menuToggle} onOpenChange={setMenuToggle}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon" className="z-50 p-0 w-6 h-6 hover:bg-transparent">
                    <div className="flex flex-col w-6 relative">
                      <div className={cn("h-1 scale-y-50 mt-1 transition-all w-full origin-center bg-foreground")} />
                      <div className={cn("h-1 scale-y-50 mt-1 transition-all w-full bg-foreground")} />
                      <div className={cn("h-1 scale-y-50 mt-1 transition-all w-full origin-center bg-foreground")} />
                    </div>
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-75 sm:w-100 overflow-y-auto p-0">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Navigation Menu</SheetTitle>
                  </SheetHeader>
                  <HeaderMenu isActive={true} closeMenu={() => setMenuToggle(false)} />
                </SheetContent>
              </Sheet>

              <div className="dark:invert z-50 w-fit sm:hidden">
                <Image src={"/images/logo.png"} width={120} height={75} alt="palmrent logo" />
              </div>

              <div className="hidden lg:block">
                <HeaderMenu isActive={false} closeMenu={() => {}} />
              </div>

              <ThemeSwitcher/>
            </div>
            <div className="flex items-center gap-2 lg:gap-3">
              <Button variant="ghost" size="icon" asChild className="h-9 w-9">
                <Link href="tel:+989211284055">
                  <Phone />
                  <span className="sr-only">Phone</span>
                </Link>
              </Button>
              <Button variant="ghost" onClick={openTranslatePopup} className="gap-1.5 px-2 lg:px-3 h-9">
                <Globe  />
                <span className="hidden xl:inline">{t("language")}</span>
              </Button>
     
              <LoginPage />
            </div>
          </div>
        </div>
      </header>
      {isTranslateOpen && <LanguageCurrencyPopup />}
    </>
  )
}

export function HeaderMenu({ closeMenu }) {
  const t = useTranslations()
  const [dropMenuToggle, setDropMenuToggle] = useState([false, false, false, false])
  function toggleMenu(targetIndex) {
    setDropMenuToggle(
      dropMenuToggle.map((item, index) => {
        if (index != targetIndex) {
          return false
        } else {
          return !item
        }
      }),
    )
  }
  const isUnderLg = useMediaQuery("(max-width: 1023.9px)")
  return (
    <ul
      className={cn(
     "lg:static pt-8 lg:pt-0 lg:h-auto lg:flex-row flex-col flex p-0 lg:p-0 overflow-auto lg:overflow-visible bg-white dark:bg-background",
   isUnderLg && "w-full",
      )}
    >
      <li className="lg:p-1 lg:px-2 2xl:px-3 lg:border-l border-border underline decoration-transparent decoration-o cursor-pointer underline-offset-8 flex items-center lg:hover:decoration-foreground transition-colors">
        <Link
          className="h-full w-full lg:border-0 border-b border-border lg:p-0 p-4 text-foreground hover:text-foreground/80 transition-colors"
          href="/"
          onClick={closeMenu}
        >
          {t("home")}
        </Link>
      </li>
      <li className="relative group lg:p-1 lg:px-2 2xl:px-3 lg:border-l border-border underline decoration-transparent decoration-o cursor-pointer underline-offset-8 flex items-center lg:gap-2 flex-wrap">
        <div
          onClick={() => toggleMenu(0)}
          className="flex items-center justify-between w-full lg:gap-2 lg:border-0 border-b border-border lg:p-0 p-4 text-foreground hover:text-foreground/80 transition-colors"
        >
          {t("branches")}
          <ChevronDown className="h-4 w-4" />
        </div>
        <DropDown isActive={dropMenuToggle[0]} closeMenu={closeMenu}>
          <DropDownItem text={t("dubai")} href={"/cars-rent/dubai"} closeMenu={closeMenu} />
          <DropDownItem text={t("istanbul")} href={"/cars-rent/istanbul"} closeMenu={closeMenu} />
          <DropDownItem text={t("oman")} href={"/cars-rent/oman"} closeMenu={closeMenu} />
          <DropDownItem text={t("kish")} href={"/cars-rent/kish"} closeMenu={closeMenu} />
          <DropDownItem text={t("izmir")} href={"/cars-rent/izmir"} closeMenu={closeMenu} />
          <DropDownItem text={t("ankara")} href={"/cars-rent/ankara"} closeMenu={closeMenu} />
          <DropDownItem text={t("antalya")} href={"/cars-rent/antalya"} closeMenu={closeMenu} />
          <DropDownItem text={t("samsun")} href={"/cars-rent/samsun"} closeMenu={closeMenu} />
          <DropDownItem text={t("kayseri")} href={"/cars-rent/kayseri"} closeMenu={closeMenu} />
          <DropDownItem text={t("georgia")} href={"/cars-rent/georgia"} closeMenu={closeMenu} />
        </DropDown>
      </li>
      <li className="relative group lg:p-1 lg:px-2 2xl:px-3 lg:border-l border-border underline decoration-transparent decoration-o cursor-pointer underline-offset-8 flex items-center gap-2 flex-wrap">
        <div
          onClick={() => toggleMenu(1)}
          className="flex items-center justify-between w-full lg:gap-2 lg:border-0 border-b border-border lg:p-0 p-4 text-foreground hover:text-foreground/80 transition-colors"
        >
          {t("carList")}
          <ChevronDown className="h-4 w-4" />
        </div>
        <DropDown isActive={dropMenuToggle[1]} closeMenu={closeMenu}>
          <DropDownItem text={t("dubai")} href={"/cars-list/dubai"} closeMenu={closeMenu} />
          <DropDownItem text={t("istanbul")} href={"/cars-list/istanbul"} closeMenu={closeMenu} />
          <DropDownItem text={t("oman")} href={"/cars-list/oman"} closeMenu={closeMenu} />
          <DropDownItem text={t("kish")} href={"/cars-list/kish"} closeMenu={closeMenu} />
          <DropDownItem text={t("izmir")} href={"/cars-list/izmir"} closeMenu={closeMenu} />
          <DropDownItem text={t("ankara")} href={"/cars-list/ankara"} closeMenu={closeMenu} />
          <DropDownItem text={t("antalya")} href={"/cars-list/antalya"} closeMenu={closeMenu} />
          <DropDownItem text={t("samsun")} href={"/cars-list/samsun"} closeMenu={closeMenu} />
          <DropDownItem text={t("kayseri")} href={"/cars-list/kayseri"} closeMenu={closeMenu} />
          <DropDownItem text={t("georgia")} href={"/cars-list/georgia"} closeMenu={closeMenu} />
        </DropDown>
      </li>
      <li className="lg:p-1 lg:px-2 2xl:px-3 lg:border-l border-border underline decoration-transparent decoration-o cursor-pointer underline-offset-8 flex items-center lg:hover:decoration-foreground transition-colors">
        <Link
          className="h-full w-full lg:border-0 border-b border-border lg:p-0 p-4 text-foreground hover:text-foreground/80 transition-colors"
          href="/documents"
          onClick={closeMenu}
        >
          {t("documents")}
        </Link>
      </li>
     
      <li className="relative group lg:p-1 lg:px-2 2xl:px-3 lg:border-l border-border underline decoration-transparent decoration-o cursor-pointer underline-offset-8 flex items-center gap-2 flex-wrap">
        <div
          onClick={() => toggleMenu(2)}
          className="flex items-center justify-between w-full lg:gap-2 lg:border-0 border-b border-border lg:p-0 p-4 text-foreground hover:text-foreground/80 transition-colors"
        >
          {t("contactUs")}
          <ChevronDown className="h-4 w-4" />
        </div>
        <DropDown isActive={dropMenuToggle[2]} closeMenu={closeMenu}>
          <DropDownItem text={t("aboutUs")} href={"/about-us"} closeMenu={closeMenu} />
          <DropDownItem text={t("contactUs")} href={"/contact-us"} closeMenu={closeMenu} />
        </DropDown>
      </li>
      <li className="relative group lg:p-1 lg:px-2 2xl:px-3 underline decoration-transparent decoration-o cursor-pointer underline-offset-8 flex items-center gap-2 flex-wrap">
        <div
          onClick={() => toggleMenu(3)}
          className="flex items-center justify-between w-full lg:gap-2 lg:border-0 border-b border-border lg:p-0 p-4 text-foreground hover:text-foreground/80 transition-colors"
        >
          {t("more")}
          <ChevronDown className="h-4 w-4" />
        </div>
        <DropDown isActive={dropMenuToggle[3]} closeMenu={closeMenu}>
          <DropDownItem text={t("blog")} href={"/blogs"} closeMenu={closeMenu} />
          <DropDownItem text={t("gallery")} href={"/gallery"} closeMenu={closeMenu} />
          <DropDownItem text={t("commonQ")} href={"/faq"} closeMenu={closeMenu} />
          <DropDownItem text={t("rules")} href={"/rules"} closeMenu={closeMenu} />
        </DropDown>
      </li>
    </ul>
  )
}

export function DropDown({ children, isActive, closeMenu }) {
  const isUnderLg = useMediaQuery("(max-width: 1023.9px)")
  return (
    <div className="lg:absolute lg:hidden min-w-32 lg:w-auto w-full animate-fade-in lg:translate-y-full lg:group-hover:flex bottom-0 left-1/2 lg:-translate-x-1/2 lg:pt-2">
      <ul
        className={cn(
          "flex transition-all overflow-hidden flex-col min-w-32 rounded-lg lg:border border-border lg:shadow-lg bg-popover",
          isUnderLg ? (isActive ? "max-h-[500px] py-2" : "max-h-0") : "py-2",
        )}
      >
        {children}
      </ul>
    </div>
  )
}

export function DropDownItem({ text, href, closeMenu }) {
  return (
    <Link
      href={href}
      onClick={closeMenu}
      className="text-popover-foreground hover:bg-accent hover:text-accent-foreground p-3 px-4 text-nowrap border-b last:border-b-0 lg:border-b-0 lg:rounded-lg transition-colors"
    >
      {text}
    </Link>
  )
}
