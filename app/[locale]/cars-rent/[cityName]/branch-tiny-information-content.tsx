import React from "react";

export type TinyInformationItem = {
  title: React.ReactNode;
  description: React.ReactNode;
  image: string;
};

export type TinyInformationResolvedContent = {
  items: TinyInformationItem[];
};

type TinyInformationStaticItem = {
  title1: string;
  description1: string;
  title2: string;
  description2: string;
  title3: string;
  description3: string;
};

type TinyInformationLocaleMap = Record<string, TinyInformationStaticItem>;
type TinyInformationContentMap = Record<string, TinyInformationLocaleMap>;

const branchTinyInformationStaticContent: TinyInformationContentMap = {
  dubai: {
    fa: {
      title1: "بدون دپوزیت و بدون ودیعه خلافی",
      description1:
        "در بسیاری از خودروهای دبی، فقط هزینه اجاره را پرداخت می‌کنید و نیازی به دپوزیت، ودیعه خلافی یا ضمانت ندارید.",
      title2: "تحویل رایگان فرودگاه دبی",
      description2:
        "خودروی خود را به‌صورت آنلاین رزرو کنید و در فرودگاه دبی سریع، راحت و بدون اتلاف وقت تحویل بگیرید.",
      title3: "قیمت شفاف و رزرو آنلاین فوری",
      description3:
        "قیمت، شرایط و مزایای هر خودرو به‌صورت شفاف نمایش داده می‌شود تا سریع‌تر و مطمئن‌تر رزرو کنید.",
    },
    en: {
      title1: "No Deposit",
      description1:
        "For many Dubai cars, you only pay the rental cost, with no deposit or extra guarantee required.",
      title2: "Free Delivery at Dubai Airport",
      description2:
        "Book your car online and receive it at Dubai Airport quickly, easily, and without wasting time.",
      title3: "Transparent Pricing & Fast Online Booking",
      description3:
        "Each car is shown with clear pricing, conditions, and benefits so you can book faster and with more confidence.",
    },
    ar: {
      title1: "بدون وديعة تأمين",
      description1:
        "في العديد من سيارات دبي، تدفع فقط قيمة الإيجار من دون وديعة تأمين أو ضمان إضافي.",
      title2: "تسليم مجاني في مطار دبي",
      description2:
        "احجز سيارتك أونلاين واستلمها في مطار دبي بسرعة، بسهولة، وبدون إضاعة الوقت.",
      title3: "أسعار واضحة وحجز أونلاين سريع",
      description3:
        "يتم عرض سعر كل سيارة وشروطها ومزاياها بشكل واضح حتى تحجز بسرعة أكبر وبثقة أعلى.",
    },
    tr: {
      title1: "Depozitosuz",
      description1:
        "Dubai’de birçok araçta yalnızca kiralama ücretini ödersiniz; depozito veya ek teminat gerekmez.",
      title2: "Dubai Havalimanı’nda Ücretsiz Teslimat",
      description2:
        "Aracınızı online rezerve edin ve Dubai Havalimanı’nda hızlı, kolay ve zaman kaybetmeden teslim alın.",
      title3: "Şeffaf Fiyatlar ve Hızlı Online Rezervasyon",
      description3:
        "Her araç için fiyat, koşullar ve avantajlar açık şekilde gösterilir; böylece daha hızlı ve daha güvenli rezervasyon yapabilirsiniz.",
    },
  },

  turkey: {
    fa: {
      title1: "بدون دپوزیت",
      description1:
        "فقط هزینه اجاره را پرداخت می‌کنید و بدون دپوزیت رزرو انجام می‌شود.",
      title2: "تحویل رایگان + کیلومتر نامحدود",
      description2:
        "خودرو را رایگان تحویل بگیرید و بدون محدودیت کیلومتر در استانبول رانندگی کنید.",
      title3: "بیمه رایگان + قیمت شفاف",
      description3:
        "با بیمه رایگان و قیمت شفاف، انتخاب و رزرو خودرو سریع‌تر و مطمئن‌تر انجام می‌شود.",
    },
    en: {
      title1: "No Deposit",
      description1:
        "You only pay the rental amount, and your booking is completed with no deposit required.",
      title2: "Free Delivery + Unlimited Mileage",
      description2:
        "Receive your car free of charge and drive in Istanbul with unlimited mileage.",
      title3: "Free Insurance + Transparent Pricing",
      description3:
        "With free insurance and clear pricing, choosing and booking your car becomes faster and more reliable.",
    },
    ar: {
      title1: "بدون وديعة تأمين",
      description1:
        "تدفع فقط قيمة الإيجار ويتم الحجز بدون وديعة تأمين.",
      title2: "تسليم مجاني + كيلومترات غير محدودة",
      description2:
        "استلم سيارتك مجانًا وقُد في إسطنبول مع كيلومترات غير محدودة.",
      title3: "تأمين مجاني + أسعار واضحة",
      description3:
        "مع التأمين المجاني والأسعار الواضحة، يصبح اختيار السيارة وحجزها أسرع وأكثر ثقة.",
    },
    tr: {
      title1: "Depozitosuz",
      description1:
        "Sadece kiralama ücretini ödersiniz ve rezervasyon depozito olmadan tamamlanır.",
      title2: "Ücretsiz Teslimat + Sınırsız Kilometre",
      description2:
        "Aracınızı ücretsiz teslim alın ve İstanbul’da sınırsız kilometre ile rahatça sürün.",
      title3: "Ücretsiz Sigorta + Şeffaf Fiyatlar",
      description3:
        "Ücretsiz sigorta ve açık fiyatlarla araç seçimi ve rezervasyon daha hızlı ve daha güvenli hale gelir.",
    },
  },
};

