import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // ===== Solid =====
        // ✅ Primary آبی واقعی
        primary:
          "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/30",
        // اگر میخوای default هم مثل primary آبی باشه:
        default:
          "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/30",

        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",

        success:
          "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600/30",
        warning:
          "bg-amber-500 text-black hover:bg-amber-600 focus-visible:ring-amber-500/30",
        info:
          "bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-sky-600/30",

        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        danger:
          "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600/30",

        muted: "bg-muted text-foreground hover:bg-muted/80",

        // ===== Outline =====
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",

        // ✅ Outline primary آبی
        "outline-primary":
          "border border-blue-600 text-blue-700 bg-transparent hover:bg-blue-600 hover:text-white focus-visible:ring-blue-600/20 dark:text-blue-400 dark:border-blue-500",

        "outline-success":
          "border border-emerald-600 text-emerald-700 bg-transparent hover:bg-emerald-600 hover:text-white focus-visible:ring-emerald-600/20 dark:text-emerald-400",
        "outline-warning":
          "border border-amber-500 text-amber-700 bg-transparent hover:bg-amber-500 hover:text-black focus-visible:ring-amber-500/20 dark:text-amber-400",
        "outline-info":
          "border border-sky-600 text-sky-700 bg-transparent hover:bg-sky-600 hover:text-white focus-visible:ring-sky-600/20 dark:text-sky-400",
        "outline-danger":
          "border border-red-600 text-red-700 bg-transparent hover:bg-red-600 hover:text-white focus-visible:ring-red-600/20 dark:text-red-400",

        // ===== Soft =====
        // ✅ Soft primary آبی
        "soft-primary":
          "bg-blue-600/10 text-blue-700 hover:bg-blue-600/15 focus-visible:ring-blue-600/20 dark:text-blue-400",

        "soft-success":
          "bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/15 focus-visible:ring-emerald-600/20 dark:text-emerald-400",
        "soft-warning":
          "bg-amber-500/15 text-amber-800 hover:bg-amber-500/20 focus-visible:ring-amber-500/20 dark:text-amber-400",
        "soft-info":
          "bg-sky-600/10 text-sky-700 hover:bg-sky-600/15 focus-visible:ring-sky-600/20 dark:text-sky-400",
        "soft-danger":
          "bg-red-600/10 text-red-700 hover:bg-red-600/15 focus-visible:ring-red-600/20 dark:text-red-400",

        // ===== Minimal =====
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-blue-700 underline-offset-4 hover:underline dark:text-blue-400",
      },

      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
