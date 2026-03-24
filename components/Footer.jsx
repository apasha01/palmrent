"use client";

import { Link } from "@/i18n/navigation";
import {
  IconArrowDoubled,
  IconFacebook,
  IconLinkedIn,
  IconPhone,
  IconTwitter,
  IconYoutube,
} from "./Icons";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function Footer({ NMG = false }) {
  const t = useTranslations();

  return (
    <footer className={`pt-10 md:pt-12 ${NMG ? "" : "mt-10 md:mt-12"}`}>
      <div className="mx-auto w-full max-w-[1336px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:flex-nowrap lg:gap-0">
          {/* about */}
          <div className="w-full lg:w-4/12 xl:w-3/12 lg:px-6">
            <div className="mb-3 text-lg font-semibold text-[#313131] md:text-base">
              {t("aboutUs")}
            </div>

            <p className="text-justify text-xs leading-6 text-[#4B4B4B] sm:text-sm">
              لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با
              استفاده از طراحان گرافیک است چاپگرها و متون بلکه روزنامه و مجله در
              ستون و سطرآنچنان که لازم است
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <span className="text-sm text-[#313131] sm:text-xs">
                {t("subscribeTitle")}
              </span>

              <div className="flex w-full overflow-hidden rounded-md border border-[#D4D4D4] bg-white">
                <input
                  placeholder={`${t("email")} ...`}
                  className="h-11 min-w-0 flex-1 px-3 text-sm outline-none placeholder:text-[#8A8A8A]"
                  type="email"
                />
                <button
                  type="button"
                  className="h-11 shrink-0 bg-[#B9C4E6] px-4 text-sm font-medium text-[#152D7C] transition hover:opacity-90 sm:px-5"
                >
                  {t("subscribe")}
                </button>
              </div>
            </div>
          </div>

          {/* divider */}
          <span className="hidden h-auto min-h-[120px] w-px bg-[#C0C0C0] lg:block" />

          {/* pages */}
          <div className="w-full lg:w-5/12 lg:px-6">
            <div className="mb-3 text-lg font-semibold text-[#313131] md:text-base">
              {t("pages")}
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm text-[#303030] sm:grid-cols-2">
              <Link className="flex items-center gap-2" href="/">
                <span className="size-4 shrink-0">
                  <IconArrowDoubled />
                </span>
                <span>{t("home")}</span>
              </Link>

              <Link className="flex items-center gap-2" href="/documents">
                <span className="size-4 shrink-0">
                  <IconArrowDoubled />
                </span>
                <span>{t("documents")}</span>
              </Link>

              <Link className="flex items-center gap-2" href="/contact-us">
                <span className="size-4 shrink-0">
                  <IconArrowDoubled />
                </span>
                <span>{t("contactUs")}</span>
              </Link>

              <Link className="flex items-center gap-2" href="/blogs">
                <span className="size-4 shrink-0">
                  <IconArrowDoubled />
                </span>
                <span>{t("blog")}</span>
              </Link>

              <Link className="flex items-center gap-2" href="/gallery">
                <span className="size-4 shrink-0">
                  <IconArrowDoubled />
                </span>
                <span>{t("gallery")}</span>
              </Link>

              <Link className="flex items-center gap-2" href="/about-us">
                <span className="size-4 shrink-0">
                  <IconArrowDoubled />
                </span>
                <span>{t("aboutUs")}</span>
              </Link>

              <Link className="flex items-center gap-2" href="/rules">
                <span className="size-4 shrink-0">
                  <IconArrowDoubled />
                </span>
                <span>{t("rules")}</span>
              </Link>
            </div>
          </div>

          {/* divider */}
          <span className="hidden h-auto min-h-[120px] w-px bg-[#C0C0C0] lg:block" />

          {/* licenses */}
          <div className="w-full lg:w-3/12 lg:px-6">
            <div className="mb-3 text-center text-lg font-semibold text-[#313131] lg:text-start md:text-base">
              {t("licenses")}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:justify-start">
              <Link
                className="flex size-[84px] shrink-0 items-center justify-center rounded-2xl border border-[#0000001F] bg-white p-2"
                href="#"
              >
                <Image
                  src="/images/cer-1.png"
                  width={69}
                  height={69}
                  alt="license 1"
                  className="h-auto w-auto max-h-[69px] max-w-[69px] object-contain"
                />
              </Link>

              <Link
                className="flex size-[84px] shrink-0 items-center justify-center rounded-2xl border border-[#0000001F] bg-white p-2"
                href="#"
              >
                <Image
                  src="/images/logo-samandehi.png"
                  width={69}
                  height={69}
                  alt="license 2"
                  className="h-auto w-auto max-h-[69px] max-w-[69px] object-contain"
                />
              </Link>

              <Link
                className="flex size-[84px] shrink-0 items-center justify-center rounded-2xl border border-[#0000001F] bg-white p-2"
                href="#"
              >
                <Image
                  src="/images/enamad.png"
                  width={69}
                  height={69}
                  alt="license 3"
                  className="h-auto w-auto max-h-[69px] max-w-[69px] object-contain"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* bottom section */}
        <div className="my-6 flex w-full flex-col items-center gap-5 rounded-2xl bg-white px-4 py-5 dark:bg-gray-900 sm:px-6 md:flex-row md:justify-between md:gap-4">
          <Link
            className="hidden items-center gap-3 text-xl font-bold text-[#1E40AF] lg:flex"
            href="#"
          >
            <Image
              className="dark:filter-none"
              src="/images/logo.png"
              width={150}
              height={80}
              alt="palmrent logo"
            />
            <div>{t("palmRent")}</div>
          </Link>

          <Link
            href="tel:+989196784367"
            className="flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-3 text-[#1E40AF] md:w-auto md:justify-start"
          >
            <span className="size-12 shrink-0">
              <IconPhone />
            </span>

            <div className="flex min-w-0 flex-col justify-center text-center md:text-start">
              <span className="text-xs">{t("phoneNumber")}</span>
              <span className="text-lg font-semibold leading-6">09196784367</span>
            </div>
          </Link>

          <div className="flex flex-col items-center gap-3 text-base font-semibold text-[#1E40AF] md:flex-row">
            <div className="hidden md:inline">{t("followUs")}</div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-[#1E40AF]">
              <Link
                href="#"
                className="flex size-9 items-center justify-center rounded-full bg-white"
              >
                <IconYoutube />
              </Link>

              <Link
                href="#"
                className="flex size-9 items-center justify-center rounded-full bg-white"
              >
                <IconLinkedIn />
              </Link>

              <Link
                href="#"
                className="flex size-9 items-center justify-center rounded-full bg-white"
              >
                <IconTwitter />
              </Link>

              <Link
                href="#"
                className="flex size-9 items-center justify-center rounded-full bg-white"
              >
                <IconFacebook />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center border-t border-[#E4E4E4] px-4 py-4 text-center text-[10px] sm:text-xs">
        {t("copyright")}
      </div>
    </footer>
  );
}