"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type NativeTimeSelectProps = {
  value?: string | null;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
};

function normalizeTimeValue(value?: string | null) {
  const s = String(value ?? "").trim();
  if (!s) return "10:00";

  const m = s.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return "10:00";

  const hh = Math.min(23, Math.max(0, Number(m[1])));
  const mm = Math.min(59, Math.max(0, Number(m[2])));

  // فقط روی نیم‌ساعت‌ها قفل می‌کنیم
  const roundedMinutes = mm < 15 ? 0 : mm < 45 ? 30 : 0;
  const adjustedHour = mm >= 45 ? Math.min(23, hh + 1) : hh;

  return `${String(adjustedHour).padStart(2, "0")}:${String(roundedMinutes).padStart(2, "0")}`;
}

function buildHalfHourOptions() {
  const options: string[] = [];

  for (let hour = 0; hour < 24; hour++) {
    options.push(`${String(hour).padStart(2, "0")}:00`);
    options.push(`${String(hour).padStart(2, "0")}:30`);
  }

  return options;
}

const TIME_OPTIONS = buildHalfHourOptions();

export function NativeTimeSelect({
  value,
  onChange,
  className,
  disabled = false,
}: NativeTimeSelectProps) {
  const normalizedValue = normalizeTimeValue(value);

  return (
    <select
      value={normalizedValue}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "h-10 rounded-lg text-sm font-medium",
        "border border-gray-200 dark:border-white/10",
        "bg-white dark:bg-background",
        "text-gray-900 dark:text-gray-100",
        "outline-none",
        className,
      )}
    >
      {TIME_OPTIONS.map((time) => (
        <option key={time} value={time}>
          {time}
        </option>
      ))}
    </select>
  );
}