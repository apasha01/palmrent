"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

const HubSupportSection = () => {
  const t = useTranslations("HubSupportSection");

  return (
    <section className="w-full px-2 md:px-0 mt-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 items-start">
        {/* Item 1 */}
        <article className="flex flex-row md:flex-row items-center gap-4">
          <div>
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white">
              <Image
                src="/images/flexiblepayment.webp"
                alt={t("items.payment.title")}
                width={66}
                height={66}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <h3 className="font-bold text-sm">{t("items.payment.title")}</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-6">
              {t("items.payment.description.line1")}
              <br className="hidden md:block" />
              {t("items.payment.description.line2")}
            </p>
          </div>
        </article>

        {/* Item 2 */}
        <article className="flex flex-row md:flex-row items-center gap-4">
          <div>
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white">
              <Image
                src="/images/fullsupport.webp"
                alt={t("items.support.title")}
                width={66}
                height={66}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <h3 className="font-bold text-sm">{t("items.support.title")}</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-6">
              {t("items.support.description.line1")}
              <br className="hidden md:block" />
              {t("items.support.description.line2")}
            </p>
          </div>
        </article>

        {/* Item 3 */}
        <article className="flex flex-row md:flex-row items-center gap-4">
          <div>
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white">
              <Image
                src="/images/clearandtracking.webp"
                alt={t("items.tracking.title")}
                width={66}
                height={66}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <h3 className="font-bold text-sm">{t("items.tracking.title")}</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-6">
              {t("items.tracking.description.line1")}
              <br className="hidden md:block" />
              {t("items.tracking.description.line2")}
            </p>
          </div>
        </article>
      </div>
    </section>
  );
};

export default HubSupportSection;