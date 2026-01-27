"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type CheckboxVariant = "primary" | "success" | "info" | "warning" | "danger";
type CheckboxSize = "sm" | "md" | "lg";

type Props = React.ComponentProps<typeof CheckboxPrimitive.Root> & {
  variant?: CheckboxVariant;
  size?: CheckboxSize;
};

const variantClasses: Record<CheckboxVariant, string> = {
  primary: cn(
    // unchecked
    "border-input text-foreground",
    // checked
    "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
    "dark:data-[state=checked]:bg-primary",
    // focus ring
    "focus-visible:ring-primary/25 focus-visible:border-primary",
  ),

  success: cn(
    "border-emerald-300 text-foreground dark:border-emerald-900/70",
    "data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white",
    "dark:data-[state=checked]:bg-emerald-600",
    "focus-visible:ring-emerald-500/25 focus-visible:border-emerald-600",
  ),

  info: cn(
    "border-sky-300 text-foreground dark:border-sky-900/70",
    "data-[state=checked]:bg-sky-600 data-[state=checked]:border-sky-600 data-[state=checked]:text-white",
    "dark:data-[state=checked]:bg-sky-600",
    "focus-visible:ring-sky-500/25 focus-visible:border-sky-600",
  ),

  warning: cn(
    "border-amber-300 text-foreground dark:border-amber-900/70",
    "data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 data-[state=checked]:text-white",
    "dark:data-[state=checked]:bg-amber-500",
    "focus-visible:ring-amber-500/25 focus-visible:border-amber-500",
  ),

  danger: cn(
    "border-rose-300 text-foreground dark:border-rose-900/70",
    "data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600 data-[state=checked]:text-white",
    "dark:data-[state=checked]:bg-rose-600",
    "focus-visible:ring-rose-500/25 focus-visible:border-rose-600",
  ),
};

const sizeClasses: Record<CheckboxSize, string> = {
  sm: "size-4 rounded-[4px]",
  md: "size-5 rounded-[5px]",
  lg: "size-6 rounded-[6px]",
};

const indicatorIconSize: Record<CheckboxSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-4.5",
};

function Checkbox({
  className,
  variant = "primary",
  size = "md",
  ...props
}: Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // base
        "peer shrink-0 border shadow-xs transition-shadow outline-none",
        "bg-background dark:bg-input/30",
        "focus-visible:ring-[3px]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        // size + variant
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className={cn(indicatorIconSize[size])} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
export type { CheckboxVariant, CheckboxSize };
