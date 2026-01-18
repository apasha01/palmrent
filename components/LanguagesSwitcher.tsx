"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const languages = [
  { code: "fa", name: "فارسی", flag: "🇮🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
]

const locales = ["fa", "en", "ar", "tr"]

export default function LanguageSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentLang, setCurrentLang] = useState("fa")

  useEffect(() => {
    const currentLocale = locales.find((l) => pathname.startsWith(`/${l}`)) || "fa"
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentLang(currentLocale)
  }, [pathname])

  function changeLanguageHandler(lang: string) {
    let newPath = pathname

    // حذف زبان فعلی از مسیر
    for (const l of locales) {
      if (newPath.startsWith(`/${l}/`) || newPath === `/${l}`) {
        newPath = newPath.replace(`/${l}`, "") || "/"
        break
      }
    }

    // حفظ query string فعلی
    const currentParams = searchParams.toString()
    const fullPath = `/${lang}${newPath}${currentParams ? `?${currentParams}` : ""}`

    router.push(fullPath, { scroll: false })
  }

  const currentLanguage = languages.find((l) => l.code === currentLang) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <span className="text-lg">{currentLanguage.flag}</span>
          <span className="hidden sm:inline">{currentLanguage.name}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguageHandler(language.code)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{language.flag}</span>
              <span>{language.name}</span>
            </div>
            {currentLang === language.code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
