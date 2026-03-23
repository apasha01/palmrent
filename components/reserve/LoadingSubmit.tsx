"use client";

import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

// ── keyframes ──────────────────────────────────────────────────────────────
const STYLES = `
@keyframes submitting-bounce {
  0%, 80%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.35;
  }
  40% {
    transform: translateY(-12px) scale(1.15);
    opacity: 1;
  }
}

@keyframes submitting-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0);   }
}

.submitting-dot {
  animation: submitting-bounce 1.2s ease-in-out infinite;
}

.submitting-content {
  animation: submitting-fade-in 0.3s ease-out forwards;
}
`;

function InjectStyle() {
  const injected = useRef(false);
  useEffect(() => {
    if (injected.current) return;
    injected.current = true;
    const id = "submitting-dialog-style";
    if (document.getElementById(id)) return;
    const tag = document.createElement("style");
    tag.id = id;
    tag.textContent = STYLES;
    document.head.appendChild(tag);
  }, []);
  return null;
}

// ── types ──────────────────────────────────────────────────────────────────
type Props = {
  open: boolean;
  /** Optional custom label. Falls back to i18n key "common.submitting" */
  label?: string;
};

// ── component ──────────────────────────────────────────────────────────────
export default function SubmittingDialog({ open, label }: Props) {
  const t = useTranslations("InformationStep");
  const displayLabel = label ?? t("common.submitting");

  return (
    <>
      <InjectStyle />

      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent
          showCloseButton={false}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className={cn(
            // ── mobile: fullscreen (same pattern as LoginDialog) ──
            "fixed inset-0 left-0 top-0 translate-x-0 translate-y-0",
            "h-dvh w-screen max-w-none rounded-none border-0 shadow-none",
            "p-0 gap-0 overflow-hidden bg-white",
            // ── desktop: centered dialog ──
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
            "sm:h-auto sm:w-full sm:max-w-xs",
            "sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-xl"
          )}
        >
          <DialogTitle className="sr-only">{displayLabel}</DialogTitle>

          {/* ── centered content wrapper ── */}
          <div className="flex h-dvh flex-col items-center justify-center gap-5 sm:h-auto sm:py-16 submitting-content">
            {/* ── animated dots ── */}
            <div className="flex items-end gap-2.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="submitting-dot block rounded-full bg-blue-500"
                  style={{
                    width: 11,
                    height: 11,
                    animationDelay: `${i * 0.16}s`,
                  }}
                />
              ))}
            </div>

            {/* ── label ── */}
            <p className="text-sm font-medium text-gray-400 tracking-wide select-none">
              {displayLabel}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}