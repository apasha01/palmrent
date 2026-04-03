import Footer from "@/components/Footer";
import ImportantQuestions from "@/components/Branchs/Important-Questions";
import QRApplication from "@/components/Branchs/QR-Application";
import Header from "@/components/layouts/Header";
import ActiveRentCities from "@/components/Landing/ActiveRentCities";
import HubSupportSection from "@/components/Landing/HubSupportSection";
import GuidesSection from "@/components/Landing/GuideSection";
import NavSection from "@/components/Branchs/Nav-SectionNew";

import { cache } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { getBranches } from "@/services/branches/branches.api";
import { getBlogsIndexData } from "@/services/blog/blogs.api";
import type { Metadata } from "next";
import MoreDescription from "@/components/hubBranches/HubFooter";

const getCachedBlogsIndexData = cache(async (locale: string) => {
  return getBlogsIndexData(locale, { page: 1, per_page: 12 });
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const res = await getCachedBlogsIndexData(locale);
  const meta = res.meta;

  const imageUrl = meta?.imgSeo
    ? /^https?:\/\//i.test(meta.imgSeo)
      ? meta.imgSeo
      : `${process.env.NEXTFRONTEND_URL}${meta.imgSeo.startsWith("/") ? "" : "/"}${meta.imgSeo}`
    : undefined;

  return {
    metadataBase: new URL(process.env.NEXTFRONTEND_URL!),
    title: meta?.titleSeo || "Palm Rent",
    description: meta?.descriptionSeo || "",
    alternates: {
      canonical: meta?.canonical || "/",
    },
    openGraph: {
      title: meta?.titleSeo || "Palm Rent",
      description: meta?.descriptionSeo || "",
      url: meta?.urlPage || "/",
      siteName: meta?.siteName || "Palm Rent",
      type: "website",
      images: imageUrl ? [imageUrl] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: meta?.titleSeo || "Palm Rent",
      description: meta?.descriptionSeo || "",
      images: imageUrl ? [imageUrl] : [],
    },
    robots: meta?.robots || "follow, index",
  };
}

const HomePage = async () => {
  const locale = await getLocale();
  const t = await getTranslations("Home");

  const [branches, blogsRes] = await Promise.all([
    getBranches(locale),
    getCachedBlogsIndexData(locale),
  ]);

  return (
    <div className="bg-white dark:bg-gray-950">
      <section className="mx-auto">
        <Header />

        <NavSection
          image="/images/head-list-branch.jpg"
          title={t("hero.title")}
          subtitle1={t("hero.subtitle")}
          subtitle2={t("hero.subtitle2")}

        />

        <div className="mx-auto max-w-7xl px-4">
          <div className="mt-6">
            <ActiveRentCities cities={branches} isLoading={false} />
          </div>

          <div>
            <ImportantQuestions onlySupportView />
          </div>

          <div className="mt-8">
            <HubSupportSection />
          </div>


          <div className="mt-6">
            <QRApplication />
          </div>
                              <section className="mt-8">
                      <MoreDescription description={blogsRes?.index_description ?? ""} />
                    </section>

          <div className="mt-8 md:px-0">
            <GuidesSection items={blogsRes.items} />
          </div>
        </div>

        <Footer />
      </section>
    </div>
  );
};

export default HomePage;