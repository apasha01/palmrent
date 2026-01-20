"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpLeft,
  Download,
  Globe,
  Smartphone,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
  Bell,
  BadgeCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/layouts/Header";
import Footer from "@/components/Footer";

type Props = {
  androidHref?: string;
  iosHref?: string;
  webHref?: string;
  helpHref?: string;
  logoSrc?: string;
  appName?: string;
  subtitle?: string;
};

/**
 * ✅ صفحه UI دانلود اپ - رنگی‌تر + انیمیشن بیشتر (بدون کتابخانه اضافی)
 * نکته: برای انیمیشن‌ها از کلاس‌های Tailwind + animate استفاده شده.
 * اگر animate-float/animate-blob در پروژه‌ت نیست، همین فایل خودش تعریفشون می‌کنه (style jsx).
 */
export default function DownloadAppPageUI({
  androidHref = "#",
  iosHref = "#",
  webHref = "#",
  helpHref = "#",
  logoSrc = "/images/logo.png",
  appName = "Palm Rent",
  subtitle = "اپلیکیشن را نصب کنید، سریع‌تر رزرو کنید و وضعیت سفارش را لحظه‌ای ببینید.",
}: Props) {
  return (
    
    <div className="relative  w-full overflow-hidden bg-background">
        <Header />
      {/* ---------------- Decorative animated background ---------------- */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 h-[26rem] w-[26rem] rounded-full bg-gradient-to-br from-blue-500/30 via-cyan-400/20 to-transparent blur-3xl animate-blob" />
        <div className="absolute top-24 -left-32 h-[24rem] w-[24rem] rounded-full bg-gradient-to-br from-emerald-500/25 via-teal-400/15 to-transparent blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-40 left-1/3 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-fuchsia-500/20 via-purple-500/15 to-transparent blur-3xl animate-blob animation-delay-4000" />

        {/* soft grid */}
        <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(#000_1px,transparent_1px)] [background-size:18px_18px] dark:opacity-[0.10]" />
      </div>

      <main className="relative mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
        {/* ---------------- Top bar ---------------- */}
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2">
            <Badge
              variant="secondary"
              className="rounded-full border border-white/20 bg-white/70 backdrop-blur dark:bg-white/10"
            >
              <Sparkles className="me-1 h-4 w-4" />
              نسخه جدید
            </Badge>

            <Badge
              variant="outline"
              className="rounded-full bg-background/60 backdrop-blur"
            >
              تجربه سریع‌تر و رنگی‌تر ✨
            </Badge>
          </div>

          <Link href={webHref} className="hidden sm:inline-flex">
            <Button
              variant="ghost"
              className="gap-2 hover:bg-white/40 dark:hover:bg-white/10"
            >
              <Globe className="h-4 w-4" />
              ورود به نسخه وب
              <ArrowUpLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* ---------------- Hero ---------------- */}
        <div className="mt-8 grid items-center gap-6 md:mt-10 md:grid-cols-2 md:gap-10">
          {/* Left: copy */}
          <div className="flex flex-col gap-4">
            {/* Logo + Title */}
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-2xl border bg-white/70 shadow-sm backdrop-blur dark:bg-white/10">
                <Image
                  src={logoSrc}
                  alt={`${appName} logo`}
                  fill
                  className="object-contain p-2"
                  priority
                />
              </div>

              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground">اپلیکیشن</p>
                <h1 className="text-2xl font-bold leading-tight md:text-4xl">
                  {appName} را دانلود کنید
                </h1>
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-sm leading-7 text-muted-foreground md:text-base">
              {subtitle}
            </p>

            {/* Gradient info bar */}
            <div className="rounded-2xl border bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 p-4 backdrop-blur">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-2 font-semibold">
                  <Zap className="h-4 w-4" />
                  رزرو سریع‌تر
                </span>
                <Separator orientation="vertical" className="hidden h-4 sm:block" />
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Bell className="h-4 w-4" />
                  اعلان وضعیت سفارش
                </span>
                <Separator orientation="vertical" className="hidden h-4 sm:block" />
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <BadgeCheck className="h-4 w-4" />
                  پشتیبانی ۲۴/۷
                </span>
              </div>
            </div>

            {/* Highlights (more colorful + hover animations) */}
            <div className="mt-1 grid gap-3 sm:grid-cols-3">
              <Card className="group rounded-2xl border bg-white/60 backdrop-blur transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-white/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/15">
                      <Smartphone className="h-4 w-4" />
                    </span>
                    نصب آسان
                  </div>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    دانلود مستقیم یا از مارکت‌ها، بدون دردسر.
                  </p>
                  <div className="mt-3 h-1 w-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all group-hover:w-full" />
                </CardContent>
              </Card>

              <Card className="group rounded-2xl border bg-white/60 backdrop-blur transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-white/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    امن و مطمئن
                  </div>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    لینک‌های رسمی + راهنمای نصب و پشتیبانی.
                  </p>
                  <div className="mt-3 h-1 w-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all group-hover:w-full" />
                </CardContent>
              </Card>

              <Card className="group rounded-2xl border bg-white/60 backdrop-blur transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-white/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-fuchsia-500/15">
                      <Star className="h-4 w-4" />
                    </span>
                    تجربه بهتر
                  </div>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    رزرو سریع‌تر، مدیریت سفارش، پیشنهادهای ویژه.
                  </p>
                  <div className="mt-3 h-1 w-0 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-400 transition-all group-hover:w-full" />
                </CardContent>
              </Card>
            </div>

            {/* Primary CTAs (more colorful) */}
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-2xl gap-2 shadow-md transition-transform hover:-translate-y-0.5 hover:shadow-xl"
              >
                <a
                  href={androidHref}
                  className="relative overflow-hidden"
                >
                  <span className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 opacity-90" />
                  <span className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.4),transparent_60%)]" />
                  <Download className="h-4 w-4" />
                  دانلود اندروید
                </a>
              </Button>

              <Button
                asChild
                size="lg"
                variant="secondary"
                className="h-12 rounded-2xl gap-2 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-lg"
              >
                <a href={iosHref}>
                  <Download className="h-4 w-4" />
                  دانلود iOS
                </a>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-2xl gap-2 transition-transform hover:-translate-y-0.5 hover:bg-white/50 dark:hover:bg-white/10"
              >
                <a href={webHref}>
                  <Globe className="h-4 w-4" />
                  نسخه وب
                  <ArrowUpLeft className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>مشکل در نصب دارید؟</span>
              <Link href={helpHref} className="underline underline-offset-4">
                راهنمای نصب / پشتیبانی
              </Link>
            </div>
          </div>

          {/* Right: phone mock (animated + colorful) */}
          <div className="relative">
            <div className="mx-auto w-full max-w-md">
              {/* Floating sparkle dots */}
              <div className="pointer-events-none absolute -top-8 left-6 hidden sm:block">
                <div className="h-2 w-2 rounded-full bg-blue-500/60 animate-float" />
              </div>
              <div className="pointer-events-none absolute -top-2 right-14 hidden sm:block">
                <div className="h-3 w-3 rounded-full bg-emerald-500/50 animate-float animation-delay-800" />
              </div>
              <div className="pointer-events-none absolute bottom-10 -left-3 hidden sm:block">
                <div className="h-2.5 w-2.5 rounded-full bg-fuchsia-500/50 animate-float animation-delay-1600" />
              </div>

              <div className="relative rounded-[2.8rem] border bg-card/70 p-3 shadow-2xl backdrop-blur">
                {/* gradient border glow */}
                <div className="pointer-events-none absolute -inset-0.5 rounded-[2.9rem] bg-gradient-to-r from-blue-500/30 via-purple-500/25 to-emerald-500/30 blur-xl" />

                {/* Top shine */}
                <div className="pointer-events-none absolute inset-0 rounded-[2.8rem] bg-gradient-to-b from-white/50 to-transparent dark:from-white/10" />

                {/* Screen */}
                <div className="relative overflow-hidden rounded-[2.2rem] border bg-background">
                  {/* mini header */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-2xl border bg-gradient-to-br from-blue-500/15 via-purple-500/10 to-emerald-500/15" />
                      <div>
                        <div className="h-3 w-28 rounded bg-muted" />
                        <div className="mt-2 h-3 w-20 rounded bg-muted" />
                      </div>
                    </div>
                    <div className="h-8 w-16 rounded-full bg-muted" />
                  </div>

                  <Separator />

                  {/* content placeholders */}
                  <div className="p-4">
                    <div className="grid gap-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-16 rounded-2xl bg-muted transition-all hover:bg-muted/70"
                        />
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="h-24 rounded-2xl bg-muted" />
                      <div className="h-24 rounded-2xl bg-muted" />
                    </div>

                    <div className="mt-4 h-12 rounded-2xl bg-muted" />
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -left-2 top-10 hidden -rotate-6 sm:block">
                  <div className="rounded-2xl border bg-background/80 px-3 py-2 shadow-md backdrop-blur animate-float">
                    <p className="text-xs font-semibold">رزرو سریع</p>
                    <p className="text-[11px] text-muted-foreground">
                      کمتر از ۱ دقیقه
                    </p>
                  </div>
                </div>

                <div className="absolute -right-2 bottom-10 hidden rotate-6 sm:block">
                  <div className="rounded-2xl border bg-background/80 px-3 py-2 shadow-md backdrop-blur animate-float animation-delay-1200">
                    <p className="text-xs font-semibold">پشتیبانی ۲۴/۷</p>
                    <p className="text-[11px] text-muted-foreground">
                      واتساپ و تماس
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile web CTA */}
              <div className="mt-4 sm:hidden">
                <Link href={webHref} className="block">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 w-full rounded-2xl gap-2 hover:bg-white/50 dark:hover:bg-white/10"
                  >
                    <Globe className="h-4 w-4" />
                    ورود به نسخه وب
                    <ArrowUpLeft className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- Bottom section ---------------- */}
        <div className="mt-10 md:mt-14">
          <Card className="rounded-3xl border bg-white/60 backdrop-blur dark:bg-white/5">
            <CardContent className="p-5 md:p-7">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <p className="text-base font-semibold md:text-lg">
                    سه راه سریع برای استفاده
                  </p>
                  <p className="text-sm text-muted-foreground">
                    اپلیکیشن را نصب کنید یا بدون نصب از نسخه وب استفاده شامل امکانات کامل.
                  </p>
                </div>

                <div className="grid w-full gap-3 md:w-auto md:grid-cols-3">
                  <Button
                    asChild
                    variant="outline"
                    className="h-12 rounded-2xl gap-2 hover:bg-white/50 dark:hover:bg-white/10"
                  >
                    <a href={androidHref}>
                      <Download className="h-4 w-4" />
                      اندروید
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-12 rounded-2xl gap-2 hover:bg-white/50 dark:hover:bg-white/10"
                  >
                    <a href={iosHref}>
                      <Download className="h-4 w-4" />
                      iOS
                    </a>
                  </Button>
                  <Button
                    asChild
                    className="h-12 rounded-2xl gap-2 shadow-md transition-transform hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <a href={webHref} className="relative overflow-hidden">
                      <span className="absolute inset-0 -z-10 bg-gradient-to-r from-fuchsia-600 via-purple-500 to-blue-500 opacity-90" />
                      <span className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.4),transparent_60%)]" />
                      <Globe className="h-4 w-4" />
                      نسخه وب
                      <ArrowUpLeft className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            با نصب اپلیکیشن، از پیشنهادها و رزرو سریع‌تر بهره‌مند می‌شوید.
          </p>
        </div>
      </main>

      {/* ---------------- Local animation helpers ---------------- */}
      <style jsx global>{`
        @keyframes floaty {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: floaty 3.5s ease-in-out infinite;
        }

        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(25px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s ease-in-out infinite;
        }
        .animation-delay-800 { animation-delay: 0.8s; }
        .animation-delay-1200 { animation-delay: 1.2s; }
        .animation-delay-1600 { animation-delay: 1.6s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>


<Footer />

    </div>
  );
}
