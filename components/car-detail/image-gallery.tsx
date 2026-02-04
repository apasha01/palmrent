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

// ✅ از env یا constant خودت استفاده کن
const STORAGE_URL =
  (process.env.NEXT_PUBLIC_STORAGE_URL || "").replace(/\/+$/, "") || "";

// -------------------- Types --------------------
type MediaItem =
  | { type: "image"; src: string }
  | { type: "video"; src: string; poster?: string };

export interface ImageGalleryProps {
  /**
   * ✅ فقط یک ورودی:
   * ترکیبی از عکس/ویدیو
   * مثال: [car.video, ...car.photos]
   */
  media?: Array<string | null | undefined>;
}

// -------------------- Utils --------------------
function toFaNumber(n: number | string) {
  const num = typeof n === "string" ? Number(n) : n;
  if (Number.isNaN(num)) return String(n);
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(
    num,
  );
}

/** تشخیص نوع از روی آدرس */
function guessType(path: string): "image" | "video" {
  const p = (path || "").toLowerCase();
  if (
    p.endsWith(".mp4") ||
    p.endsWith(".mov") ||
    p.endsWith(".webm") ||
    p.endsWith(".m3u8") ||
    p.includes("video")
  )
    return "video";
  return "image";
}

/**
 * ✅ نرمال‌سازی src + چسباندن STORAGE_URL اگر مسیر نسبی بود
 */
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
  const poster =
    (videoItem && videoItem.type === "video"
      ? normalizeMediaSrc(videoItem.poster)
      : null) ||
    normalizeMediaSrc(media.find((m) => m.type === "image")?.src) ||
    "/placeholder.svg";
  return poster;
}

/** Prefetch فقط برای عکس (اختیاری) */
function prefetchImage(src: string) {
  if (typeof window === "undefined") return;
  const img = new window.Image();
  img.decoding = "async";
  img.loading = "eager";
  img.src = src;
}

