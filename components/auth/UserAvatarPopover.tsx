/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Link } from "@/i18n/navigation";
import { User, LogOut, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("userAvatarPopover");

  const { isAuthenticated, user, logout } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!isAuthenticated) return null;

  const avatarUrl = user?.avatar_url ?? undefined;

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
        <button
          type="button"
          className="outline-none"
          aria-label={t("openUserMenu")}
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatarUrl} alt={rawName || t("userAlt")} />
            <AvatarFallback className="flex items-center justify-center bg-muted text-sm font-bold">
              {hasName ? (
                fallbackLetter
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
            </AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-56 rounded-xl p-3 shadow-md">
        {hasName && (
          <>
            <div className="mb-2">
              <p className="text-sm font-semibold text-foreground">{rawName}</p>
            </div>
            <div className="my-2 h-px bg-border" />
          </>
        )}

        <MenuLink href="/profile" icon={User} label={t("profile")} />

        <div className="mt-1 flex h-9 items-center justify-between rounded-lg px-2 transition hover:bg-muted/60">
          <div className="flex items-center gap-2">
            {isDark ? (
              <Moon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Sun className="h-4 w-4 text-muted-foreground" />
            )}

            <span className="text-sm text-foreground/90">
              {isDark ? t("darkMode") : t("lightMode")}
            </span>
          </div>

          <Switch
            dir="ltr"
            checked={Boolean(isDark)}
            onCheckedChange={toggleTheme}
            disabled={!mounted}
            aria-label={t("themeSwitch")}
          />
        </div>

        <div className="my-2 h-px bg-border" />

        <MenuAction icon={LogOut} label={t("logout")} onClick={logout} />
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
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex h-9 items-center gap-2 rounded-lg px-2 transition hover:bg-muted/60"
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
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-9 w-full items-center gap-2 rounded-lg px-2",
        "transition hover:bg-destructive/10",
      )}
    >
      <Icon className="h-4 w-4 text-destructive" />
      <span className="text-sm text-destructive">{label}</span>
    </button>
  );
}