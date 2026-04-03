/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import Image from "next/image";
import {
  Play,
  Images,
  X,
  ChevronLeft,
  ChevronRight,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const STORAGE_URL =
  (process.env.NEXT_PUBLIC_STORAGE_URL || "").replace(/\/+$/, "") || "";

type MediaItem =
  | { type: "image"; src: string }
  | { type: "video"; src: string; poster?: string };

export interface ImageGalleryProps {
  media?: Array<string | null | undefined>;
  carTitle?: string;
}

function guessType(path: string): "image" | "video" {
  const p = (path || "").toLowerCase();
  if (
    p.endsWith(".mp4") ||
    p.endsWith(".mov") ||
    p.endsWith(".webm") ||
    p.endsWith(".m3u8") ||
    p.includes("video")
  ) {
    return "video";
  }
  return "image";
}

function normalizeMediaSrc(src?: string | null): string | null {
  if (!src) return null;
  const s = String(src).trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("//")) return `https:${s}`;
  const path = s.startsWith("/") ? s : `/${s}`;
  if (STORAGE_URL) return `${STORAGE_URL}${path}`;
  return path;
}

function getMediaSrc(item: MediaItem | undefined | null): string {
  const normalized = normalizeMediaSrc(item?.src);
  return normalized || "/placeholder.svg";
}

function getSafePoster(
  media: MediaItem[],
  videoItem?: MediaItem | null,
): string {
  return (
    (videoItem && videoItem.type === "video"
      ? normalizeMediaSrc(videoItem.poster)
      : null) ||
    normalizeMediaSrc(media.find((m) => m.type === "image")?.src) ||
    "/placeholder.svg"
  );
}

function prefetchImage(src: string) {
  if (typeof window === "undefined") return;
  const img = new window.Image();
  img.decoding = "async";
  img.loading = "eager";
  img.src = src;
}

function buildImageAlt(
  carTitle: string | undefined,
  index: number,
  total: number,
): string {
  const safeTitle = String(carTitle || "").trim();
  if (safeTitle) {
    return `${safeTitle} - image ${index} of ${total}`;
  }
  return `Gallery image ${index} of ${total}`;
}

function buildMainImageAlt(carTitle?: string): string {
  const safeTitle = String(carTitle || "").trim();
  if (safeTitle) {
    return `${safeTitle} - main image`;
  }
  return "Main gallery image";
}

function buildVideoAlt(carTitle?: string): string {
  const safeTitle = String(carTitle || "").trim();
  if (safeTitle) {
    return `${safeTitle} - video thumbnail`;
  }
  return "Video thumbnail";
}

function buildThumbAlt(
  carTitle: string | undefined,
  index: number,
  total: number,
): string {
  const safeTitle = String(carTitle || "").trim();
  if (safeTitle) {
    return `${safeTitle} - thumbnail ${index} of ${total}`;
  }
  return `Thumbnail ${index} of ${total}`;
}

