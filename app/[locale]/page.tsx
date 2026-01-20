"use client";

import Footer from "@/components/Footer";
import ImportantQuestions from "@/components/Branchs/Important-Questions";
import NavSection from "@/components/Branchs/Nav-Section";
import QRApplication from "@/components/Branchs/QR-Application";
import Header from "@/components/layouts/Header";
import { useBranches } from "@/services/branches/branches.queries";
import { useLocale } from "next-intl";
import ActiveRentCities from "@/components/Landing/ActiveRentCities";
import HubSupportSection from "@/components/Landing/HubSupportSection";
import GuidesSection from "@/components/Landing/GuideSection";

const Page = () => {
  const locale = useLocale();

  const { data } = useBranches(locale);

  return (
    <section className="max-w-7xl mx-auto">
      <Header />

      <NavSection
        image="/images/head-list-branch.jpg"
        title="پالم رنت | رزرو آنلاین اجاره خودرو در شهرهای منتخب"
        subtitle1="رزرو آنلاین, تحویل هماهنگ شده, پشتیبانی فارسی ۷/۲۴"
        // subtitle2="تا خودروهای موجود و قیمت نهایی نمایش داده شود."
      />

      <div className="mt-6">

      <ActiveRentCities cities={data} />

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
  );
};

export default Page;
