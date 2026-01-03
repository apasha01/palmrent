"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";

import "swiper/css";
import { IconArrowHandle, IconWSOSD } from "./Icons";
import Image from "next/image";
import Link from "next/link";
import { useSelector } from "react-redux";
import { useTranslations } from "next-intl";
import { BASE_URL, STORAGE_URL } from "@/lib/apiClient";
export default function BranchSection() {
  const t = useTranslations();

  return (
    <section className="bg-[#F6F6F6] py-8">
      <div className="w-[85vw] max-w-[1336px] m-auto">
        <div className="text-center pb-6 md:text-xl sm:text-lg text-base font-bold text-[#3B82F6]">
          {t("branches")} 
        </div>

        <Slider />
      </div>
    </section>
  );
}
export function Slider() {
  const branches = useSelector((state) => state.global.branches);

  return (
    <div dir="rtl" className="relative">
      <Swiper
        spaceBetween={10}
        slidesPerView={2}
        loop={true}
        speed={3000}
        autoplay={{
          delay: 0,
          disableOnInteraction: false,
        }}
        modules={[Navigation, Autoplay]}
        breakpoints={{
          400: { slidesPerView: 2 },
          768: { slidesPerView: 3 },
          1024: { slidesPerView: 4 },
          1280: { slidesPerView: 5 },
        }}
      >
        {branches &&
          branches.map((item, index) => {
            return (
              <SwiperSlide key={index}>
                <SingleBranchCity
                  link={"/cars-rent/dubai"}
                  image={`${STORAGE_URL}${item.photo}`}
                  title={item.title}
                />
              </SwiperSlide>
            );
          })}
      </Swiper>
    </div>
  );
}

export function SingleBranchCity({ link, image, title }) {

  console.log(image)
  return (
    <Link
      href={link}
      className="border group border-[#0000001f] bg-white inline-block w-full rounded-lg overflow-hidden relative p-2 cursor-pointer"
    >
      <div className="w-full max-sm:aspect-square">
        <Image
          className="w-full rounded-lg object-cover h-full md:h-[140px]"
          src={`${image}`}
          width={218}
          height={181}
          alt=""
        ></Image>
      </div>
      <div className="absolute left-2 top-2 sm:size-[72px] size-[40px]">
        <IconWSOSD />
        <span className="absolute sm:size-10 size-5 flex items-center justify-center rounded-full group-hover:bg-[#3B82F6] group-hover:text-white top-2 left-2 transition-all">
          <span className="flex size-3 sm:size-6">
            <IconArrowHandle />
          </span>
        </span>
      </div>
      <div className="border border-[#0000001f] rounded-lg mt-2 p-3 md:text-base sm:text-sm text-xs">
        {title}
      </div>
    </Link>
  );
}
