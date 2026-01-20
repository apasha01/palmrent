"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactCountryFlag from "react-country-flag";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flagCode: string;
}

const languages: Language[] = [
  { code: "fa", name: "Persian", nativeName: "فارسی", flagCode: "ir" },
  { code: "en", name: "English", nativeName: "English", flagCode: "gb" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flagCode: "ae" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flagCode: "tr" },
];

const locales = ["fa", "en", "ar", "tr"];

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentLang, setCurrentLang] = useState("fa");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const currentLocale =
      locales.find((l) => pathname.startsWith(`/${l}`)) || "fa";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentLang(currentLocale);
  }, [pathname]);

  function changeLanguageHandler(lang: string) {
    let newPath = pathname;

    for (const l of locales) {
      if (newPath.startsWith(`/${l}/`) || newPath === `/${l}`) {
        newPath = newPath.replace(`/${l}`, "") || "/";
        break;
      }
    }

    const currentParams = searchParams.toString();
    const fullPath = `/${lang}${newPath}${currentParams ? `?${currentParams}` : ""}`;

    router.push(fullPath, { scroll: false });
    setOpen(false);
  }

  const currentLanguage =
    languages.find((l) => l.code === currentLang) || languages[0];

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-border/50 bg-background/80  hover:bg-accent/80"
        >
          <ReactCountryFlag svg countryCode={currentLanguage.flagCode} />

          <span className="hidden sm:inline text-sm font-medium">
            {currentLanguage.nativeName}
          </span>
        </Button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[85vh] ">
        <div className="mx-auto w-full max-w-md">
          <DrawerTitle className="text-xl"></DrawerTitle>

          <div className="p-4 pt-6">
            <div className="grid gap-2">
              {languages.map((language) => {
                const isSelected = currentLang === language.code;
                return (
                  <DrawerClose asChild key={language.code}>
                    <button
                      onClick={() => changeLanguageHandler(language.code)}
                      className={cn(
                        "group relative flex w-full items-center gap-4 rounded-xl p-4 text-left ",
                        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                        isSelected
                          ? "bg-primary/5 border-2 border-primary/20"
                          : "border border-border/50 hover:border-border",
                      )}
                    >
                      {/* Flag */}
                      <div
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-full text-2xl transition-transform duration-200",
                         
                          isSelected && "bg-primary/10",
                        )}
                      >
                        <ReactCountryFlag svg countryCode={language.flagCode} />
                      </div>

                      {/* Text Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "font-semibold text-foreground",
                            isSelected && "text-primary",
                          )}
                        >
                          {language.nativeName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {language.name}
                        </p>
                      </div>

                      {/* Check Icon */}
                      <div
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "text-transparent group-hover:bg-accent",
                        )}
                      >
                        <Check className="h-4 w-4" />
                      </div>
                    </button>
                  </DrawerClose>
                );
              })}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
