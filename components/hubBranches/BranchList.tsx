"use client";

import Image from "next/image";
import { Skeleton } from "../ui/skeleton";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type BranchItem = {
  id: number;
  slug: string;
  title: string;
  photo: string | null;
};

type BranchListProps = {
  branches?: BranchItem[];
  isLoading?: boolean;
};

type BranchCardProps = {
  item: BranchItem;
};

const FALLBACK_IMAGE = "/images/about-ser-1.png";

const BranchCard = ({ item }: BranchCardProps) => {
  const t = useTranslations("HubBranchList");

  const [imgSrc, setImgSrc] = useState(item.photo || FALLBACK_IMAGE);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const nextSrc = item.photo || FALLBACK_IMAGE;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImgSrc(nextSrc);
    setIsImageLoaded(false);
    setHasError(false);
  }, [item.photo]);

  return (
    <div className="flex flex-col items-center gap-2">
      <Link
        href={`/cars-rent/${item.slug}`}
        className="flex flex-col items-center gap-2"
        aria-label={t("openBranch", { city: item.title })}
      >
        <div className="relative h-[72px] w-[72px] overflow-hidden rounded-xl sm:h-[100px] sm:w-[100px]">
          {!isImageLoaded && !hasError && (
            <Skeleton className="absolute inset-0 h-full w-full rounded-xl bg-gray-200 dark:bg-gray-800" />
          )}

          <Image
            src={imgSrc}
            alt={item.title}
            fill
            loading="lazy"
            className={`rounded-xl object-cover transition-opacity duration-300 ${
              isImageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => {
              setIsImageLoaded(true);
            }}
            onError={() => {
              if (imgSrc !== FALLBACK_IMAGE) {
                setImgSrc(FALLBACK_IMAGE);
                setIsImageLoaded(false);
              } else {
                setHasError(true);
                setIsImageLoaded(true);
              }
            }}
          />

          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-100 text-[10px] text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              {t("imageUnavailable")}
            </div>
          )}
        </div>

        <h3 className="mt-2 text-center text-sm text-gray-900 dark:text-gray-100">
          {item.title}
        </h3>
      </Link>
    </div>
  );
};

const BranchList = ({ branches, isLoading }: BranchListProps) => {
  const t = useTranslations("HubBranchList");

  useEffect(() => {
    branches?.forEach((item) => {
      if (!item.photo) {
        console.warn(
          `Branch ${item.id} (${item.title}) has no photo. Fallback will be used.`,
        );
      }
    });
  }, [branches]);

  return (
    <section className="mt-6 w-full px-2 md:mt-2 md:px-0">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {t("title")}
      </h2>

      <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
        {t("subtitle")}
      </p>

      <div className="mt-6 grid grid-cols-4 gap-3 sm:flex sm:flex-wrap sm:justify-start sm:gap-4">
        {isLoading
          ? Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <div className="relative h-[72px] w-[72px] sm:h-[100px] sm:w-[100px]">
                  <Skeleton className="h-full w-full rounded-xl bg-gray-200 dark:bg-gray-800" />
                </div>
                <Skeleton className="h-4 w-14 bg-gray-200 dark:bg-gray-800" />
              </div>
            ))
          : (branches ?? []).map((item) => (
              <BranchCard key={item.id} item={item} />
            ))}
      </div>
    </section>
  );
};

export default BranchList;