export function ImageGallery({
  media: mediaInput = [],
  carTitle,
}: ImageGalleryProps) {
  const t = useTranslations("imageGallery");

  const media: MediaItem[] = useMemo(() => {
    const cleaned = (Array.isArray(mediaInput) ? mediaInput : [])
      .map((x) => normalizeMediaSrc(x))
      .filter((x): x is string => typeof x === "string" && x.length > 0);

    const items: MediaItem[] = cleaned.map((src) => {
      const type = guessType(src);
      return type === "video"
        ? ({ type: "video", src } as MediaItem)
        : ({ type: "image", src } as MediaItem);
    });

    return [
      ...items.filter((m) => m.type === "video"),
      ...items.filter((m) => m.type === "image"),
    ];
  }, [mediaInput]);

  const heroIndex = 0;

  const gridItems = useMemo(() => {
    return media.filter((_, i) => i !== heroIndex).slice(0, 4);
  }, [media]);

  const totalCount = media.length;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(
    null,
  );
  const [isSliding, setIsSliding] = useState(false);
  const [viewerLoading, setViewerLoading] = useState(true);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  const openAt = useCallback(
    (index: number) => {
      const safe = media.length
        ? Math.max(0, Math.min(index, media.length - 1))
        : 0;
      setActive(safe);
      setViewerLoading(true);
      setOpen(true);
      document.body.style.overflow = "hidden";
    },
    [media.length],
  );

  const close = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setOpen(false);
      setIsAnimating(false);
      document.body.style.overflow = "";
    }, 200);
  }, []);

  const next = useCallback(() => {
    if (isSliding || !media.length) return;
    setSlideDirection("left");
    setIsSliding(true);
    setTimeout(() => {
      setActive((p) => (p + 1) % media.length);
      setViewerLoading(true);
      setSlideDirection(null);
      setIsSliding(false);
    }, 220);
  }, [media.length, isSliding]);

  const prev = useCallback(() => {
    if (isSliding || !media.length) return;
    setSlideDirection("right");
    setIsSliding(true);
    setTimeout(() => {
      setActive((p) => (p - 1 + media.length) % media.length);
      setViewerLoading(true);
      setSlideDirection(null);
      setIsSliding(false);
    }, 220);
  }, [media.length, isSliding]);

  useEffect(() => {
    if (!open) return;
    if (thumbnailsRef.current) {
      const activeThumb = thumbnailsRef.current.children[active] as
        | HTMLElement
        | undefined;
      activeThumb?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [active, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") prev();
      if (e.key === "ArrowLeft") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, next, prev]);

  useEffect(() => {
    if (!open) return;
    const current = media[active];
    if (!current || current.type !== "image") return;
    const nextIdx = (active + 1) % media.length;
    const prevIdx = (active - 1 + media.length) % media.length;
    const n = media[nextIdx];
    const p = media[prevIdx];
    if (n?.type === "image") prefetchImage(getMediaSrc(n));
    if (p?.type === "image") prefetchImage(getMediaSrc(p));
  }, [active, open, media]);

  if (media.length === 0) return null;

  const hero = media[heroIndex];
  const heroPoster = getSafePoster(media, hero);

  return (
    <>
      <div className="relative w-full overflow-hidden rounded">
        {/* Mobile */}
        <div className="md:hidden">
          <div
            className={cn(
              "flex overflow-x-auto overflow-y-hidden gap-4",
              "snap-x snap-mandatory",
              "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              "px-3",
            )}
          >
            {media.map((item, idx) => {
              const isVideo = item.type === "video";
              const src = isVideo ? getSafePoster(media, item) : getMediaSrc(item);
              const isFirst = idx === 0;
              const isLast = idx === media.length - 1;

              return (
                <button
                  key={`m-${idx}-${item.type}-${item.src}`}
                  type="button"
                  onClick={() => openAt(idx)}
                  className={cn(
                    "relative shrink-0 w-[90%] h-[240px] snap-start",
                    idx !== 0 ? "-mr-2" : "",
                    "overflow-hidden rounded-none",
                    isFirst && "rounded-r-xl",
                    isLast && "rounded-l-xl",
                  )}
                  aria-label={
                    isVideo
                      ? `${buildVideoAlt(carTitle)} ${idx + 1}`
                      : buildImageAlt(carTitle, idx + 1, media.length)
                  }
                >
                  <Image
                    src={src}
                    alt={
                      isVideo
                        ? buildVideoAlt(carTitle)
                        : buildImageAlt(carTitle, idx + 1, media.length)
                    }
                    fill
                    className="object-cover"
                    sizes="90vw"
                    loading="lazy"
                  />
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90">
                        <Play
                          className="mr-[-2px] h-5 w-5 text-emerald-600"
                          fill="currentColor"
                        />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <div className="grid h-[280px] grid-cols-4 gap-1.5 sm:h-[340px] md:h-[400px]">
            <button
              type="button"
              onClick={() => openAt(heroIndex)}
              className="group relative col-span-2 overflow-hidden rounded cursor-pointer"
              aria-label={
                hero?.type === "video"
                  ? buildVideoAlt(carTitle)
                  : buildMainImageAlt(carTitle)
              }
            >
              {hero?.type === "video" ? (
                <>
                  <Image
                    src={heroPoster}
                    alt={buildVideoAlt(carTitle)}
                    fill
                    className="object-cover transition-all duration-500 group-hover:brightness-90"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 scale-150 animate-pulse rounded-full blur-xl" />
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-2xl backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 sm:h-20 sm:w-20">
                        <Play
                          className="mr-[-3px] h-7 w-7 text-emerald-600 sm:h-8 sm:w-8"
                          fill="currentColor"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Image
                    src={getMediaSrc(hero)}
                    alt={buildMainImageAlt(carTitle)}
                    fill
                    className="object-cover transition-all duration-500 group-hover:brightness-95"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </>
              )}
            </button>

            <div className="col-span-2 grid grid-cols-2 grid-rows-2 gap-1.5">
              {gridItems.map((item, idx) => {
                const realIndex = media.findIndex(
                  (m) => m.src === item.src && m.type === item.type,
                );
                const safeIndex = realIndex >= 0 ? realIndex : 0;
                const thumbSrc =
                  item.type === "video" ? getSafePoster(media, item) : getMediaSrc(item);

                return (
                  <button
                    key={`${item.type}-${idx}-${item.src}`}
                    type="button"
                    onClick={() => openAt(safeIndex)}
                    className="group relative overflow-hidden rounded cursor-pointer"
                    aria-label={
                      item.type === "video"
                        ? buildVideoAlt(carTitle)
                        : buildImageAlt(carTitle, safeIndex + 1, media.length)
                    }
                  >
                    <Image
                      src={thumbSrc}
                      alt={
                        item.type === "video"
                          ? buildVideoAlt(carTitle)
                          : buildImageAlt(carTitle, safeIndex + 1, media.length)
                      }
                      fill
                      className="object-cover transition-all duration-500 group-hover:brightness-90"
                      sizes="(max-width: 768px) 50vw, 25vw"
                      loading="lazy"
                    />
                    {item.type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
                          <Play
                            className="mr-[-2px] h-4 w-4 text-emerald-600"
                            fill="currentColor"
                          />
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Badge */}
        <button
          type="button"
          onClick={() => openAt(0)}
          className="absolute bottom-4 left-4 flex cursor-pointer items-center gap-2 rounded-xl bg-white/95 px-4 py-2 text-sm font-medium text-gray-800 shadow-lg backdrop-blur-sm transition-colors duration-200 hover:bg-white"
          aria-label={t("totalImages", { count: totalCount })}
        >
          <Images className="h-4 w-4" />
          <span>{t("totalImages", { count: totalCount })}</span>
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div
          className={cn(
            "fixed inset-0 z-[9999] transition-all duration-200",
            isAnimating ? "opacity-0" : "opacity-100",
          )}
        >
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={close} />

          <div className="absolute inset-0 flex flex-col">
            {/* Header */}
            <div className="relative z-20 flex items-center justify-between p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                  <span className="font-medium text-white">
                    {t("counter", { current: active + 1, total: media.length })}
                  </span>
                </div>

                {media[active]?.type === "video" && (
                  <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1.5 backdrop-blur-sm">
                    <Play className="h-4 w-4 text-emerald-400" fill="currentColor" />
                    <span className="text-sm font-medium text-emerald-400">
                      {t("videoLabel")}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={close}
                className="group flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
                aria-label={t("close")}
              >
                <X className="h-5 w-5 text-white transition-transform duration-200 group-hover:rotate-90" />
              </button>
            </div>

            {/* Viewer */}
            <div className="flex flex-1 items-center justify-center px-4 pb-4 sm:px-16">
              <div className="relative h-full max-h-[70vh] w-full max-w-6xl">
                {media[active]?.type === "video" ? (
                  <VideoPlayer src={getMediaSrc(media[active])} />
                ) : (
                  <div
                    className={cn(
                      "relative h-full w-full transition-all duration-300 ease-out",
                      isSliding &&
                        slideDirection === "left" &&
                        "opacity-0 -translate-x-8 scale-95",
                      isSliding &&
                        slideDirection === "right" &&
                        "opacity-0 translate-x-8 scale-95",
                      !isSliding && "translate-x-0 scale-100 opacity-100",
                    )}
                  >
                    {viewerLoading && (
                      <div className="absolute inset-0 rounded-xl bg-white/5" />
                    )}
                    <Image
                      key={getMediaSrc(media[active])}
                      src={getMediaSrc(media[active])}
                      alt={buildImageAlt(carTitle, active + 1, media.length)}
                      fill
                      className={cn(
                        "object-contain transition-opacity duration-200",
                        viewerLoading ? "opacity-0" : "opacity-100",
                      )}
                      sizes="100vw"
                      loading="lazy"
                      onLoad={() => setViewerLoading(false)}
                      onLoadingComplete={() => setViewerLoading(false)}
                      onError={() => setViewerLoading(false)}
                    />
                  </div>
                )}

                {media.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={next}
                      className="group absolute right-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all duration-200 hover:bg-white/25 sm:right-4"
                      aria-label={t("prev")}
                    >
                      <ChevronRight className="h-6 w-6 text-white transition-transform group-hover:scale-110" />
                    </button>

                    <button
                      type="button"
                      onClick={prev}
                      className="group absolute left-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all duration-200 hover:bg-white/25 sm:left-4"
                      aria-label={t("next")}
                    >
                      <ChevronLeft className="h-6 w-6 text-white transition-transform group-hover:scale-110" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {media.length > 1 && (
              <div className="relative z-20 px-4 pb-6">
                <div className="mx-auto max-w-5xl">
                  <div className="overflow-x-auto rounded-2xl bg-white/5 p-3 backdrop-blur-md [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div ref={thumbnailsRef} className="flex justify-center gap-2">
                      {media.map((m, i) => {
                        const isActive = i === active;
                        const thumbSrc =
                          m.type === "video" ? getSafePoster(media, m) : getMediaSrc(m);

                        return (
                          <button
                            key={`thumb-${i}-${m.type}-${m.src}`}
                            type="button"
                            onClick={() => {
                              if (i !== active) {
                                setSlideDirection(i > active ? "left" : "right");
                                setIsSliding(true);
                                setViewerLoading(true);
                                setTimeout(() => {
                                  setActive(i);
                                  setSlideDirection(null);
                                  setIsSliding(false);
                                }, 220);
                              }
                            }}
                            className={cn(
                              "relative h-14 w-20 shrink-0 overflow-hidden rounded-xl transition-all duration-300 sm:h-16 sm:w-24",
                              isActive
                                ? "scale-110 ring-2 ring-white shadow-lg shadow-white/20"
                                : "opacity-40 hover:scale-105 hover:opacity-70",
                            )}
                            aria-label={
                              m.type === "video"
                                ? buildVideoAlt(carTitle)
                                : buildThumbAlt(carTitle, i + 1, media.length)
                            }
                          >
                            <Image
                              src={thumbSrc}
                              alt={
                                m.type === "video"
                                  ? buildVideoAlt(carTitle)
                                  : buildThumbAlt(carTitle, i + 1, media.length)
                              }
                              fill
                              className="object-cover"
                              sizes="100px"
                              loading="lazy"
                            />
                            {m.type === "video" && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90">
                                  <Play
                                    className="mr-[-1px] h-3 w-3 text-emerald-600"
                                    fill="currentColor"
                                  />
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) v.pause();
    else v.play();
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else v.requestFullscreen();
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const prog = (v.currentTime / v.duration) * 100;
    setProgress(Number.isFinite(prog) ? prog : 0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(1, Math.max(0, x / rect.width));
    v.currentTime = percentage * v.duration;
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const hideControls = () => {
      timeout = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };
    hideControls();
    return () => clearTimeout(timeout);
  }, [isPlaying]);

  return (
    <div
      className="group relative h-full w-full overflow-hidden rounded-xl bg-black"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-contain"
        src={src}
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 shadow-2xl transition-transform hover:scale-110"
            aria-label="Play video"
          >
            <Play className="mr-[-3px] h-8 w-8 text-emerald-600" fill="currentColor" />
          </button>
        </div>
      )}

      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0",
        )}
      >
        <div
          className="mb-4 h-1.5 cursor-pointer overflow-hidden rounded-full bg-white/30"
          onClick={handleSeek}
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
              aria-label={isPlaying ? "Pause video" : "Play video"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 text-white" fill="currentColor" />
              ) : (
                <Play className="mr-[-2px] h-5 w-5 text-white" fill="currentColor" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
              aria-label={isMuted ? "Unmute video" : "Mute video"}
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5 text-white" />
              ) : (
                <Volume2 className="h-5 w-5 text-white" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
            aria-label="Fullscreen video"
          >
            <Maximize2 className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}