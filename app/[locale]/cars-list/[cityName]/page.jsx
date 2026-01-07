"use client";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSelector } from "react-redux";
import SingleCar from "@/components/card/CarsCard";

export default function BranchPage() {
  const params = useParams();

  const carList = useSelector((state) => state.carList.carList);
  const t = useTranslations();
  useEffect(() => {
    const timeout = setTimeout(() => {}, 300);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <div className="xl:w-[85vw] w-[95vw] max-w-[1336px] block m-auto">
        <div className="text-center">
          <h2 className="flex justify-center ltr:flex-row-reverse text-xl font-bold my-8 gap-2">
            {t("carListTitle")} <span>{t(params.cityName)}</span>
          </h2>
        </div>
        <div className="flex flex-wrap gap-4 mb-8">
          {carList.map((item, index) => {
            return (
              <div
                key={index}
                className="flex xl:w-[calc(33%-12px)] md:w-[calc(50%-8px)] w-full"
              >
                <SingleCar data={item} />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
