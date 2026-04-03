"use client";

import Image from "next/image";
import React, { useMemo } from "react";
import { useTranslations } from "next-intl";

import { getBranchTinyInformationContent } from "@/app/[locale]/cars-rent/[cityName]/branch-tiny-information-content";

type TinyInformationProps = {
  locale: string;
  cityName: string;
};

const TinyInformation = ({ locale, cityName }: TinyInformationProps) => {
  const t = useTranslations("branchLanding");

  const content = useMemo(() => {
    return getBranchTinyInformationContent({
      slug: cityName,
      locale,
      t: (key, values) => t.rich(key, values as never),
    });
  }, [cityName, locale, t]);

  return (
    <section className="mt-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-4 md:px-2 lg:px-0 gap-4">
        {content.items.map((item, index) => (
          <article key={`tiny-information-${index}`} className="flex gap-2">
            <div className="w-28 h-28 relative shrink-0">
              <Image
                alt={typeof item.title === "string" ? item.title : "helper text"}
                src={item.image}
                fill
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col items-start justify-start">
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-wrap text-[14px]">{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default TinyInformation;