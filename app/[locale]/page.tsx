"use client";

import Footer from "@/components/Footer";
import ImportantQuestions from "@/components/Branchs/Important-Questions";
import NavSection from "@/components/Branchs/Nav-Section";
import QRApplication from "@/components/Branchs/QR-Application";
import Header from "@/components/layouts/Header";
import { useBranches } from "@/services/branches/branches.queries";
import { useLocale, useTranslations } from "next-intl";
import ActiveRentCities from "@/components/Landing/ActiveRentCities";
import HubSupportSection from "@/components/Landing/HubSupportSection";
import GuidesSection from "@/components/Landing/GuideSection";

const HomeClient = () => {
  const locale = useLocale();
  const t = useTranslations("Home");
  const { data, isLoading } = useBranches(locale);

  return (
    <div className="bg-white dark:bg-gray-800">

    <section className="max-w-7xl mx-auto ">
      <Header />

      <NavSection
        image="/images/head-list-branch.jpg"
        title={t("hero.title")}
        subtitle1={t("hero.subtitle")}
      />

      <div className="mt-6">
        <ActiveRentCities cities={data} isLoading={isLoading} />
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

      <div className="mt-8 px-2 md:px-0">
        <GuidesSection />
      </div>

      <Footer />
    </section>
    </div>
  );
};

export default HomeClient;