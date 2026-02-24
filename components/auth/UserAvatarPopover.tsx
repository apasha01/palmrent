/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import React from "react";
import { User, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function UserAvatarPopover() {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!isAuthenticated) return null;

  const avatarUrl = user?.avatar_url;

  const rawName = String(user?.name ?? "").trim();
  const hasName = rawName.length > 0;

  const fallbackLetter = hasName ? rawName.charAt(0).toUpperCase() : null;

  const isDark = mounted ? (resolvedTheme ?? theme) === "dark" : false;

  const toggleTheme = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="outline-none">
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatarUrl || undefined} alt={rawName || "User"} />
            <AvatarFallback className="bg-muted text-sm font-bold flex items-center justify-center">
              {hasName ? (
                fallbackLetter
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
            </AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-56 p-3 rounded-xl shadow-md">
        {/* نام */}
        {hasName && (
          <>
            <div className="mb-2">
              <p className="text-sm font-semibold text-foreground">{rawName}</p>
            </div>
            <div className="h-px bg-border my-2" />
          </>
        )}

        {/* پروفایل */}
        <MenuLink href="/profile" icon={User} label="پروفایل" />

        {/* سوییچ تم (زیر پروفایل) */}
        <div className="flex items-center justify-between h-9 px-2 rounded-lg hover:bg-muted/60 transition mt-1">
          <div className="flex items-center gap-2">
            {isDark ? (
              <Moon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Sun className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm text-foreground/90">
              {isDark ? "حالت شب" : "حالت روز"}
            </span>
          </div>

          <Switch
            dir="ltr"
            checked={!!isDark}
            onCheckedChange={toggleTheme}
            disabled={!mounted}
          />
        </div>

        <div className="h-px bg-border my-2" />

        {/* خروج (آخرین آیتم) */}
        <MenuAction icon={LogOut} label="خروج" onClick={logout} />
      </PopoverContent>
    </Popover>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: any;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-muted/60 transition"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-foreground/90">{label}</span>
    </Link>
  );
}

function MenuAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: any;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 h-9 px-2 rounded-lg",
        "hover:bg-destructive/10 transition",
      )}
    >
      <Icon className="h-4 w-4 text-destructive" />
      <span className="text-sm text-destructive">{label}</span>
    </button>
  );
}
