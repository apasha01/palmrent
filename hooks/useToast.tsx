"use client";

import * as React from "react";
import { useMemo, useRef, useState } from "react";
import ToastBanner, { ToastVariant } from "@/components/ui/toast";

interface ToastState {
  text: string;
  variant: ToastVariant;
  triggerKey: number;
}

export interface ToastActions {
  error: (text: string) => void;
  success: (text: string) => void;
  warning: (text: string) => void;
  info: (text: string) => void;
}

interface UseToastReturn {
  ToastNode: React.ReactNode;
  toast: ToastActions;
}

export function useToast(options?: {
  pauseDuration?: number;
  mobilePosition?: { side: "top" | "bottom"; offset: number };
  desktopBottomOffset?: number;
}): UseToastReturn {
  const [state, setState] = useState<ToastState>({
    text: "",
    variant: "info",
    triggerKey: 0,
  });

  const show = useRef((text: string, variant: ToastVariant) => {
    const clean = String(text ?? "").trim();
    if (!clean) return;

    setState((prev) => ({
      text: clean,
      variant,
      triggerKey: prev.triggerKey + 1,
    }));
  });

  const toast = useMemo<ToastActions>(
    () => ({
      error: (text) => show.current(text, "error"),
      success: (text) => show.current(text, "success"),
      warning: (text) => show.current(text, "warning"),
      info: (text) => show.current(text, "info"),
    }),
    [],
  );

  const ToastNode = (
    <ToastBanner
      text={state.text}
      variant={state.variant}
      triggerKey={state.triggerKey}
      pauseDuration={options?.pauseDuration ?? 2800}
      mobilePosition={options?.mobilePosition ?? { side: "bottom", offset: 110 }}
      desktopBottomOffset={options?.desktopBottomOffset ?? 48}
    />
  );

  return { ToastNode, toast };
}