// -------------------- Component --------------------
export function ImageGallery({ media: mediaInput = [] }: ImageGalleryProps) {
  /**
   * ✅ 1) پاکسازی + نرمال کردن + حذف null/empty
   * ✅ 2) تشخیص نوع
   * ✅ 3) مرتب‌سازی: ویدیوها اول، بعد عکس‌ها
   */
  const media: MediaItem[] = useMemo(() => {
    const cleaned = (Array.isArray(mediaInput) ? mediaInput : [])
      .map((x) => normalizeMediaSrc(x))
      .filter((x): x is string => typeof x === "string" && x.length > 0);

    const items: MediaItem[] = cleaned.map((src) => {
      const t = guessType(src);
      return t === "video"
        ? ({ type: "video", src } as MediaItem)
        : ({ type: "image", src } as MediaItem);
    });

    const videos = items.filter((m) => m.type === "video");
    const images = items.filter((m) => m.type === "image");

    return [...videos, ...images];
  }, [mediaInput]);

  // ✅ Hero همیشه اولین آیتم بعد از sort
  const heroIndex = 0;

  // ۴ آیتم کوچیک غیر از hero (فقط برای دسکتاپ)
  const gridItems = useMemo(() => {
    const others = media.filter((_, i) => i !== heroIndex);
    return others.slice(0, 4);
  }, [media]);

  const totalCount = media.length;

  // Modal state
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(
    null,
  );
  const [isSliding, setIsSliding] = useState(false);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  // ✅ جلوگیری از “چسبیدن تصویر قبلی”
  const [viewerLoading, setViewerLoading] = useState(true);

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

  // Scroll thumb into view
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

  // Keyboard navigation
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

  // Prefetch next/prev images (اختیاری)
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
      {/* ✅ Wrapper overflow hidden */}
      <div className="relative w-full overflow-hidden rounded">
        {/* ========================= */}
        {/* ✅ Mobile: swipe gallery */}
        {/* ========================= */}
        <div className="md:hidden">
          <div
            className={cn(
              "flex overflow-x-auto overflow-y-hidden gap-4",
              "snap-x snap-mandatory",

              "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              // ✅ فاصله داخلی برای اینکه rounded آخر/اول قطع نشه
              "px-3 ",
            )}
          >
            {media.map((item, idx) => {
              const isVideo = item.type === "video";
              const src = isVideo
                ? getSafePoster(media, item)
                : getMediaSrc(item);

              const isFirst = idx === 0; // ✅ سمت راست (RTL)
              const isLast = idx === media.length - 1; // ✅ سمت چپ

              return (
                <button
                  key={`m-${idx}-${item.type}-${item.src}`}
                  type="button"
                  onClick={() => openAt(idx)}
                  className={cn(
                    "relative shrink-0",
                    "w-[90%] h-[240px]",
                    "snap-start",
                    // ✅ مهم: بین آیتم‌ها gap نداریم که یک‌تکه دیده بشه
                    idx !== 0 ? "-mr-2" : "",

                    // ✅ فقط اولی و آخری rounded دارند
                    "overflow-hidden rounded-none",
                    isFirst && "rounded-r-xl",
                    isLast && "rounded-l-xl",
                  )}
                >
                  <Image
                    src={src}
                    alt={`media ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="90vw"
                    loading="lazy"
                  />

                  {isVideo && (
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                        <Play
                          className="w-5 h-5 text-emerald-600 mr-[-2px]"
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

        {/* ========================= */}
        {/* ✅ Desktop: grid gallery */}
        {/* ========================= */}
        <div className="hidden md:block">
          <div className="grid grid-cols-4 gap-1.5 h-[280px] sm:h-[340px] md:h-[400px]">
            {/* Hero (کمتر شد: 2 از 4) */}
            <button
              type="button"
              onClick={() => openAt(heroIndex)}
              className="relative col-span-2 overflow-hidden rounded cursor-pointer group"
            >
              {hero?.type === "video" ? (
                <>
                  <Image
                    src={heroPoster}
                    alt="ویدیو"
                    fill
                    className="object-cover transition-all duration-500 group-hover:brightness-90"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full blur-xl scale-150 animate-pulse" />
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-2xl transition-transform duration-300 group-hover:scale-110">
                        <Play
                          className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600 mr-[-3px]"
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
                    alt="تصویر اصلی"
                    fill
                    className="object-cover transition-all duration-500 group-hover:brightness-95"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </>
              )}
            </button>

            {/* ۴ آیتم (بزرگ‌تر شدن: 2 از 4) */}
            <div className="col-span-2 grid grid-cols-2 grid-rows-2 gap-1.5">
              {gridItems.map((item, idx) => {
                const realIndex = media.findIndex(
                  (m) => m.src === item.src && m.type === item.type,
                );
                const safeIndex = realIndex >= 0 ? realIndex : 0;

                const thumbSrc =
                  item.type === "video"
                    ? getSafePoster(media, item)
                    : getMediaSrc(item);

                return (
                  <button
                    key={`${item.type}-${idx}-${item.src}`}
                    type="button"
                    onClick={() => openAt(safeIndex)}
                    className="relative overflow-hidden rounded cursor-pointer group"
                  >
                    <Image
                      src={thumbSrc}
                      alt={`آیتم ${idx + 1}`}
                      fill
                      className="object-cover transition-all duration-500 group-hover:brightness-90"
                      sizes="(max-width: 768px) 50vw, 25vw"
                      loading="lazy"
                    />

                    {item.type === "video" && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                          <Play
                            className="w-4 h-4 text-emerald-600 mr-[-2px]"
                            fill="currentColor"
                          />
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ✅ Badge (همه جا) */}
        <button
          type="button"
          onClick={() => openAt(0)}
          className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg hover:bg-white transition-colors duration-200 cursor-pointer"
        >
          <Images className="w-4 h-4" />
          <span>{toFaNumber(totalCount)} تصاویر </span>
        </button>
      </div>

      {/* ========================= */}
      {/* Full Gallery Modal */}
      {/* ========================= */}
      {open && (
        <div
          className={cn(
            "fixed inset-0 z-[9999] transition-all duration-200",
            isAnimating ? "opacity-0" : "opacity-100",
          )}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/95 backdrop-blur-md"
            onClick={close}
          />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col">
            {/* Header */}
            <div className="relative z-20 flex items-center justify-between p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <span className="text-white font-medium">
                    {toFaNumber(active + 1)} از {toFaNumber(media.length)}
                  </span>
                </div>

                {media[active]?.type === "video" && (
                  <div className="bg-emerald-500/20 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                    <Play
                      className="w-4 h-4 text-emerald-400"
                      fill="currentColor"
                    />
                    <span className="text-emerald-400 text-sm font-medium">
                      ویدیو
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={close}
                className="h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-200 group"
                aria-label="بستن"
              >
                <X className="h-5 w-5 text-white group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            {/* Main Viewer */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-16 pb-4">
              <div className="relative w-full max-w-6xl h-full max-h-[70vh]">
                {media[active]?.type === "video" ? (
                  <VideoPlayer src={getMediaSrc(media[active])} />
                ) : (
                  <div
                    className={cn(
                      "relative w-full h-full transition-all duration-300 ease-out",
                      isSliding &&
                        slideDirection === "left" &&
                        "opacity-0 -translate-x-8 scale-95",
                      isSliding &&
                        slideDirection === "right" &&
                        "opacity-0 translate-x-8 scale-95",
                      !isSliding && "opacity-100 translate-x-0 scale-100",
                    )}
                  >
                    {viewerLoading && (
                      <div className="absolute inset-0 rounded-xl bg-white/5" />
                    )}

                    <Image
                      key={getMediaSrc(media[active])}
                      src={getMediaSrc(media[active])}
                      alt={`تصویر ${active + 1}`}
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

                {/* Navigation Arrows */}
                {media.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={next}
                      className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-4 z-20 h-12 w-12 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center transition-all duration-200 group"
                      aria-label="قبلی"
                    >
                      <ChevronRight className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={prev}
                      className="absolute top-1/2 -translate-y-1/2 left-2 sm:left-4 z-20 h-12 w-12 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center transition-all duration-200 group"
                      aria-label="بعدی"
                    >
                      <ChevronLeft className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {media.length > 1 && (
              <div className="relative z-20 pb-6 px-4">
                <div className="max-w-5xl mx-auto">
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div
                      ref={thumbnailsRef}
                      className="flex gap-2 justify-center"
                    >
                      {media.map((m, i) => {
                        const isActive = i === active;
                        const thumbSrc =
                          m.type === "video"
                            ? getSafePoster(media, m)
                            : getMediaSrc(m);

                        return (
                          <button
                            key={`thumb-${i}-${m.type}-${m.src}`}
                            type="button"
                            onClick={() => {
                              if (i !== active) {
                                setSlideDirection(
                                  i > active ? "left" : "right",
                                );
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
                              "relative h-14 w-20 sm:h-16 sm:w-24 overflow-hidden rounded-xl shrink-0 transition-all duration-300",
                              isActive
                                ? "ring-2 ring-white shadow-lg shadow-white/20 scale-110"
                                : "opacity-40 hover:opacity-70 hover:scale-105",
                            )}
                          >
                            <Image
                              src={thumbSrc}
                              alt={`thumbnail ${i + 1}`}
                              fill
                              className="object-cover"
                              sizes="100px"
                              loading="lazy"
                            />
                            {m.type === "video" && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="h-6 w-6 rounded-full bg-white/90 flex items-center justify-center">
                                  <Play
                                    className="h-3 w-3 text-emerald-600 mr-[-1px]"
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

/**
 * Video Player Component
 */
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
      className="relative w-full h-full bg-black rounded-xl overflow-hidden group"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain"
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
            className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
          >
            <Play
              className="w-8 h-8 text-emerald-600 mr-[-3px]"
              fill="currentColor"
            />
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
          className="h-1.5 bg-white/30 rounded-full mb-4 cursor-pointer overflow-hidden"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 text-white" fill="currentColor" />
              ) : (
                <Play
                  className="h-5 w-5 text-white mr-[-2px]"
                  fill="currentColor"
                />
              )}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
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
            className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <Maximize2 className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
