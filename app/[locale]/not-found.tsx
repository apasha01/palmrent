"use client";

import Lottie from "lottie-react";
import { Home, RotateCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import notfound from "@/public/lottie/notfound.json";

export default function NotFoundPage() {
  const t = useTranslations("NotFoundPage");
  const locale = useLocale();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden  px-4 py-10 dark:bg-gray-950">
 
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center rounded-3xl  px-4 py-8 text-center  dark:border-white/10 dark:bg-gray-900/80 sm:px-8 sm:py-10">
        <div className="w-full max-w-[320px] sm:max-w-[380px]">
          <Lottie animationData={notfound} loop />
        </div>

        <div className="mt-2 inline-flex items-center rounded-full border border-[#0077db]/15 bg-[#0077db]/10 px-4 py-1.5 text-sm font-medium text-[#0077db]">
          404
        </div>

        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          {t("title")}
        </h1>

        <p className="mt-4 max-w-xl text-sm leading-7 text-gray-600 dark:text-gray-300 sm:text-base">
          {t("description")}
        </p>

        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/"
            locale={locale}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0077db] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0068bf] sm:w-auto"
          >
            <Home className="size-4" />
            {t("goHome")}
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:bg-transparent dark:text-white dark:hover:bg-white/5 sm:w-auto"
          >
            <RotateCcw className="size-4" />
            {t("goBack")}
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-400 dark:text-gray-500">
          {t("hint")}
        </div>
      </div>
    </main>
  );
}