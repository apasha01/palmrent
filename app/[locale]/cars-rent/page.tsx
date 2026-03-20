"use client";

import Footer from "@/components/Footer";
import BranchCars from "@/components/hubBranches/BranchCars";
import BranchList from "@/components/hubBranches/BranchList";
import HubFooter from "@/components/hubBranches/HubFooter";
import FAQlanding from "@/components/Branchs/FAQ-landing";
import ImportantQuestions from "@/components/Branchs/Important-Questions";
import QRApplication from "@/components/Branchs/QR-Application";
import Header from "@/components/layouts/Header";
import NavSection from "@/components/Branchs/Nav-SectionNew";

import { useLocale, useTranslations } from "next-intl";
import { useBranches } from "@/services/branches/branches.queries";
import { useHubFaq } from "@/services/hub/hub.queries";

const Page = () => {
  const locale = useLocale();
  const t = useTranslations("HubLandingPage");

  const { data: branches, isLoading: branchesLoading } = useBranches(locale);
  const { data: hubData, isLoading: hubLoading } = useHubFaq(locale);

  return (
    <section className="mx-auto bg-white dark:bg-gray-950">
      <Header shadowLess />

      <NavSection
        image="/images/head-list-branch.jpg"
        title={t("heroTitle")}
        subtitle1={t("heroSubtitle1")}
        subtitle2={t("heroSubtitle2")}
      />

      <main className="mx-auto w-full max-w-7xl">
        <div className="px-0">
          <BranchList branches={branches} isLoading={branchesLoading} />

          <section className="mt-8">
            <ImportantQuestions onlySupportView />
          </section>

          <section className="mt-8">
            <BranchCars branches={branches} isLoading={branchesLoading} />
          </section>

          <section className="mt-6">
            <QRApplication />
          </section>

          <section className="mt-4">
            <FAQlanding data={hubData?.categories} loading={hubLoading} />
          </section>

          <section className="mt-8">
            <HubFooter description={hubData?.description} />
          </section>

          <Footer />
        </div>
      </main>
    </section>
  );
};

export default Page;