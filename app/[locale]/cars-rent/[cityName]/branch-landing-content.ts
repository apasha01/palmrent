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
      heroTitle: "اجاره خودرو در دبی بدون دپوزیت",
      heroSubtitle1:
        "کرایه ماشین در دبی با قیمت شفاف، رزرو آنلاین و تحویل رایگان فرودگاهی.",
      heroSubtitle2:
        "خودروهای موجود پالم رنت را ببینید و بدون ودیعه، بدون ضمانت و بدون ودیعه خلافی رزرو کنید.",
    },
    en: {
      heroTitle: "No-Deposit Car Rental in Dubai",
      heroSubtitle1:
        "Rent a car in Dubai with transparent pricing, online booking, and free airport delivery.",
      heroSubtitle2:
        "Explore Palm Rent’s available cars and book with no deposit, no guarantee, and no traffic fine deposit.",
    },
    ar: {
      heroTitle: "تأجير سيارات في دبي بدون تأمين",
      heroSubtitle1:
        "استأجر سيارة في دبي مع أسعار واضحة، حجز أونلاين، وتسليم مجاني في المطار.",
      heroSubtitle2:
        "تعرّف على السيارات المتاحة لدى Palm Rent واحجز بدون تأمين، بدون ضمان، وبدون وديعة مخالفات.",
    },
    tr: {
      heroTitle: "Dubai’de Depozitosuz Araç Kiralama",
      heroSubtitle1:
        "Dubai’de şeffaf fiyatlar, online rezervasyon ve ücretsiz havalimanı teslimatı ile araç kiralayın.",
      heroSubtitle2:
        "Palm Rent’teki mevcut araçları inceleyin; depozitosuz, teminatsız ve trafik cezası depozitosu olmadan rezervasyon yapın.",
    },
  },

  turkey: {
    fa: {
      heroTitle: "اجاره خودرو در استانبول بدون دپوزیت",
      heroSubtitle1:
        "کرایه ماشین در استانبول با قیمت شفاف، رزرو آنلاین و تحویل رایگان فرودگاهی.",
      heroSubtitle2:
        "خودروهای موجود پالم رنت را ببینید و بدون ودیعه، بدون ضمانت و با کیلومتر نامحدود رزرو کنید.",
    },
    en: {
      heroTitle: "No-Deposit Car Rental in Istanbul",
      heroSubtitle1:
        "Rent a car in Istanbul with transparent pricing, online booking, and free airport delivery.",
      heroSubtitle2:
        "Explore Palm Rent’s available cars and book with no deposit, no guarantee, and unlimited mileage.",
    },
    ar: {
      heroTitle: "تأجير سيارات في إسطنبول بدون تأمين",
      heroSubtitle1:
        "استأجر سيارة في إسطنبول مع أسعار واضحة، حجز أونلاين، وتسليم مجاني في المطار.",
      heroSubtitle2:
        "شاهد السيارات المتاحة لدى Palm Rent واحجز بدون تأمين، بدون ضمان، ومع كيلومترات غير محدودة.",
    },
    tr: {
      heroTitle: "İstanbul’da Depozitosuz Araç Kiralama",
      heroSubtitle1:
        "İstanbul’da şeffaf fiyatlar, online rezervasyon ve ücretsiz havalimanı teslimatı ile araç kiralayın.",
      heroSubtitle2:
        "Palm Rent’teki mevcut araçları inceleyin; depozitosuz, teminatsız ve sınırsız kilometre ile rezervasyon yapın.",
    },
  },

  oman: {
    fa: {
      heroTitle: "اجاره خودرو در مسقط عمان",
      heroSubtitle1:
        "کرایه ماشین در عمان با قیمت شفاف، رزرو آنلاین و تحویل فرودگاهی.",
      heroSubtitle2:
        "خودروهای موجود پالم رنت را ببینید و شرایط کامل اجاره خودرو در مسقط را بررسی کنید.",
    },
    en: {
      heroTitle: "Car Rental in Muscat, Oman",
      heroSubtitle1:
        "Rent a car in Oman with transparent pricing, online booking, and airport delivery.",
      heroSubtitle2:
        "Explore Palm Rent’s available cars and review the full rental conditions for Muscat.",
    },
    ar: {
      heroTitle: "تأجير سيارات في مسقط عُمان",
      heroSubtitle1:
        "استأجر سيارة في عُمان مع أسعار واضحة، حجز أونلاين، وتسليم في المطار.",
      heroSubtitle2:
        "شاهد السيارات المتاحة لدى Palm Rent واطّلع على الشروط الكاملة لتأجير السيارات في مسقط.",
    },
    tr: {
      heroTitle: "Umman Maskat’ta Araç Kiralama",
      heroSubtitle1:
        "Umman’da şeffaf fiyatlar, online rezervasyon ve havalimanı teslimatı ile araç kiralayın.",
      heroSubtitle2:
        "Palm Rent’teki mevcut araçları inceleyin ve Maskat için tüm kiralama koşullarını görün.",
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

  const staticContent = branchLandingStaticContent[normalizedSlug]?.[normalizedLocale];

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