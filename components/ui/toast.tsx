"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Info, X, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";

export type ToastVariant = "info" | "success" | "warning" | "error";

interface ToastBannerProps {
  text: string;
  variant?: ToastVariant;
  triggerKey?: number;
  mobilePosition?: { side: "top" | "bottom"; offset: number };
  desktopBottomOffset?: number;
  pauseDuration?: number;
  onClose?: () => void;
}

const VARIANT_CONFIG: Record<
  ToastVariant,
  { bg: string; icon: React.ReactNode }
> = {
  info: {
    bg: "#222",
    icon: <Info size={18} strokeWidth={2.2} color="#fff" />,
  },
  success: {
    bg: "#16a34a",
    icon: <CheckCircle size={18} strokeWidth={2.2} color="#fff" />,
  },
  warning: {
    bg: "#d97706",
    icon: <AlertTriangle size={18} strokeWidth={2.2} color="#fff" />,
  },
  error: {
    bg: "#dc2626",
    icon: <AlertCircle size={18} strokeWidth={2.2} color="#fff" />,
  },
};

type CloseReason = "auto" | "manual" | "swipe";

export default function ToastBanner({
  text,
  variant = "info",
  triggerKey = 0,
  mobilePosition = { side: "bottom", offset: 80 },
  desktopBottomOffset = 48,
  pauseDuration = 2800,
  onClose,
}: ToastBannerProps) {
  const [visible, setVisible] = useState(false);
  const [animIn, setAnimIn] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const touchStartXRef = useRef<number | null>(null);
  const touchCurrentXRef = useRef<number | null>(null);
  const isSwipingRef = useRef(false);

  const clearAllTimers = () => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (animTimerRef.current) {
      clearTimeout(animTimerRef.current);
      animTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const resetSwipeRefs = () => {
    touchStartXRef.current = null;
    touchCurrentXRef.current = null;
    isSwipingRef.current = false;
  };

  const fullReset = () => {
    resetSwipeRefs();
    setDragX(0);
    setDragging(false);
  };

  const finishClose = (reason: CloseReason) => {
    clearAllTimers();

    if (reason === "swipe") {
      setDragging(false);
      setDragX(typeof window !== "undefined" ? -window.innerWidth : -500);
      setAnimIn(false);

      closeTimerRef.current = setTimeout(() => {
        setVisible(false);
        fullReset();
        onClose?.();
      }, 260);

      return;
    }

    if (reason === "manual") {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setDragging(false);
        setDragX(-window.innerWidth);
        setAnimIn(false);

        closeTimerRef.current = setTimeout(() => {
          setVisible(false);
          fullReset();
          onClose?.();
        }, 260);

        return;
      }

      setAnimIn(false);
      closeTimerRef.current = setTimeout(() => {
        setVisible(false);
        fullReset();
        onClose?.();
      }, 300);
      return;
    }

    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setDragging(false);
      setDragX(-window.innerWidth);
      setAnimIn(false);

      closeTimerRef.current = setTimeout(() => {
        setVisible(false);
        fullReset();
        onClose?.();
      }, 260);

      return;
    }

    setAnimIn(false);
    closeTimerRef.current = setTimeout(() => {
      setVisible(false);
      fullReset();
      onClose?.();
    }, 300);
  };

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  useEffect(() => {
    if (triggerKey <= 0 || !text?.trim()) return;

    clearAllTimers();
    resetSwipeRefs();

    showTimerRef.current = setTimeout(() => {
      setDragX(0);
      setDragging(false);
      setVisible(true);
      setAnimIn(false);

      animTimerRef.current = setTimeout(() => {
        setAnimIn(true);
      }, 20);

      timerRef.current = setTimeout(() => {
        finishClose("auto");
      }, pauseDuration);
    }, 0);

    return () => {
      clearAllTimers();
    };
  }, [triggerKey, text, pauseDuration]);

  const handleClose = () => {
    finishClose("manual");
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!visible) return;
    if (e.touches.length !== 1) return;

    clearAllTimers();

    const x = e.touches[0].clientX;
    touchStartXRef.current = x;
    touchCurrentXRef.current = x;
    isSwipingRef.current = true;
    setDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isSwipingRef.current) return;
    if (touchStartXRef.current == null) return;
    if (e.touches.length !== 1) return;

    const currentX = e.touches[0].clientX;
    touchCurrentXRef.current = currentX;

    const delta = currentX - touchStartXRef.current;
    setDragX(Math.min(0, delta));
  };

  const handleTouchEnd = () => {
    if (!isSwipingRef.current) {
      fullReset();
      return;
    }

    const startX = touchStartXRef.current;
    const currentX = touchCurrentXRef.current;

    if (startX == null || currentX == null) {
      fullReset();
      return;
    }

    const delta = currentX - startX;
    const shouldClose = delta < -90;

    if (shouldClose) {
      finishClose("swipe");
      return;
    }

    resetSwipeRefs();
    setDragging(false);
    setDragX(0);

    timerRef.current = setTimeout(() => {
      finishClose("auto");
    }, pauseDuration);
  };

  const mobileBaseTransform = dragging
    ? `translateX(${dragX}px)`
    : dragX < 0
      ? `translateX(${dragX}px)`
      : animIn
        ? "translateX(0px)"
        : "translateX(80px)";

  const mobileOpacity =
    dragging || dragX < 0
      ? (() => {
          const width =
            typeof window !== "undefined"
              ? Math.max(window.innerWidth, 320)
              : 400;
          const progress = Math.min(Math.abs(dragX) / (width * 0.7), 1);
          return Math.max(0, 1 - progress);
        })()
      : animIn
        ? 1
        : 0;

  const mobileTransition = dragging
    ? "none"
    : "transform 260ms ease, opacity 220ms ease";

  const desktopTransitionStyle: React.CSSProperties = {
    transition:
      "opacity 300ms ease, transform 300ms cubic-bezier(0.34,1.56,0.64,1)",
    opacity: animIn ? 1 : 0,
    transform: animIn
      ? "translateX(-50%) translateY(0) scale(1)"
      : "translateX(-50%) translateY(24px) scale(0.98)",
    pointerEvents: animIn ? "auto" : "none",
  };

  const cfg = VARIANT_CONFIG[variant];

  const card = (
    <div
      style={{
        background: cfg.bg,
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        boxShadow: "0 8px 30px rgba(0,0,0,0.22)",
        touchAction: "pan-y",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        {cfg.icon}
      </span>

      <span
        style={{
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          flex: 1,
          lineHeight: 1.5,
        }}
      >
        {text}
      </span>

      <button
        type="button"
        onClick={handleClose}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "rgba(255,255,255,0.75)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          padding: 2,
        }}
        aria-label="بستن"
      >
        <X size={16} />
      </button>
    </div>
  );

  if (!visible) return null;

  return (
    <>
      <div
        className="fixed md:hidden"
        style={{
          left: 14,
          right: 14,
          zIndex: 99999,
          ...(mobilePosition.side === "bottom"
            ? { bottom: mobilePosition.offset }
            : { top: mobilePosition.offset }),
          transform: mobileBaseTransform,
          opacity: mobileOpacity,
          transition: mobileTransition,
          pointerEvents: visible ? "auto" : "none",
          willChange: "transform, opacity",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {card}
      </div>

      <div
        className="hidden md:block fixed"
        style={{
          left: "50%",
          bottom: desktopBottomOffset,
          width: "min(560px, calc(100vw - 32px))",
          zIndex: 99999,
          ...desktopTransitionStyle,
        }}
      >
        {card}
      </div>
    </>
  );
}