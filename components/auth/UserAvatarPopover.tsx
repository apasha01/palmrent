/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { User, LogOut, CreditCard } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function UserAvatarPopover() {
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) return null;

  const avatarUrl = user?.avatar || user?.image || null;
  const displayName = (user?.name || "").trim();
  const fallbackLetter = displayName ? displayName[0]?.toUpperCase() : "";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="outline-none">
          <Avatar className="w-9 h-9">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={displayName || "کاربر"} />
            ) : (
              <AvatarFallback className="bg-secondary font-black">
                {fallbackLetter ? (
                  <span className="text-sm leading-none">{fallbackLetter}</span>
                ) : (
                  <User className="h-5 w-5 text-muted-foreground" />
                )}
              </AvatarFallback>
            )}
          </Avatar>
        </button>
      </PopoverTrigger>

      <PopoverContent  className="w-72 ">
        <p className="font-black text-xl mb-3">{displayName || "کاربر"}</p>

        <div className="space-y-1">
          <MenuItem href="/profile" icon={User} label="پروفایل کاربری" />
          <MenuItem href="/billing" icon={CreditCard} label="پرداخت‌ها / کیف پول" />
          <MenuItem
            icon={LogOut}
            label="خروج از حساب"
            intent="danger"
            onClick={logout}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

type MenuItemProps =
  | {
      href: string;
      icon: any;
      label: string;
      intent?: "default" | "danger";
      onClick?: never;
    }
  | {
      href?: never;
      icon: any;
      label: string;
      intent?: "default" | "danger";
      onClick: () => void;
    };

function MenuItem({ href, icon: Icon, label, intent = "default", onClick }: MenuItemProps) {
  const isDanger = intent === "danger";

  const baseBtn =
    "w-full justify-start gap-3 h-12 rounded-2xl transition-all border border-transparent hover:border-primary/5";
  const baseHover = "hover:bg-primary/5";
  const dangerHover = "hover:bg-destructive/10";

  const iconBox =
    "inline-flex items-center justify-center w-9 h-9 rounded-xl bg-secondary/50";
  const iconColor = isDanger ? "text-destructive" : "text-muted-foreground";
  const labelColor = isDanger ? "text-destructive font-bold" : "text-foreground/80 font-semibold";

  // ✅ آیتم لینک‌دار
  if (href) {
    return (
      <Button asChild variant="ghost" className={cn(baseBtn, baseHover, isDanger && dangerHover)}>
        <Link href={href}>
          <span className={iconBox}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </span>
          <span className={cn("text-sm", labelColor)}>{label}</span>
        </Link>
      </Button>
    );
  }

  // ✅ آیتم اکشن (مثل خروج)
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(baseBtn, baseHover, isDanger && dangerHover)}
    >
      <span className={iconBox}>
        <Icon className={cn("h-5 w-5", iconColor)} />
      </span>
      <span className={cn("text-sm", labelColor)}>{label}</span>
    </Button>
  );
}
