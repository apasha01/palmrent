/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState } from "react";
import Header from "@/components/layouts/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { User, FileUp, Car, CreditCard, LogOut, ChevronLeft } from "lucide-react";
import ProfileDocuments from "@/components/profile/ProfileDocuments";


type TabKey = "me" | "documents" | "cars" | "transactions";

export default function ProfilePage() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  const menuItems = useMemo(
    () =>
      [
        { key: "me" as const, label: "مشخصات من", icon: User },
        { key: "documents" as const, label: "مدارک آپلود شده", icon: FileUp },
        { key: "cars" as const, label: "سابقه خودروهای من", icon: Car },
        { key: "transactions" as const, label: "تراکنش‌های من", icon: CreditCard },
      ] as const,
    []
  );

  const [tab, setTab] = useState<TabKey>("me");

  const displayName = useMemo(() => {
    const n = String((user as any)?.name ?? "").trim();
    return n || "کاربر";
  }, [user]);

  const phone = useMemo(() => {
    const p =
      (user as any)?.mobile ??
      (user as any)?.phone ??
      (user as any)?.username ??
      "";
    return String(p || "").trim();
  }, [user]);

  const email = useMemo(() => {
    const e = (user as any)?.email ?? "";
    return String(e || "").trim();
  }, [user]);

  const activeTitle = useMemo(() => {
    return menuItems.find((x) => x.key === tab)?.label ?? "پروفایل";
  }, [menuItems, tab]);

  // ✅ Active content memo (hookها شرطی نیستن)
  const ActiveContent = useMemo(() => {
    switch (tab) {
      case "me":
        return <ProfileMe user={user} />;
      case "documents":
        return <ProfileDocuments />; // ✅ از فایل جدا
      case "cars":
        return <ProfileCars />;
      case "transactions":
        return <ProfileTransactions />;
      default:
        return <ProfileMe user={user} />;
    }
  }, [tab, user]);

  // ✅ فقط بعد از hookها return شرطی
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-10">
          <div className="rounded-2xl border bg-card p-6">
            <h1 className="text-lg font-bold">پروفایل</h1>
            <p className="text-sm text-muted-foreground mt-2">
              برای مشاهده پروفایل، لطفاً وارد حساب کاربری شوید.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        <div className="rounded-2xl border bg-card p-4 md:p-6">
          <h1 className="text-xl md:text-2xl font-black">پروفایل</h1>
          <p className="text-sm text-muted-foreground mt-1">{activeTitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
          <aside className="md:col-span-3">
            <div className="rounded-2xl border bg-card p-4">
              <div className="mb-3">
                <p className="text-xs text-muted-foreground">خوش آمدی</p>
                <p className="text-lg font-bold mt-0.5">{displayName}</p>

                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {phone ? <div>شماره: {phone}</div> : null}
                  {email ? <div>ایمیل: {email}</div> : null}
                </div>
              </div>

              <div className="h-px bg-border my-3" />

              <nav className="space-y-1">
                {menuItems.map((it) => (
                  <MenuButton
                    key={it.key}
                    active={tab === it.key}
                    icon={it.icon}
                    label={it.label}
                    onClick={() => setTab(it.key)}
                  />
                ))}
              </nav>

              <div className="h-px bg-border my-3" />

              <button
                type="button"
                onClick={logout}
                className={cn(
                  "w-full flex items-center justify-between gap-2 h-11 px-3 rounded-xl",
                  "transition border border-transparent hover:border-destructive/10 hover:bg-destructive/10"
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-destructive/10">
                    <LogOut className="h-4 w-4 text-destructive" />
                  </span>
                  <span className="text-sm font-bold text-destructive">
                    خروج از حساب
                  </span>
                </span>
                <ChevronLeft className="h-4 w-4 text-destructive/70" />
              </button>
            </div>
          </aside>

          <section className="md:col-span-9 space-y-4">{ActiveContent}</section>
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
  icon: any;
  label: string;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between gap-2 h-11 px-3 rounded-xl",
        "transition border",
        active
          ? "bg-muted/70 border-primary/10"
          : "border-transparent hover:border-primary/5 hover:bg-muted/60"
      )}
    >
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center justify-center w-9 h-9 rounded-xl",
            active ? "bg-primary/10" : "bg-muted/60"
          )}
        >
          <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
        </span>

        <span className="text-sm font-semibold text-foreground/90">{label}</span>
      </span>

      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

function CardShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-4 md:p-6">
      <h2 className="text-base font-bold">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function ProfileMe({ user }: { user: any }) {
  const name = useMemo(() => String(user?.name ?? "").trim(), [user]);
  const mobile = useMemo(
    () => String(user?.mobile ?? user?.username ?? user?.phone ?? "").trim(),
    [user]
  );
  const email = useMemo(() => String(user?.email ?? "").trim(), [user]);

  return (
    <CardShell title="مشخصات کاربری">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <InfoRow label="نام کامل" value={name || "—"} />
        <InfoRow label="شماره" value={mobile || "—"} />
        <InfoRow label="ایمیل" value={email || "—"} />
      </div>
    </CardShell>
  );
}

function ProfileCars() {
  return (
    <CardShell title="سابقه خودروهای من">
      <div className="text-sm text-muted-foreground leading-6">
        اینجا بعداً لیست رزروها رو می‌ذاری.
      </div>
    </CardShell>
  );
}

function ProfileTransactions() {
  return (
    <CardShell title="تراکنش‌های من">
      <div className="text-sm text-muted-foreground leading-6">
        اینجا بعداً لیست تراکنش‌ها رو می‌ذاری.
      </div>
    </CardShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/30 px-3 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold mt-1">{value}</div>
    </div>
  );
}
