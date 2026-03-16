"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, X } from "lucide-react";

interface ToastBannerProps {
  text: string;
  triggerKey?: number;
  mobilePosition?: { side: "top" | "bottom"; offset: number };
  desktopBottomOffset?: number;
  pauseDuration?: number;
  onClose?: () => void;
}

export default function ToastBanner({
  text,
  triggerKey = 0,
  mobilePosition = { side: "bottom", offset: 80 },
  desktopBottomOffset = 48,
  pauseDuration = 2800,
  onClose,
}: ToastBannerProps) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : true
  );
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, pauseDuration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [triggerKey, pauseDuration]);

  const close = () => {
    setVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleExitComplete = () => {
    onClose?.();
  };

  const card = (
    <div
      style={{
        background: "#222",
        borderRadius: 6,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
      }}
    >
      <Info size={16} color="#fff" strokeWidth={2.2} />
      <span style={{ color: "#fff", fontSize: 14, fontWeight: 600, flex: 1 }}>
        {text}
      </span>
      <button
        onClick={close}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "rgba(255,255,255,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={16} />
      </button>
    </div>
  );

  return (
    <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
      {visible &&
        (isMobile ? (
          <motion.div
            key="mobile-toast"
            drag="x"
            dragElastic={0.15}
            dragConstraints={{ left: -500, right: 500 }}
            onDragEnd={(_, info) => {
              if (
                Math.abs(info.offset.x) > 120 ||
                Math.abs(info.velocity.x) > 600
              ) {
                close();
              }
            }}
            initial={{ x: "110%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-120%", opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 30,
              mass: 0.9,
            }}
            style={{
              position: "fixed",
              right: 14,
              left: 14,
              zIndex: 9999,
              willChange: "transform",
              touchAction: "pan-y",
              ...(mobilePosition.side === "bottom"
                ? { bottom: mobilePosition.offset }
                : { top: mobilePosition.offset }),
            }}
          >
            {card}
          </motion.div>
        ) : (
          <motion.div
            key="desktop-toast"
            initial={{ y: 120, opacity: 0, x: "-50%" }}
            animate={{ y: 0, opacity: 1, x: "-50%" }}
            exit={{ y: 120, opacity: 0, x: "-50%" }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 26,
              mass: 0.9,
            }}
            style={{
              position: "fixed",
              left: "50%",
              bottom: desktopBottomOffset,
              width: 360,
              zIndex: 9999,
            }}
          >
            {card}
          </motion.div>
        ))}
    </AnimatePresence>
  );
}