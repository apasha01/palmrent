"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { User, FileUp, Car, CreditCard } from "lucide-react";

export type TabKey = "me" | "documents" | "cars" | "transactions";

type Props = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
};

export default function ProfileTabs({ active, onChange }: Props) {
  const items = useMemo(
    () =>
      [
        { key: "me" as const, label: "مشخصات من", icon: User },
        { key: "documents" as const, label: "مدارک", icon: FileUp },
        { key: "cars" as const, label: "سابقه خودروها", icon: Car },
        { key: "transactions" as const, label: "تراکنش‌ها", icon: CreditCard },
      ] as const,
    []
  );

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.key;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={cn(
              "w-full flex items-center justify-between px-3 h-11 rounded-xl transition border",
              isActive
                ? "bg-muted border-primary/10"
                : "border-transparent hover:bg-muted/60"
            )}
          >
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center",
                  isActive ? "bg-primary/10" : "bg-muted/50"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </span>
              <span className="text-sm font-semibold">{item.label}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