const defaultTinyInformationContent: TinyInformationLocaleMap = {
  fa: {
    title1: "قیمت شفاف و رزرو آسان",
    description1:
      "اطلاعات هر خودرو به‌صورت روشن نمایش داده می‌شود تا سریع‌تر و مطمئن‌تر رزرو کنید.",
    title2: "تحویل راحت و شرایط منعطف",
    description2:
      "بسته به نوع خودرو و شرایط رزرو، فرایند تحویل و هماهنگی می‌تواند برای شما ساده‌تر و کاربردی‌تر باشد.",
    title3: "انتخاب متنوع، رزرو مطمئن",
    description3:
      "با بررسی خودروهای موجود و شرایط هر گزینه، انتخاب خودرو برای شما راحت‌تر و حرفه‌ای‌تر انجام می‌شود.",
  },
  en: {
    title1: "Transparent Pricing & Easy Booking",
    description1:
      "Each car is presented with clear information to help you book faster and with more confidence.",
    title2: "Smooth Delivery & Flexible Conditions",
    description2:
      "Depending on the car and booking details, the delivery process and arrangements may be easier and more convenient for you.",
    title3: "More Choice, More Confidence",
    description3:
      "By reviewing available cars and the details of each option, you can choose the right vehicle more easily and book with greater confidence.",
  },
  ar: {
    title1: "أسعار واضحة وحجز سهل",
    description1:
      "يتم عرض معلومات كل سيارة بشكل واضح حتى تتمكن من الحجز بسرعة أكبر وبثقة أعلى.",
    title2: "تسليم مريح وشروط مرنة",
    description2:
      "بحسب نوع السيارة وتفاصيل الحجز، قد تكون إجراءات التسليم والتنسيق أسهل وأكثر ملاءمة لك.",
    title3: "خيارات متنوعة وحجز أكثر ثقة",
    description3:
      "من خلال مراجعة السيارات المتاحة وتفاصيل كل خيار، يمكنك اختيار السيارة المناسبة بسهولة أكبر وإتمام الحجز بثقة أعلى.",
  },
  tr: {
    title1: "Şeffaf Fiyatlar ve Kolay Rezervasyon",
    description1:
      "Her araç, daha hızlı ve daha güvenli rezervasyon yapabilmeniz için açık bilgilerle sunulur.",
    title2: "Kolay Teslimat ve Esnek Koşullar",
    description2:
      "Araca ve rezervasyon detaylarına bağlı olarak teslimat süreci ve koordinasyon sizin için daha pratik ve daha uygun olabilir.",
    title3: "Daha Fazla Seçenek, Daha Güvenli Rezervasyon",
    description3:
      "Mevcut araçları ve her seçeneğin detaylarını inceleyerek size en uygun aracı daha kolay seçebilir ve daha güvenli şekilde rezervasyon yapabilirsiniz.",
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

type GetBranchTinyInformationContentArgs = {
  slug?: string;
  locale?: string;
  t?: (key: string, values?: Record<string, unknown>) => React.ReactNode;
};

export const getBranchTinyInformationContent = ({
  slug,
  locale,
}: GetBranchTinyInformationContentArgs): TinyInformationResolvedContent => {
  const normalizedLocale = normalizeLocale(locale);
  const normalizedSlug = normalizeSlug(slug);

  const staticContent =
    branchTinyInformationStaticContent[normalizedSlug]?.[normalizedLocale] ||
    defaultTinyInformationContent[normalizedLocale] ||
    defaultTinyInformationContent.fa;

  return {
    items: [
      {
        title: staticContent.title1,
        description: staticContent.description1,
        image: "/svg/nodeposit.svg",
      },
      {
        title: staticContent.title2,
        description: staticContent.description2,
        image: "/svg/freedelivery.svg",
      },
      {
        title: staticContent.title3,
        description: staticContent.description3,
        image: "/svg/clearprice.svg",
      },
    ],
  };
};