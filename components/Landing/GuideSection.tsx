/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Image from "next/image";
import { useMemo, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useParams } from "next/navigation";

import { useBlogs } from "@/services/blog/blogs.queries";
import { STORAGE_URL } from "@/lib/apiClient";
import useDIR from "@/hooks/use-rtl";
import { Link } from "@/i18n/navigation";

export default function GuidesSection() {
  const t = useTranslations("GuidesSection");
  const routeParams = useParams() as { locale?: string };
  const lang = String(routeParams?.locale || "fa");
  const { direction } = useDIR();

  const storageBase = useMemo(() => {
    const raw = STORAGE_URL ?? "";
    return raw.endsWith("/") ? raw.slice(0, -1) : raw;
  }, []);

  const joinUrl = (base: string, path?: string | null) => {
    if (!path) return "/images/placeholder.jpg";
    if (!base) return path.startsWith("/") ? path : `/${path}`;
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${base}${p}`;
  };

  const { data, isLoading, isError } = useBlogs(lang, { page: 1, per_page: 12 });
  const items = useMemo(() => data?.items ?? [], [data]);

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

  const onPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const onNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (isError) return null;

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">{t("title")}</h2>

        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={!canPrev}
            className="
              inline-flex items-center justify-center
              w-10 h-10 rounded-full border
              text-foreground
              disabled:opacity-40 disabled:cursor-not-allowed
              hover:bg-muted transition
            "
            aria-label={t("prev")}
          >
            {direction ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={!canNext}
            className="
              inline-flex items-center justify-center
              w-10 h-10 rounded-full border
              text-foreground
              disabled:opacity-40 disabled:cursor-not-allowed
              hover:bg-muted transition
            "
            aria-label={t("next")}
          >
            {direction ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* ---------------- MOBILE (Swipe Scroll) ---------------- */}
      <div
        className="
          md:hidden
          flex flex-nowrap gap-4 overflow-x-auto pb-2
          [scrollbar-width:none] [-ms-overflow-style:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <article
                key={`m-skel-${i}`}
                className="flex flex-col border rounded-lg shrink-0 w-[260px] animate-pulse"
              >
                <div className="rounded-lg overflow-hidden">
                  <div className="w-full h-48 bg-muted" />
                </div>
                <div className="pt-4 p-2 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-11/12" />
                  <div className="h-3 bg-muted rounded w-10/12" />
                </div>
              </article>
            ))
          : items.map((item: any) => {
              const imgSrc = joinUrl(storageBase, item.photo);

              return (
                <article
                  key={`m-${item.id}`}
                  className="
                    border rounded-lg
                    shrink-0 w-[260px]
                    hover:shadow-sm transition
                  "
                >
                  <Link
                    href={`/blogs/${item.id}`}
                    aria-label={t("openArticle", { title: item.title })}
                    className="flex flex-col cursor-pointer group"
                  >
                    <div className="rounded-lg overflow-hidden">
                      <Image
                        src={imgSrc}
                        alt={item.title}
                        width={260}
                        height={220}
                        className="w-full h-44 object-cover"
                      />
                    </div>

                    <div className="pt-4 p-2">
                      <h3 className="text-foreground font-bold text-base mb-3 leading-relaxed line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4">
                        {item.text}
                      </p>
                    </div>
                  </Link>
                </article>
              );
            })}
      </div>

      {/* ---------------- DESKTOP (Embla Slider) ---------------- */}
      <div className="hidden md:block">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <article
                    key={`d-skel-${i}`}
                    className="
                      flex flex-col border rounded-lg
                      shrink-0 w-[320px]
                      animate-pulse
                    "
                  >
                    <div className="rounded-lg overflow-hidden">
                      <div className="w-full h-48 bg-muted" />
                    </div>
                    <div className="pt-4 p-2 space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-11/12" />
                      <div className="h-3 bg-muted rounded w-10/12" />
                    </div>
                  </article>
                ))
              : items.map((item: any) => {
                  const imgSrc = joinUrl(storageBase, item.photo);

                  return (
                    <article
                      key={`d-${item.id}`}
                      className="
                        border rounded-lg
                        shrink-0 w-[320px]
                        hover:shadow-sm transition
                      "
                    >
                      <Link
                        href={`/blogs/${item.id}`}
                        aria-label={t("openArticle", { title: item.title })}
                        className="flex flex-col cursor-pointer group"
                      >
                        <div className="rounded-lg overflow-hidden">
                          <Image
                            src={imgSrc}
                            alt={item.title}
                            width={400}
                            height={240}
                            className="w-full h-48 object-cover"
                          />
                        </div>

                        <div className="pt-4 p-2">
                          <h3 className="text-foreground font-bold text-base mb-3 leading-relaxed line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4">
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