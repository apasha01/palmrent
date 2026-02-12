/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { User, LogOut } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function UserAvatarPopover() {
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) return null;

  const avatarUrl = user?.avatar || user?.image || "";
  const displayName = String(user?.name ?? "").trim() || "کاربر";
  const fallbackLetter = displayName?.[0]?.toUpperCase?.() || "U";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="outline-none">
          <Avatar className="h-9 w-9">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={displayName} />
            ) : (
              <AvatarFallback className="bg-muted text-sm font-bold">
                {fallbackLetter}
              </AvatarFallback>
            )}
          </Avatar>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-56 p-3 rounded-xl shadow-md"
      >
        {/* اسم کاربر */}
        <div className="mb-2">
          <p className="text-sm font-semibold text-foreground">
            {displayName}
          </p>
        </div>

        <div className="h-px bg-border my-2" />

        {/* پروفایل */}
        <MenuLink href="/profile" icon={User} label="پروفایل" />

        {/* خروج */}
        <MenuAction
          icon={LogOut}
          label="خروج"
          onClick={logout}
        />
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
        "hover:bg-destructive/10 transition"
      )}
    >
      <Icon className="h-4 w-4 text-destructive" />
      <span className="text-sm text-destructive">{label}</span>
    </button>
  );
}
