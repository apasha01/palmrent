/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Image from "next/image";
import { useMemo, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

import { STORAGE_URL } from "@/lib/apiClient";
import useDIR from "@/hooks/use-rtl";
import { Link } from "@/i18n/navigation";
import type { BlogItem } from "@/services/blog/blogs.types";

type GuidesSectionProps = {
  items?: BlogItem[];
  isLoading?: boolean;
};

export default function GuidesSection({
  items = [],
  isLoading = false,
}: GuidesSectionProps) {
  const t = useTranslations("GuidesSection");
  const { direction } = useDIR();

  const storageBase = useMemo(() => {
    const raw = STORAGE_URL ?? "";
    return raw.endsWith("/") ? raw.slice(0, -1) : raw;
  }, []);

  const joinUrl = useCallback((base: string, path?: string | null) => {
    if (!path) return "/images/placeholder.jpg";

    if (/^https?:\/\//i.test(path)) return path;

    if (!base) return path.startsWith("/") ? path : `/${path}`;

    const p = path.startsWith("/") ? path : `/${path}`;
    return `${base}${p}`;
  }, []);

  const emblaDirection = direction ? "rtl" : "ltr";

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    direction: emblaDirection,
  });

  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateButtons = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    updateButtons();
    emblaApi.on("select", updateButtons);
    emblaApi.on("reInit", updateButtons);

    return () => {
      emblaApi.off("select", updateButtons);
      emblaApi.off("reInit", updateButtons);
    };
  }, [emblaApi, updateButtons]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
    updateButtons();
  }, [emblaApi, items, updateButtons]);

  const onPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const onNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (!isLoading && (!items || items.length === 0)) {
    return null;
  }

  return (
    <section className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">{t("title")}</h2>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={onPrev}
            disabled={!canPrev}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={t("prev")}
          >
            {direction ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={!canNext}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={t("next")}
          >
            {direction ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <div
        className="flex flex-nowrap gap-4 overflow-x-auto pb-2 md:hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <article
                key={`m-skel-${i}`}
                className="flex w-[260px] shrink-0 flex-col rounded-lg border animate-pulse"
              >
                <div className="overflow-hidden rounded-lg">
                  <div className="h-48 w-full bg-muted" />
                </div>
                <div className="space-y-3 p-2 pt-4">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-11/12 rounded bg-muted" />
                  <div className="h-3 w-10/12 rounded bg-muted" />
                </div>
              </article>
            ))
          : items.map((item) => {
              const imgSrc = joinUrl(storageBase, item.photo);

              return (
                <article
                  key={`m-${item.id}`}
                  className="w-[260px] shrink-0 rounded-lg border transition hover:shadow-sm"
                >
                  <Link
                    href={`/blogs/${item.id}`}
                    aria-label={t("openArticle", { title: item.title })}
                    className="group flex cursor-pointer flex-col"
                  >
                    <div className="overflow-hidden rounded-lg">
                      <Image
                        src={imgSrc}
                        alt={item.title}
                        width={260}
                        height={220}
                        className="h-44 w-full object-cover"
                      />
                    </div>

                    <div className="p-2 pt-4">
                      <h3 className="mb-3 line-clamp-2 text-base font-bold leading-relaxed text-foreground">
                        {item.title}
                      </h3>
                      <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                        {item.text}
                      </p>
                    </div>
                  </Link>
                </article>
              );
            })}
      </div>

      <div className="hidden md:block">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <article
                    key={`d-skel-${i}`}
                    className="flex w-[320px] shrink-0 flex-col rounded-lg border animate-pulse"
                  >
                    <div className="overflow-hidden rounded-lg">
                      <div className="h-48 w-full bg-muted" />
                    </div>
                    <div className="space-y-3 p-2 pt-4">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-full rounded bg-muted" />
                      <div className="h-3 w-11/12 rounded bg-muted" />
                      <div className="h-3 w-10/12 rounded bg-muted" />
                    </div>
                  </article>
                ))
              : items.map((item) => {
                  const imgSrc = joinUrl(storageBase, item.photo);

                  return (
                    <article
                      key={`d-${item.id}`}
                      className="w-[320px] shrink-0 rounded-lg border transition hover:shadow-sm"
                    >
                      <Link
                        href={`/blogs/${item.id}`}
                        aria-label={t("openArticle", { title: item.title })}
                        className="group flex cursor-pointer flex-col"
                      >
                        <div className="overflow-hidden rounded-lg">
                          <Image
                            src={imgSrc}
                            alt={item.title}
                            width={400}
                            height={240}
                            className="h-48 w-full object-cover"
                          />
                        </div>

                        <div className="p-2 pt-4">
                          <h3 className="mb-3 line-clamp-2 text-base font-bold leading-relaxed text-foreground">
                            {item.title}
                          </h3>
                          <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                            {item.text}
                          </p>
                        </div>
                      </Link>
                    </article>
                  );
                })}
          </div>
        </div>
      </div>
    </section>
  );
}