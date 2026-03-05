"use client";

import Footer from "@/components/Footer";
import BranchCars from "@/components/hubBranches/BranchCars";
import BranchList from "@/components/hubBranches/BranchList";
import HubFooter from "@/components/hubBranches/HubFooter";
import FAQlanding from "@/components/Branchs/FAQ-landing";
import ImportantQuestions from "@/components/Branchs/Important-Questions";
import QRApplication from "@/components/Branchs/QR-Application";
import Header from "@/components/layouts/Header";
import { useBranches } from "@/services/branches/branches.queries";
import { useLocale } from "next-intl";
import NavSection from "@/components/Branchs/Nav-SectionNew";

const Page = () => {
  const locale = useLocale();

  const { data, isLoading } = useBranches(locale);

  return (
    <section className="mx-auto bg-white dark:bg-gray-800">
      <Header />

      <NavSection
        image="/images/head-list-branch.jpg"
        title="اجاره خودرو در شهر های فعال پالم رنت"
        subtitle1="شهر و تاریخ را انتخاب کنید"
        subtitle2="تا خودروهای موجود و قیمت نهایی نمایش داده شود."
      />
      <div className="max-w-7xl mx-auto">



      <BranchList branches={data} isLoading={isLoading} />

      <div>
        <ImportantQuestions onlySupportView />
      </div>

      <div className="mt-8">
        <BranchCars branches={data} isLoading />
      </div>

      <div className="mt-6">
        <QRApplication />
      </div>

      <div className="mt-4">
        <FAQlanding />
      </div>

      <div className="mt-8">
        <HubFooter />
      </div>

      <Footer />

      </div>
    </section>
  );
};

export default Page;
