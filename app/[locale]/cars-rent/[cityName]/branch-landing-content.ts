import React from "react";

export type BranchLandingResolvedContent = {
  heroTitle: React.ReactNode;
  heroSubtitle1: React.ReactNode;
  heroSubtitle2: React.ReactNode;
};

type BranchLandingStaticItem = {
  heroTitle: string;
  heroSubtitle1: string;
  heroSubtitle2: string;
};

type BranchLandingLocaleMap = Record<string, BranchLandingStaticItem>;
type BranchLandingContentMap = Record<string, BranchLandingLocaleMap>;

const branchLandingStaticContent: BranchLandingContentMap = {
  dubai: {
    fa: {
      heroTitle: "اجاره خودرو در دبی",
      heroSubtitle1:
        "کرایه ماشین در دبی با قیمت شفاف و تحویل رایگان فرودگاهی.",
      heroSubtitle2:
        "خودروهای پالم رنت را ببینید و بدون ودیعه و ضمانت رزرو کنید.",
    },
    en: {
      heroTitle: "Car Rental in Dubai",
      heroSubtitle1:
        "Dubai car hire with transparent pricing and free airport delivery.",
      heroSubtitle2:
        "Book Palm Rent cars with no deposit and no extra guarantee.",
    },
    ar: {
      heroTitle: "تأجير سيارات في دبي",
      heroSubtitle1:
        "كراء سيارات في دبي بأسعار واضحة وتسليم مجاني في المطار.",
      heroSubtitle2:
        "احجز سيارات Palm Rent بدون وديعة تأمين وبدون ضمان إضافي.",
    },
    tr: {
      heroTitle: "Dubai’de Araç Kiralama",
      heroSubtitle1:
        "Dubai’de şeffaf fiyatlarla ve ücretsiz havalimanı teslimatıyla araç kiralayın.",
      heroSubtitle2:
        "Palm Rent araçlarını depozitosuz ve ek teminatsız rezerve edin.",
    },
  },

  turkey: {
    fa: {
      heroTitle: "اجاره خودرو در استانبول",
      heroSubtitle1:
        "کرایه ماشین در استانبول با قیمت شفاف، رزرو آنلاین و تحویل رایگان فرودگاهی.",
      heroSubtitle2:
        "بدون ودیعه، بدون ضمانت و با کیلومتر نامحدود از خودروهای پالم رنت رزرو کنید.",
    },
    en: {
      heroTitle: "Car Rental in Istanbul",
      heroSubtitle1:
        "Car hire in Istanbul with transparent pricing, online booking, and free airport delivery.",
      heroSubtitle2:
        "Book from Palm Rent’s available cars with no deposit, no extra guarantee, and unlimited mileage.",
    },
    ar: {
      heroTitle: "تأجير سيارات في إسطنبول",
      heroSubtitle1:
        "كراء سيارات في إسطنبول مع أسعار واضحة، حجز أونلاين، وتسليم مجاني في المطار.",
      heroSubtitle2:
        "احجز من سيارات Palm Rent المتاحة بدون وديعة تأمين، بدون ضمان إضافي، ومع كيلومترات غير محدودة.",
    },
    tr: {
      heroTitle: "İstanbul’da Araç Kiralama",
      heroSubtitle1:
        "İstanbul’da şeffaf fiyatlar, online rezervasyon ve ücretsiz havalimanı teslimatı ile araç kiralayın.",
      heroSubtitle2:
        "Palm Rent’teki mevcut araçlardan depozitosuz, ek teminatsız ve sınırsız kilometre ile rezervasyon yapın.",
    },
  },
};

const normalizeLocale = (locale?: string) => {
  const value = String(locale || "fa").trim().toLowerCase();

  if (value.startsWith("fa")) return "fa";
  if (value.startsWith("en")) return "en";
  if (value.startsWith("ar")) return "ar";
  if (value.startsWith("tr")) return "tr";

  return "fa";
};

const normalizeSlug = (slug?: string) => {
  return String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\s+/g, "-");
};

type GetBranchLandingContentArgs = {
  slug?: string;
  locale?: string;
  t: (key: string, values?: Record<string, unknown>) => React.ReactNode;
  Branch: () => React.ReactNode;
};

export const getBranchLandingContent = ({
  slug,
  locale,
  t,
  Branch,
}: GetBranchLandingContentArgs): BranchLandingResolvedContent => {
  const normalizedLocale = normalizeLocale(locale);
  const normalizedSlug = normalizeSlug(slug);

  const staticContent =
    branchLandingStaticContent[normalizedSlug]?.[normalizedLocale];

  if (staticContent) {
    return {
      heroTitle: staticContent.heroTitle,
      heroSubtitle1: staticContent.heroSubtitle1,
      heroSubtitle2: staticContent.heroSubtitle2,
    };
  }

  return {
    heroTitle: t("heroTitle", { Branch }),
    heroSubtitle1: t("heroSubtitle1", { Branch }),
    heroSubtitle2: t("heroSubtitle2"),
  };
};