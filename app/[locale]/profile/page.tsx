import ProfilePageClient from "@/components/profile/ProfilePageClient";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type PageProps = {
  params: {
    locale: string;
  };
};

function getOgLocale(locale: string) {
  switch (locale) {
    case "fa":
      return "fa_IR";
    case "ar":
      return "ar_AR";
    case "tr":
      return "tr_TR";
    default:
      return "en_US";
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "profile.meta" });

  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    keywords: [
      t("keywords.profile"),
      t("keywords.account"),
      t("keywords.documents"),
      t("keywords.transactions"),
      t("keywords.cars"),
      t("keywords.brand"),
      t("keywords.rental"),
    ],
    alternates: {
      canonical: `/${locale}/profile`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: getOgLocale(locale),
      siteName: "Palm Rent",
      url: `/${locale}/profile`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        "max-image-preview": "large",
        "max-video-preview": -1,
        "max-snippet": -1,
      },
    },
  };
}

export default function ProfilePage() {
  return <ProfilePageClient />;
}