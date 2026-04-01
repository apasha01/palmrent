"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useMemo, useState } from "react";
import Header from "@/components/layouts/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  User,
  FileUp,
  Car,
  CreditCard,
  LogOut,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";

import ProfileDocuments from "@/components/profile/ProfileDocuments";
import ProfileMe from "@/components/profile/ProfileMe";

type TabKey = "me" | "documents" | "cars" | "transactions";

type MenuItem = {
  key: TabKey;
  label: string;
  icon: LucideIcon;
};

export default function ProfilePageClient() {
  const t = useTranslations("profile");
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [tab, setTab] = useState<TabKey>("me");

  const menuItems = useMemo<MenuItem[]>(
    () => [
      { key: "me", label: t("menu.me"), icon: User },
      { key: "documents", label: t("menu.documents"), icon: FileUp },
      { key: "cars", label: t("menu.cars"), icon: Car },
      { key: "transactions", label: t("menu.transactions"), icon: CreditCard },
    ],
    [t]
  );

  const displayName = useMemo(() => {
    const n = String((user as any)?.name ?? "").trim();
    return n || t("common.user");
  }, [user, t]);

  const phone = useMemo(() => {
    const p =
      (user as any)?.mobile ??
      (user as any)?.phone ??
      (user as any)?.username ??
      "";

    return String(p || "").trim();
  }, [user]);

  const email = useMemo(() => {
    return String((user as any)?.email ?? "").trim();
  }, [user]);

  const activeContent = useMemo(() => {
    switch (tab) {
      case "me":
        return (
          <ProfileMe
            user={user}
            onUserUpdated={(nextUser) => {
              console.log("user updated:", nextUser);
            }}
          />
        );

      case "documents":
        return <ProfileDocuments />;

      case "cars":
        return <ProfileCars />;

      case "transactions":
        return <ProfileTransactions />;

      default:
        return <ProfileMe user={user} />;
    }
  }, [tab, user]);

  if (!isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Header />

        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="rounded-2xl border bg-card p-6">
            <h1 className="text-lg font-bold">{t("pageTitle")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("auth.required")}
            </p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />

      <main className="mx-auto max-w-7xl px-2 py-2">
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
          <aside className="md:col-span-3">
            <div className="rounded-2xl border bg-card p-4">
              <div className="mb-3">
                <p className="mt-0.5 text-lg font-bold">{displayName}</p>

                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {phone ? <div>{t("sidebar.phone", { value: phone })}</div> : null}
                  {email ? <div>{t("sidebar.email", { value: email })}</div> : null}
                </div>
              </div>

              <div className="my-3 h-px bg-border" />

              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <MenuButton
                    key={item.key}
                    active={tab === item.key}
                    icon={item.icon}
                    label={item.label}
                    onClick={() => setTab(item.key)}
                  />
                ))}
              </nav>

              <div className="my-3 h-px bg-border" />

              <button
                type="button"
                onClick={logout}
                className={cn(
                  "flex h-11 w-full items-center justify-between gap-2 rounded-xl px-3",
                  "border border-transparent transition hover:border-destructive/10 hover:bg-destructive/10"
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10">
                    <LogOut className="h-4 w-4 text-destructive" />
                  </span>
                  <span className="text-sm font-bold text-destructive">
                    {t("actions.logout")}
                  </span>
                </span>

                <ChevronLeft className="h-4 w-4 text-destructive/70" />
              </button>
            </div>
          </aside>

          <section className="space-y-4 md:col-span-9">{activeContent}</section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-11 w-full items-center justify-between gap-2 rounded-xl px-3",
        "border transition",
        active
          ? "border-primary/10 bg-muted/70"
          : "border-transparent hover:border-primary/5 hover:bg-muted/60"
      )}
    >
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-xl",
            active ? "bg-primary/10" : "bg-muted/60"
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4",
              active ? "text-primary" : "text-muted-foreground"
            )}
          />
        </span>

        <span className="text-sm font-semibold text-foreground/90">
          {label}
        </span>
      </span>

      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

function ProfileCars() {
  const t = useTranslations("profile.cars");

  return (
    <div className="rounded-2xl border bg-card p-4 md:p-6">
      <h2 className="text-base font-bold">{t("title")}</h2>
      <div className="mt-3 text-sm text-muted-foreground">{t("empty")}</div>
    </div>
  );
}

function ProfileTransactions() {
  const t = useTranslations("profile.transactions");

  return (
    <div className="rounded-2xl border bg-card p-4 md:p-6">
      <h2 className="text-base font-bold">{t("title")}</h2>
      <div className="mt-3 text-sm text-muted-foreground">{t("empty")}</div>
    </div>
  );
}