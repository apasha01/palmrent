"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MobileSheetOptions {
  title?: string;
  content: ReactNode;
  height?: string;
  className?: string;
  onClose?: () => void;
}

interface MobileSheetContextValue {
  openSheet: (options: MobileSheetOptions) => void;
  closeSheet: () => void;
  isOpen: boolean;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const MobileSheetContext = createContext<MobileSheetContextValue | null>(null);

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMobileSheet(): MobileSheetContextValue {
  const ctx = useContext(MobileSheetContext);
  if (!ctx) {
    throw new Error("useMobileSheet must be used within <MobileSheetProvider>");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function MobileSheetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  // contentKey با هر openSheet جدید عوض میشه => محتوا حتما re-render میشه
  const [contentKey, setContentKey] = useState(0);
  const [options, setOptions] = useState<MobileSheetOptions | null>(null);

  // ✅ وقتی شیت در حال بسته شدن است، آپشن pending را نگه می‌داریم
  const pendingOptsRef = useRef<MobileSheetOptions | null>(null);
  const isClosingRef = useRef(false);
  const reopenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openSheet = useCallback((opts: MobileSheetOptions) => {


    if (isClosingRef.current) {
      // شیت در حال بستن است — بعد از انیمیشن باز می‌کنیم
      pendingOptsRef.current = opts;

      return;
    }

    if (isOpen) {

      pendingOptsRef.current = opts;
      isClosingRef.current = true;
      setIsOpen(false);
      // fallback: اگر onAnimationEnd trigger نشد (برخی مرورگرها)
      if (reopenTimerRef.current) clearTimeout(reopenTimerRef.current);
      reopenTimerRef.current = setTimeout(() => {

        if (pendingOptsRef.current) {
          const pending = pendingOptsRef.current;
          pendingOptsRef.current = null;
          isClosingRef.current = false;
          setOptions(pending);
          setContentKey((k) => k + 1);
          setIsOpen(true);
        }
      }, 350);
      return;
    }


    setOptions(opts);
    setContentKey((k) => k + 1);
    setIsOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const closeSheet = useCallback(() => {
    isClosingRef.current = true;
    setIsOpen(false);
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {

        isClosingRef.current = true;
        setIsOpen(false);
        options?.onClose?.();
      } else {
        setIsOpen(true);
      }
    },
    [options],
  );

  // ✅ بعد از پایان انیمیشن بستن
  const handleAnimationEnd = useCallback(() => {
    if (!isOpen) {

      if (reopenTimerRef.current) {
        clearTimeout(reopenTimerRef.current);
        reopenTimerRef.current = null;
      }

      isClosingRef.current = false;

      if (pendingOptsRef.current) {
        const pending = pendingOptsRef.current;
        pendingOptsRef.current = null;
        setOptions(pending);
        setContentKey((k) => k + 1);
        setIsOpen(true);
      } else {
        setOptions(null);
      }
    }
  }, [isOpen]);

  const value = useMemo<MobileSheetContextValue>(
    () => ({ openSheet, closeSheet, isOpen }),
    [openSheet, closeSheet, isOpen],
  );

  const sheetHeight = options?.height ?? "100dvh";

  return (
    <MobileSheetContext.Provider value={value}>
      {children}

      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent
          showCloseButton={false}
          side="right"
          className={`overflow-y-auto w-full z-50 ${options?.className ?? ""}`}
          style={{ height: sheetHeight }}
          onAnimationEnd={handleAnimationEnd}
        >
          {/* ✅ contentKey تضمین میکنه محتوا با هر openSheet جدید re-mount بشه */}
          <div key={contentKey}>{options?.content}</div>
        </SheetContent>
      </Sheet>
    </MobileSheetContext.Provider>
  );
}
