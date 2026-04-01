"use client"

import { cn } from "@/lib/utils"

type Direction = "left" | "right"

type Props = {
  direction?: Direction
  className?: string
}

export default function CalendarArrow({ direction = "right", className }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(className)}
    >
      {/* بدنه تقویم با گوشه‌های گرد */}
      <rect x="3" y="4" width="18" height="17" rx="4" />

      {/* حلقه‌های بالای تقویم */}
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />

      {/* خط جداکننده */}
      <line x1="3" y1="10" x2="21" y2="10" />

      {/* فلش چپ */}
      {direction === "left" && (
        <>
          <line x1="16" y1="16" x2="9" y2="16" />
          <polyline points="12,13 9,16 12,19" />
        </>
      )}

      {/* فلش راست */}
      {direction === "right" && (
        <>
          <line x1="8" y1="16" x2="15" y2="16" />
          <polyline points="12,13 15,16 12,19" />
        </>
      )}
    </svg>
  )
}